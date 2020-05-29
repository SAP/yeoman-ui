import * as fsextra from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as vscode from 'vscode';
import {RpcExtension} from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { IChildLogger } from "@vscode-logging/logger";
import { getLogger } from "./logger/logger-wrapper";
import * as npmFetch from 'npm-registry-fetch';

/**
 * Manages webview panels
 */
export class ExploreGensPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static readonly viewType = "explore-generators";
	public static extensionPath: string;
	public static currentPanel: ExploreGensPanel;
	private static mediaPath: string;

	public static setPaths(extensionPath: string) {
		ExploreGensPanel.extensionPath = extensionPath;
		ExploreGensPanel.mediaPath = path.join(extensionPath, 'dist', 'media');
	}

	public static async exploreGenerators(uiOptions?: any) {
		const displayedPanel = _.get(ExploreGensPanel, "currentPanel.panel");
		if (displayedPanel) {
			displayedPanel.dispose();
		}
		
		const result1: any = await 
			//npmFetch.json("https://api.npms.io/v2/search?q=generator-+keywords:yeoman-generator+author:sap&size=25"); 
			npmFetch.json("https://api.npms.io/v2/search?q=generator-+keywords:yeoman-generator&size=25");
			console.error(result1);

		ExploreGensPanel.create(uiOptions);
	}

	public static setCurrentPanel(webviewPanel: vscode.WebviewPanel, uiOptions?: any) {
		const rpc = ExploreGensPanel.createRpc(webviewPanel);
		ExploreGensPanel.currentPanel = new ExploreGensPanel(webviewPanel, rpc, uiOptions);
	}

	public static createRpc(webviewPanel: vscode.WebviewPanel) {
		return new RpcExtension(webviewPanel.webview);
	}

	private static create(uiOptions?: any) {
		const webviewPanel = vscode.window.createWebviewPanel(
			ExploreGensPanel.viewType,
			"Explore Generators",
			vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,
				retainContextWhenHidden : true,
				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.file(ExploreGensPanel.mediaPath)]
			}
		);
		
		ExploreGensPanel.setCurrentPanel(webviewPanel, uiOptions);
	}

	//public yeomanui: YeomanUI;
	private readonly panel: vscode.WebviewPanel;
	private readonly logger: IChildLogger = getLogger();
	private rpc: RpcExtension;
	private disposables: vscode.Disposable[] = [];
	private messages: any;

	public constructor(panel: vscode.WebviewPanel, rpc: RpcExtension, uiOptions: any) {
		this.panel = panel;
		//this.genFilter = GeneratorFilter.create(_.get(uiOptions, "filter")); 
		//this.messages = _.assign({}, backendMessages, _.get(uiOptions, "messages", {})); 
		this.rpc = rpc;
		//const outputChannel: YouiLog = new OutputChannelLog(this.messages.channel_name);
		//const vscodeYouiEvents: YouiEvents = new VSCodeYouiEvents(this.rpc, this.panel, this.genFilter);
		// this.yeomanui = new YeomanUI(this.rpc, 
		// 	vscodeYouiEvents, 
		// 	outputChannel, 
		// 	this.logger, 
		// 	{genFilter: this.genFilter, messages: this.messages, defaultNpmPaths},
		// 	_.get(vscode, "workspace.workspaceFolders[0].uri.fsPath"));
		// this.yeomanui.registerCustomQuestionEventHandler("file-browser", "getFilePath", this.showOpenFileDialog.bind(this));
		// this.yeomanui.registerCustomQuestionEventHandler("folder-browser", "getPath", this.showOpenFolderDialog.bind(this));

		// Set the webview's initial html content
		this._update();

		// Set the context (yeoman-ui is focused)
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

	private setFocused(focused: boolean) {
		vscode.commands.executeCommand('setContext', 'exporegenerators.Focused', focused);
	}
	
	private dispose() {
		this.setFocused(false);
		
		ExploreGensPanel.currentPanel = undefined;
		
		// Clean up our resources
		this.panel.dispose();

		while (this.disposables.length) {
			const x = this.disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

    private async _update() {
		let indexHtml: string = await fsextra.readFile(path.join(ExploreGensPanel.mediaPath, 'index.html'), "utf8");
		// if (indexHtml) {
		// 	// Local path to main script run in the webview
		// 	const scriptPathOnDisk = vscode.Uri.file(path.join(ExploreGensPanel.mediaPath, path.sep));
		// 	const scriptUri = this.panel.webview.asWebviewUri(scriptPathOnDisk);

		// 	// TODO: very fragile: assuming double quotes and src is first attribute
		// 	// specifically, doesn't work when building vue for development (vue-cli-service build --mode development)
		// 	indexHtml = indexHtml.replace(/<link href=/g, `<link href=${scriptUri.toString()}`);
		// 	indexHtml = indexHtml.replace(/<script src=/g, `<script src=${scriptUri.toString()}`);
		// 	indexHtml = indexHtml.replace(/<img src=/g, `<img src=${scriptUri.toString()}`);
		// }
		
		//this.panel.title = this.messages.panel_title;
		//this.panel.webview.html = indexHtml;
	}
}
