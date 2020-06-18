import * as vscode from 'vscode';
import * as _ from 'lodash';
import { RpcExtension } from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { ExploreGens } from '../exploregens';
import { AbstractWebviewPanel } from "./AbstractWebviewPanel";

const ONE_DAY = 60 * 60 * 24 * 1000;
const GLOBAL_STATE_KEY = "Yeoman UI.autoUpdateInstalledGenerators";

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

        const lastUpdateDate = context.globalState.get(GLOBAL_STATE_KEY, 0);
        const currentDate = Date.now();
        if ((currentDate - lastUpdateDate) > ONE_DAY) {
            context.globalState.update(GLOBAL_STATE_KEY, currentDate);
            this.exploreGens.updateAllInstalledGenerators();
        }
    }
}
