import * as _ from "lodash";
import * as path from "path";
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
import { RejectType, ResolveType, YoUiFlowPromise } from "src/utils/promise";

export class YeomanUIPanel extends AbstractWebviewPanel {
  public static YEOMAN_UI = "Application Wizard";

  public toggleOutput() {
    this.output.show();
  }

  public notifyGeneratorsChange(args?: any[]) {
    const yeomanUi = _.get(this, "yeomanui");
    this.installGens = !yeomanUi && _.isEmpty(args) ? undefined : args;
    if (yeomanUi) {
      if (!this.installGens) {
        yeomanUi._notifyGeneratorsChange();
      } else {
        yeomanUi._notifyGeneratorsInstall(this.installGens);
        if (_.isEmpty(this.installGens)) {
          yeomanUi._notifyGeneratorsChange();
          this.installGens = undefined;
        }
      }
    }
  }

  private setYoUiPromises() {
    this.yoUiCommandPromise = new Promise((resolve: ResolveType, reject: RejectType) => {
      this.yoUiFlowPromise = { resolve, reject };
    });
  }

  private cleanYoUiPromises() {
    if (this.yoUiFlowPromise) {
      // resolves promise in case panel is closed manually by an user
      // it is save to call resolve several times on same promise
      this.yoUiFlowPromise.resolve();
    }
    this.yoUiCommandPromise = null;
    this.yoUiFlowPromise = null;
  }

  public async loadWebviewPanel(uiOptions?: any): Promise<void> {
    const genNamespace = uiOptions?.generator;
    if (genNamespace) {
      const gensNS = await Env.getAllGeneratorNamespaces();
      const generator = gensNS.find((genNS) => genNS === genNamespace);
      if (!generator) {
        await this.tryToInstallGenerator(genNamespace);
      }
    }

    await super.loadWebviewPanel(uiOptions);

    return this.yoUiCommandPromise;
  }

  private async tryToInstallGenerator(genNamespace: string) {
    if (!this.isInBAS) {
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

  public async setWebviewPanel(webViewPanel: vscode.WebviewPanel, uiOptions?: unknown): Promise<void> {
    this.setYoUiPromises();

    await super.setWebviewPanel(webViewPanel);

    this.messages = _.assign({}, backendMessages, _.get(uiOptions, "messages", {}));
    const filter = GeneratorFilter.create(_.get(uiOptions, "filter"));
    const generator = _.get(uiOptions, "generator");

    this.rpc = new RpcExtension(this.webViewPanel.webview, getWebviewRpcLibraryLogger());
    this.output.setChannelName(`${YeomanUIPanel.YEOMAN_UI}.${this.messages.channel_name}`);
    const vscodeYouiEvents: YouiEvents = new VSCodeYouiEvents(
      this.rpc,
      this.webViewPanel,
      this.messages,
      this.output,
      this.isInBAS
    );

    this.initWebviewPanel();

    const outputPath = this.isInBAS ? undefined : _.get(vscode, "workspace.workspaceFolders[0].uri.fsPath");
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
        data: _.get(uiOptions, "data"),
      },
      outputPath,
      this.yoUiFlowPromise
    );
    this.yeomanui.registerCustomQuestionEventHandler("file-browser", "getFilePath", this.showOpenFileDialog.bind(this));
    this.yeomanui.registerCustomQuestionEventHandler("folder-browser", "getPath", this.showOpenFolderDialog.bind(this));
  }

  private yeomanui: YeomanUI;
  private messages: any;
  private installGens: any;
  private readonly output: GeneratorOutput;
  private yoUiCommandPromise: Promise<void>;
  private yoUiFlowPromise: YoUiFlowPromise;

  public constructor(context: Partial<vscode.ExtensionContext>) {
    super(context);
    this.viewType = "yeomanui";
    this.viewTitle = YeomanUIPanel.YEOMAN_UI;
    this.focusedKey = "yeomanUI.Focused";
    this.output = new GeneratorOutput();
  }

  private async showOpenFileDialog(currentPath: string): Promise<string> {
    return await this.showOpenDialog(currentPath, true);
  }

  private async showOpenFolderDialog(currentPath: string): Promise<string> {
    return await this.showOpenDialog(currentPath, false);
  }

  private async showOpenDialog(currentPath: string, canSelectFiles: boolean): Promise<string> {
    const canSelectFolders = !canSelectFiles;

    let uri;
    try {
      if (_.isEmpty(currentPath)) {
        throw new Error("Empty path");
      }
      uri = vscode.Uri.file(currentPath);
    } catch (e) {
      uri = _.get(vscode, "workspace.workspaceFolders[0].uri");
      if (_.isNil(uri)) {
        uri = vscode.Uri.file(path.join(homedir()));
      }
    }

    try {
      const filePath = await vscode.window.showOpenDialog({
        canSelectFiles,
        canSelectFolders,
        defaultUri: uri,
      });
      return _.get(filePath, "[0].fsPath", currentPath);
    } catch (error) {
      return currentPath;
    }
  }

  public disposeWebviewPanel() {
    super.disposeWebviewPanel();
    this.yeomanui = null;
  }

  public dispose() {
    super.dispose();
    this.cleanYoUiPromises();
  }

  public initWebviewPanel() {
    super.initWebviewPanel();
    this.webViewPanel.title = this.messages.panel_title;
  }
}
