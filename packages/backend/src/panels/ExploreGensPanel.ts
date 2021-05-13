import * as vscode from "vscode";
import * as path from "path";
import { ExploreGens } from "../exploregens";
import { AbstractWebviewPanel } from "./AbstractWebviewPanel";
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";
import { getWebviewRpcLibraryLogger } from "../logger/logger-wrapper";
import _ = require("lodash");

export class ExploreGensPanel extends AbstractWebviewPanel {
  public async setWebviewPanel(webviewPanel: vscode.WebviewPanel, uiOptions?: any) {
    super.setWebviewPanel(webviewPanel);
    this.rpc = new RpcExtension(webviewPanel.webview, getWebviewRpcLibraryLogger());
    this.exploreGens.init(this.rpc);
    this.initWebviewPanel();
    if (uiOptions?.package?.name) {
      await this.exploreGens.install(uiOptions);
    }
  }

  public exploreGens: ExploreGens;

  public constructor(context: vscode.ExtensionContext) {
    super(context);
    this.viewType = "exploreGens";
    this.viewTitle = "Explore and Install Generators";
    this.focusedKey = "exploreGens.Focused";
    this.htmlFileName = path.join("exploregens", "index.html");
    this.exploreGens = new ExploreGens(this.logger, this.isInBAS, this.context);
  }

  public loadWebviewPanel(uiOptions?: any): Promise<unknown> {
    if (this.webViewPanel && _.isNil(uiOptions)) {
      this.webViewPanel.reveal();
    } else {
      return super.loadWebviewPanel(uiOptions);
    }
  }

  public disposeWebviewPanel() {
    super.disposeWebviewPanel();
  }
}
