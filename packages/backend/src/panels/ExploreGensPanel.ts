import { ExtensionContext, WebviewPanel } from "vscode";
import { join } from "path";
import { ExploreGens } from "../exploregens";
import { AbstractWebviewPanel } from "./AbstractWebviewPanel";
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";
import { getWebviewRpcLibraryLogger } from "../logger/logger-wrapper";
import { get, isNil } from "lodash";
import * as messages from "../messages";

export class ExploreGensPanel extends AbstractWebviewPanel {
  public constructor(context: Partial<ExtensionContext>) {
    super(context);
    this.viewType = "exploreGens";
    this.viewTitle = messages.default.explore_gens_title;
    this.focusedKey = "exploreGens.Focused";
    this.htmlFileName = join("exploregens", "index.html");
    this.exploreGens = new ExploreGens(this.logger, this.context);
  }

  public setWebviewPanel(webviewPanel: WebviewPanel, uiOptions?: unknown) {
    super.setWebviewPanel(webviewPanel);
    this.rpc = new RpcExtension(webviewPanel.webview, getWebviewRpcLibraryLogger());
    this.exploreGens.init(this.rpc);
    this.initWebviewPanel();
    void this.installGenOnPanelOpenIfNeeded(uiOptions);
  }

  private async installGenOnPanelOpenIfNeeded(uiOptions?: unknown) {
    const genFullName = get(uiOptions, "package.name");
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

  public async loadWebviewPanel(uiOptions?: unknown) {
    if (this.webViewPanel && isNil(uiOptions)) {
      this.webViewPanel.reveal();
    } else {
      await super.loadWebviewPanel(uiOptions);
    }
  }
}
