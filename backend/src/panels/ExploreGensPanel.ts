import * as vscode from 'vscode';
import * as _ from 'lodash';
import { RpcExtension } from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { ExploreGens } from '../exploregens';
import { AbstractWebviewPanel } from "./AbstractWebviewPanel";

const ONE_DAY = 1000 * 60 * 60 * 24;
const GLOBAL_STATE_KEY = "Yeoman UI.autoUpdateInstalledGenerators";

export class ExploreGensPanel extends AbstractWebviewPanel {
    public setWebviewPanel(webviewPanel: vscode.WebviewPanel) {
        super.setWebviewPanel(webviewPanel);
        this.exploreGens.initRpc(new RpcExtension(webviewPanel.webview));
        this.exploreGens.updateCache();
        this.initWebviewPanel();
    }

    public exploreGenerators() {
        this.disposeWebviewPanel();
        const webViewPanel = this.createWebviewPanel();
        this.setWebviewPanel(webViewPanel);
    }

    public disposeWebviewPanel() {
        super.disposeWebviewPanel();
    }

    private exploreGens: ExploreGens;
    public constructor(context: vscode.ExtensionContext) {
        super(context);
        this.viewType = "exploreGens";
        this.viewTitle = "Explore Generators";
        this.focusedKey = "exploreGenerators.Focused";
        this.htmlFileName = "exploreGensIndex.html";

        this.exploreGens = new ExploreGens(this.logger);

        this.doGeneratorsUpdate(context);
    }

    private doGeneratorsUpdate(context: vscode.ExtensionContext) {
        const lastUpdateDate = context.globalState.get(GLOBAL_STATE_KEY, 0);
        const currentDate = Date.now();
        if ((currentDate - lastUpdateDate) > ONE_DAY) {
            context.globalState.update(GLOBAL_STATE_KEY, currentDate);
            this.exploreGens.updateAllInstalledGenerators();
        }
    }
}
