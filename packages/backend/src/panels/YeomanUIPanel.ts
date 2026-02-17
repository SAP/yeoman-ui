import { isEmpty, get, assign } from "lodash";
import { join } from "path";
import * as vscode from "vscode";
import { YeomanUI } from "../yeomanui";
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";
import { GeneratorFilter } from "../filter";
import backendMessages from "../messages";
import { YouiEvents } from "../youi-events";
import { VSCodeYouiEvents } from "../vscode-youi-events";
import { AbstractWebviewPanel } from "./AbstractWebviewPanel";
import { GeneratorOutput } from "../vscode-output";
import { Env } from "../utils/env";
import { getWebviewRpcLibraryLogger } from "../logger/logger-wrapper";
import { homedir } from "os";
import { NpmCommand } from "../utils/npm";
import { Constants } from "../utils/constants";
import { notifyGeneratorsInstallationProgress } from "../utils/generators-installation-progress";
import messages from "../messages";
import { getWorkspaceFolders, getFileSchemeWorkspaceFolders } from "../utils/workspaceFolders";

export class YeomanUIPanel extends AbstractWebviewPanel {
  public static YEOMAN_UI = "Application Wizard";

  public toggleOutput() {
    this.output?.show();
  }

  public notifyGeneratorsChange(args?: any[]) {
    const yeomanUi = get(this, "yeomanui");
    this.installGens = !yeomanUi && isEmpty(args) ? undefined : args;
    if (yeomanUi) {
      if (!this.installGens) {
        void yeomanUi._notifyGeneratorsChange();
      } else {
        void yeomanUi._notifyGeneratorsInstall(this.installGens);
        if (isEmpty(this.installGens)) {
          Env.loadNpmPath(true); // force to reload the env existing npm paths
          void yeomanUi._notifyGeneratorsChange();
          this.installGens = undefined;
        }
      }
    }
  }

  // clean up the current yeomanui instance on close panel
  private reset() {
    this.yeomanui = null;
  }

  private async ensureValidTargetFolder(): Promise<{ originalTargetFolder: string; wasModified: boolean }> {
    const originalTargetFolder = vscode.workspace.getConfiguration()?.get<string>("ApplicationWizard.TargetFolder");
    const supportedFileWorkspaceFolders = getWorkspaceFolders();

    // If there are in-memory folders, ensure targetFolder is a valid physical path that will load yeoman UI
    const hasInMemoryFolders =
      (vscode.workspace.workspaceFolders?.length ?? 0) !== (supportedFileWorkspaceFolders?.length ?? 0);

    if (hasInMemoryFolders) {
      // Using logical OR to ensure we don't set empty string, which is an invalid state
      const workspaceFolder = originalTargetFolder?.trim() || supportedFileWorkspaceFolders?.[0]?.trim() || "";
      const targetFolder = workspaceFolder || join(homedir(), "projects");

      await vscode.workspace
        .getConfiguration()
        .update("ApplicationWizard.TargetFolder", targetFolder, vscode.ConfigurationTarget.Global);

      return { originalTargetFolder, wasModified: true };
    }

    return { originalTargetFolder, wasModified: false };
  }

  public async loadWebviewPanel(uiOptions?: any): Promise<void> {
    // Ensure valid target folder when virtual workspaces are present
    await this.ensureValidTargetFolder();
    if (!Constants.IS_IN_BAS && (await NpmCommand.getNodeProcessVersions()).node === undefined) {
      void vscode.window.showErrorMessage(messages.nodejs_install_not_found);
    }
    const genNamespace = uiOptions?.generator;
    if (genNamespace) {
      const gensNS = await Env.getAllGeneratorNamespaces();
      const generator = gensNS.find((genNS) => genNS === genNamespace);
      if (!generator) {
        await this.tryToInstallGenerator(genNamespace);
      }
    }

    return super.loadWebviewPanel(uiOptions, [{ dispose: () => this.reset() }]);
  }

  private async tryToInstallGenerator(genNamespace: string) {
    if (!Constants.IS_IN_BAS) {
      await NpmCommand.checkAccessAndSetGeneratorsPath();
      const genFullName = Env.getGeneratorFullName(genNamespace);
      await vscode.commands.executeCommand("exploreGenerators", {
        package: { name: genFullName },
      });
    }
  }

  public async runGenerator() {
    const genNamespaces = await Env.getAllGeneratorNamespaces();
    const generator = await vscode.window.showQuickPick(genNamespaces);
    if (generator) {
      return this.loadWebviewPanel({ generator });
    }
  }

  public setWebviewPanel(webViewPanel: vscode.WebviewPanel, uiOptions?: unknown) {
    super.setWebviewPanel(webViewPanel);

    this.messages = assign({}, backendMessages, get(uiOptions, "messages", {}));
    const filter = GeneratorFilter.create(get(uiOptions, "filter"));
    const generator = get(uiOptions, "generator");

    this.rpc = new RpcExtension(this.webViewPanel.webview, getWebviewRpcLibraryLogger());
    this.output.setChannelName(`${YeomanUIPanel.YEOMAN_UI}.${this.messages.channel_name}`);
    const vscodeYouiEvents: YouiEvents = new VSCodeYouiEvents(this.rpc, this.webViewPanel, this.messages, this.output);

    this.initWebviewPanel();

    this.yeomanui = new YeomanUI(
      this.rpc,
      vscodeYouiEvents,
      this.output,
      this.logger,
      {
        generator,
        filter,
        messages: this.messages,
        installGens: this.installGens,
        data: get(uiOptions, "data"),
      },
      this.flowPromise.state,
    );
    this.yeomanui.registerCustomQuestionEventHandler("file-browser", "getFilePath", this.showOpenFileDialog.bind(this));
    this.yeomanui.registerCustomQuestionEventHandler("folder-browser", "getPath", this.showOpenFolderDialog.bind(this));
  }

  private yeomanui: YeomanUI;
  private messages: any;
  private installGens: any;
  private readonly output: GeneratorOutput;

  public constructor(context: Partial<vscode.ExtensionContext>) {
    super(context);
    this.viewType = "yeomanui";
    this.viewTitle = YeomanUIPanel.YEOMAN_UI;
    this.focusedKey = "yeomanUI.Focused";
    this.output = new GeneratorOutput();
  }

  private async showOpenFileDialog(currentPath: string): Promise<string> {
    return this.showOpenDialog(currentPath, true);
  }

  private async showOpenFolderDialog(currentPath: string): Promise<string> {
    return this.showOpenDialog(currentPath, false);
  }

  private async showOpenDialog(currentPath: string, canSelectFiles: boolean): Promise<string> {
    const canSelectFolders = !canSelectFiles;

    let uri;
    try {
      if (isEmpty(currentPath)) {
        throw new Error("Empty path");
      }
      uri = vscode.Uri.file(currentPath);
    } catch (e) {
      const workspaceFolders = getFileSchemeWorkspaceFolders();
      uri = workspaceFolders.length > 0 ? workspaceFolders[0].uri : vscode.Uri.file(join(homedir()));
    }

    try {
      const filePath = await vscode.window.showOpenDialog({
        canSelectFiles,
        canSelectFolders,
        defaultUri: uri,
      });
      return get(filePath, "[0].fsPath", currentPath);
    } catch (error) {
      return currentPath;
    }
  }

  public disposeWebviewPanel() {
    super.disposeWebviewPanel();
    this.yeomanui = null;
  }

  public initWebviewPanel() {
    super.initWebviewPanel();
    this.webViewPanel.title = this.messages.panel_title;
    void notifyGeneratorsInstallationProgress(this);
  }
}
