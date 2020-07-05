import * as vscode from 'vscode';
import * as _ from 'lodash';
import { ExploreGens } from '../exploregens';
import { AbstractWebviewPanel } from "./AbstractWebviewPanel";
import { RpcExtension } from '@sap-devx/webview-rpc/out.ext/rpc-extension';


export class ExploreGensPanel extends AbstractWebviewPanel {
    public setWebviewPanel(webviewPanel: vscode.WebviewPanel) {
        super.setWebviewPanel(webviewPanel);
        this.exploreGens.init(new RpcExtension(webviewPanel.webview));
        this.initWebviewPanel();
    }

    public exploreGenerators() {
        this.disposeWebviewPanel();
        const webViewPanel = this.createWebviewPanel();
        this.setWebviewPanel(webViewPanel);
    }

    private exploreGens: ExploreGens;
    public constructor(context: vscode.ExtensionContext) {
        super(context);
        this.viewType = "exploreGens";
        this.viewTitle = "Explore Generators";
        this.focusedKey = "exploreGenerators.Focused";
        this.htmlFileName = "exploreGensIndex.html";

        this.exploreGens = new ExploreGens(context, this.logger);
    }
}
