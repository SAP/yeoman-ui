import * as vscode from "vscode";
import * as _ from "lodash";
import * as path from "path";
import { ExploreGens } from "../exploregens";
import { AbstractWebviewPanel } from "./AbstractWebviewPanel";
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";
import { getSWA, EVENT_TYPES } from "../swa-tracker/swa-tracker-wrapper";
import { getLogger } from "../logger/logger-wrapper";


export class ExploreGensPanel extends AbstractWebviewPanel {
    private static readonly VIEW_TITLE = "Explore and Install Generators";

    public setWebviewPanel(webviewPanel: vscode.WebviewPanel) {
        super.setWebviewPanel(webviewPanel);
        this.exploreGens.init(new RpcExtension(webviewPanel.webview));
        this.initWebviewPanel();
    }

    private readonly exploreGens: ExploreGens;
    public constructor(context: vscode.ExtensionContext) {
        super(context);
        this.viewType = "exploreGens";
        this.viewTitle = ExploreGensPanel.VIEW_TITLE;
        this.focusedKey = "exploreGens.Focused";
        this.htmlFileName = path.join("exploregens", "index.html");
        this.exploreGens = new ExploreGens(this.logger, this.context, vscode);
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
    }
}
