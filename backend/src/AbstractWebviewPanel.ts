import * as vscode from 'vscode';
import * as path from 'path';
import * as _ from 'lodash';
import * as fsextra from 'fs-extra';
import { IChildLogger } from '@vscode-logging/logger';
import { getLogger } from './logger/logger-wrapper';


export abstract class AbstractWebViewPanel {
	protected extensionPath: string;
    protected mediaPath: string;
    //protected currentPanel: any;
    public viewType: string;
    protected viewTitle: string;
    protected panel: vscode.WebviewPanel;
    protected focusedKey: string;
    protected workspaceConfig: any;

	protected readonly logger: IChildLogger = getLogger();
    protected disposables: vscode.Disposable[] = [];

    protected constructor(context: vscode.ExtensionContext) {
        this.extensionPath = context.extensionPath;
        this.mediaPath = path.join(context.extensionPath, "dist", "media");
        this.workspaceConfig = vscode.workspace.getConfiguration();
    }

    public abstract setPanel(webviewPanel: vscode.WebviewPanel, state?: any): void;
    
    protected createWebviewPanel(): vscode.WebviewPanel {
		return vscode.window.createWebviewPanel(
			this.viewType,
			this.viewTitle,
			vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,
				retainContextWhenHidden : true,
				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.file(this.mediaPath)]
			}
		);
    }

    protected disposeCurrentPanel() {
        //const displayedPanel = _.get(this.currentPanel, "panel");
        const displayedPanel = this.panel;
		if (displayedPanel) {
			displayedPanel.dispose();
		}
    }

    protected initWebviewPanel(panel: vscode.WebviewPanel) {
        this.panel = panel;
        // Set the webview's initial html content
		this._update();

		// Set the context (current panel is focused)
		this.setFocused(this.panel.active);

		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

		// Update the content based on view changes
		this.panel.onDidChangeViewState(
			e => {
				this.setFocused(this.panel.active);
			},
			null,
			this.disposables
		);
    }

    protected setFocused(focusedValue: boolean) {
		vscode.commands.executeCommand('setContext', this.focusedKey, focusedValue);
	}

    protected dispose() {
		this.setFocused(false);
		
        //this.currentPanel = undefined;
		// Clean up our resources
        this.panel.dispose();
        this.panel = null;

		while (this.disposables.length) {
			const x = this.disposables.pop();
			if (x) {
				x.dispose();
			}
		}
    }
    
    private async _update() {
		let indexHtml = await fsextra.readFile(path.join(this.mediaPath, 'index.html'), "utf8");
		if (indexHtml) {
		  // Local path to main script run in the webview
		  const scriptPathOnDisk = vscode.Uri.file(path.join(this.extensionPath, 'dist', path.sep));
		  const scriptUri = this.panel.webview.asWebviewUri(scriptPathOnDisk);

		  // TODO: very fragile: assuming double quotes and src is first attribute
		  // specifically, doesn't work when building vue for development (vue-cli-service build --mode development)
		  indexHtml = indexHtml.replace(/<link href=/g, `<link href=${scriptUri.toString()}`);
		  indexHtml = indexHtml.replace(/<script src=/g, `<script src=${scriptUri.toString()}`);
		  indexHtml = indexHtml.replace(/<img src=/g, `<img src=${scriptUri.toString()}`);
	  	}
		this.panel.webview.html = indexHtml;
	}
}
