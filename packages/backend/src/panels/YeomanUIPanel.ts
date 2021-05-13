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
import { NpmCommand } from "../utils/npm";
import { getWebviewRpcLibraryLogger } from "../logger/logger-wrapper";
import { homedir } from "os";

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

  public async loadWebviewPanel(uiOptions?: any) {
    const genNamespaceToRun = uiOptions?.generator;
    if (genNamespaceToRun) {
      const generator = Env.getGenNamespaces().find((genNamespace) => genNamespace === genNamespaceToRun);
      if (generator) {
        uiOptions = { generator };
      } else if (!this.isInBAS) {
        // try installing generator and openning the panel again
        const genFullName = Env.getGeneratorFullName(genNamespaceToRun);
        await vscode.commands.executeCommand("exploreGenerators", {
          package: { name: genFullName },
        });
      }
    }

    // // TODO: remove 3 lines (for testing)
    // const testNamespace = "@sap/fiori:app";
    // const genFullName = Env.getGeneratorFullName(testNamespace);
    // await vscode.commands.executeCommand("exploreGenerators", { package: { name: genFullName } });
    // uiOptions = { generator: testNamespace };

    super.loadWebviewPanel(uiOptions);
  }

  public async runGenerator() {
    const generator = await vscode.window.showQuickPick(Env.getGenNamespaces());
    if (generator) {
      this.loadWebviewPanel({ generator });
    }
  }

  public setWebviewPanel(webViewPanel: vscode.WebviewPanel, uiOptions?: any): Promise<unknown> {
    super.setWebviewPanel(webViewPanel);

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
    return new Promise((resolve: (value: unknown) => void, reject: (value: unknown) => void) => {
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
        { resolve, reject }
      );
      this.yeomanui.registerCustomQuestionEventHandler(
        "file-browser",
        "getFilePath",
        this.showOpenFileDialog.bind(this)
      );
      this.yeomanui.registerCustomQuestionEventHandler(
        "folder-browser",
        "getPath",
        this.showOpenFolderDialog.bind(this)
      );
    });
  }

  private yeomanui: YeomanUI;
  private messages: any;
  private installGens: any;
  private readonly output: GeneratorOutput;

  public constructor(context: vscode.ExtensionContext) {
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

  public initWebviewPanel() {
    super.initWebviewPanel();
    this.webViewPanel.title = this.messages.panel_title;
  }
}
