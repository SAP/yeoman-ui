import * as vscode from "vscode";
import * as _ from "lodash";
import * as path from "path";
import { ExploreGens } from "../exploregens";
import { AbstractWebviewPanel } from "./AbstractWebviewPanel";
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";


export class ExploreGensPanel extends AbstractWebviewPanel {
    public setWebviewPanel(webviewPanel: vscode.WebviewPanel) {
        super.setWebviewPanel(webviewPanel);
        this.exploreGens = new ExploreGens(new RpcExtension(webviewPanel.webview), this.logger, this.context, vscode);
        this.initWebviewPanel();
    }

    public exploreGenerators() {
        if (this.webViewPanel) {
            this.webViewPanel.reveal();
        } else {
            this.disposeWebviewPanel();
            const webViewPanel = this.createWebviewPanel();
            this.setWebviewPanel(webViewPanel);
        }
    }

    private exploreGens: ExploreGens;
    public constructor(context: vscode.ExtensionContext) {
        super(context);
        this.viewType = "exploreGens";
        this.viewTitle = "Explore Generators";
        this.focusedKey = "exploreGens.Focused";
        this.htmlFileName = path.join("exploregens", "index.html");
    }
}
