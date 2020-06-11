import * as vscode from 'vscode';
import * as _ from 'lodash';
import { RpcExtension } from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { ExploreGens } from './ExploreGens';
import { AbstractWebViewPanel } from "./AbstractWebviewPanel";


export class ExploreGensPanel extends AbstractWebViewPanel{
    public setPanel(webviewPanel: vscode.WebviewPanel) {
        super.setPanel(webviewPanel);
        this.exploreGens = new ExploreGens(new RpcExtension(this.panel.webview), this.logger, this.workspaceConfig);
    }

    public exploreGenerators() {
        this.disposePanel();
	
        const webViewPanel = this.createWebviewPanel();
        this.setPanel(webViewPanel);
        this.initWebviewPanel();
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
    } 
}
