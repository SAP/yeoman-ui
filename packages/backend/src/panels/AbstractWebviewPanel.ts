import * as vscode from "vscode";
import * as path from "path";
import * as _ from "lodash";
import * as fsextra from "fs-extra";
import { IChildLogger } from "@vscode-logging/logger";
import { getClassLogger } from "../logger/logger-wrapper";
import Environment = require("yeoman-environment");
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";

export abstract class AbstractWebviewPanel {
  public viewType: string;
  protected extensionPath: string;
  protected mediaPath: string;
  protected viewTitle: string;
  protected webViewPanel: vscode.WebviewPanel;
  protected focusedKey: string;
  protected htmlFileName: string;
  protected state: any;
  protected context: vscode.ExtensionContext;

  protected readonly logger: IChildLogger;
  protected disposables: vscode.Disposable[];
  protected isInBAS: boolean;
  protected rpc: RpcExtension;

  protected static readonly npmGlobalPaths: string[] = Environment.createEnv().getNpmPaths();

  public loadWebviewPanel(uiOptions?: any) {
    this.disposeWebviewPanel();
    const webViewPanel = this.createWebviewPanel();
    this.setWebviewPanel(webViewPanel, uiOptions);
  }

  protected constructor(context: vscode.ExtensionContext) {
    this.extensionPath = context.extensionPath;
    this.mediaPath = path.join(context.extensionPath, "dist", "media");
    this.htmlFileName = "index.html";
    this.logger = getClassLogger("AbstractWebviewPanel");
    this.disposables = [];
    this.context = context;
    this.isInBAS = !_.isEmpty(_.get(process, "env.WS_BASE_URL"));
  }

  public setWebviewPanel(webviewPanel: vscode.WebviewPanel, state?: any) {
    this.webViewPanel = webviewPanel;
    this.state = state;
  }

  protected createWebviewPanel(): vscode.WebviewPanel {
    return vscode.window.createWebviewPanel(
      this.viewType,
      this.viewTitle,
      vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,
        retainContextWhenHidden: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.file(this.mediaPath)],
      }
    );
  }

  protected disposeWebviewPanel() {
    this.rpc = null;
    const displayedPanel = this.webViewPanel;
    if (displayedPanel) {
      this.dispose();
    }
  }

  protected initWebviewPanel() {
    // Set the webview's initial html content
    this.initHtmlContent();

    // Set the context (current panel is focused)
    this.setFocused(this.webViewPanel.active);

    this.webViewPanel.onDidDispose(
      () => this.dispose(),
      null,
      this.disposables
    );

    // Update the content based on view changes
    this.webViewPanel.onDidChangeViewState(
      (e) => {
        this.setFocused(this.webViewPanel.active);
      },
      null,
      this.disposables
    );
  }

  protected setFocused(focusedValue: boolean) {
    vscode.commands.executeCommand("setContext", this.focusedKey, focusedValue);
  }

  private dispose() {
    this.setFocused(false);

    // Clean up our resources
    this.webViewPanel.dispose();
    this.webViewPanel = null;

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  protected async initHtmlContent() {
    let indexHtml = await fsextra.readFile(
      path.join(this.mediaPath, this.htmlFileName),
      "utf8"
    );
    if (indexHtml) {
      // Local path to main script run in the webview
      const scriptPathOnDisk = vscode.Uri.file(
        path.join(this.mediaPath, path.sep)
      );
      const scriptUri = this.webViewPanel.webview.asWebviewUri(
        scriptPathOnDisk
      );

      // TODO: very fragile: assuming double quotes and src is first attribute
      // specifically, doesn't work when building vue for development (vue-cli-service build --mode development)
      indexHtml = indexHtml.replace(
        /<link href=/g,
        `<link href=${scriptUri.toString()}`
      );
      indexHtml = indexHtml.replace(
        /<script src=/g,
        `<script src=${scriptUri.toString()}`
      );
      indexHtml = indexHtml.replace(
        /<img src=/g,
        `<img src=${scriptUri.toString()}`
      );
    }
    this.webViewPanel.webview.html = indexHtml;
  }
}
