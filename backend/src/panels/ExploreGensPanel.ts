import * as vscode from 'vscode';
import * as _ from 'lodash';
import { RpcExtension } from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { ExploreGens } from '../exploregens';
import { AbstractWebviewPanel } from "./AbstractWebviewPanel";


export class ExploreGensPanel extends AbstractWebviewPanel {
    public setPanel(webviewPanel: vscode.WebviewPanel) {
        super.setPanel(webviewPanel);
        this.exploreGens.initRpc(new RpcExtension(webviewPanel.webview));
        this.initWebviewPanel();
    }

    public exploreGenerators() {
        this.disposePanel();
        const webViewPanel = this.createWebviewPanel();
        this.setPanel(webViewPanel);
    }

    public dispose() {
        super.dispose();
        this.exploreGens = null;
    }

    private exploreGens: ExploreGens;
    public constructor(context: vscode.ExtensionContext) {
        super(context);
        this.viewType = "exploreGens";
        this.viewTitle = "Explore Generators";
        this.focusedKey = "exploreGenerators.Focused";
        this.htmlFileName = "exploreGensIndex.html";

        this.exploreGens = new ExploreGens(this.logger);
        this.exploreGens.updateAllInstalledGenerators();
    }
}
