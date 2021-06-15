import * as vscode from "vscode";
import * as path from "path";
import { ExploreGens } from "../exploregens";
import { AbstractWebviewPanel } from "./AbstractWebviewPanel";
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";
import { getWebviewRpcLibraryLogger } from "../logger/logger-wrapper";
import _ = require("lodash");

export class ExploreGensPanel extends AbstractWebviewPanel {
  public setWebviewPanel(webviewPanel: vscode.WebviewPanel, uiOptions?: unknown) {
    super.setWebviewPanel(webviewPanel);
    this.rpc = new RpcExtension(webviewPanel.webview, getWebviewRpcLibraryLogger());
    this.exploreGens.init(this.rpc);
    this.initWebviewPanel();
    void this.installGenOnPanelOpenIfNeeded(uiOptions);
  }

  private async installGenOnPanelOpenIfNeeded(uiOptions?: unknown) {
    const genFullName = _.get(uiOptions, "package.name");
    if (genFullName) {
      try {
        await this.exploreGens.setGenFilter(genFullName);
        await this.exploreGens.install(uiOptions);
        this.flowPromise.state.resolve();
      } catch (error) {
        this.flowPromise.state.reject(error);
      }
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

  public async loadWebviewPanel(uiOptions?: unknown) {
    if (this.webViewPanel && _.isNil(uiOptions)) {
      this.webViewPanel.reveal();
    } else {
      await super.loadWebviewPanel(uiOptions);
    }
  }
}
