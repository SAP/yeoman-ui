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

    private exploreGens: ExploreGens;
    public constructor(context: vscode.ExtensionContext) {
        super(context);
        this.viewType = "exploreGens";
        this.viewTitle = "Explore and Install Generators";
        this.focusedKey = "exploreGens.Focused";
        this.htmlFileName = path.join("exploregens", "index.html");
    }

    public loadWebviewPanel() {
		if (this.webViewPanel) {
			this.webViewPanel.reveal();
		} else {
            super.loadWebviewPanel();
		}
	}

    public disposeWebviewPanel() {
		super.disposeWebviewPanel();
		this.exploreGens = null;
    }
}
