import * as vscode from 'vscode';
import * as _ from 'lodash';
import { RpcExtension } from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { ExploreGens } from './ExploreGens';
import { AbstractWebViewPanel } from "./AbstractWebviewPanel";


export class ExploreGensPanel extends AbstractWebViewPanel{
    public getViewType(): string {
        return this.viewType;
    }

    public setPanel(webviewPanel: vscode.WebviewPanel): void {
        this.exploreGens = 
            new ExploreGens(new RpcExtension(this.panel.webview), 
                            this.logger, 
                            this.workspaceConfig)
    }

    public async exploreGenerators() {
        this.disposeCurrentPanel();
	
        const webViewPanel = this.createWebviewPanel();
        this.initWebviewPanel(webViewPanel);
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
    } 
}
