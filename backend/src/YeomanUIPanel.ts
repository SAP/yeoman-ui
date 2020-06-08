import * as fsextra from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as os from "os";
import * as vscode from 'vscode';
import { YeomanUI } from "./yeomanui";
import {RpcExtension} from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { YouiLog } from "./youi-log";
import { GeneratorFilter } from './filter';
import backendMessages from "./messages";
import { getLogger } from "./logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";
import { OutputChannelLog } from './output-channel-log';
import { YouiEvents } from "./youi-events";
import { VSCodeYouiEvents } from './vscode-youi-events';
import Environment = require('yeoman-environment');

let defaultNpmPaths: string[];

export class YeomanUIPanel {
	public static YEOMAN_UI = "Yeoman UI";
	public static readonly viewType = "yeomanui";
	public static extensionPath: string;
	public static currentPanel: YeomanUIPanel;
	private static mediaPath: string;
	private static channel: vscode.OutputChannel;

	public static setPaths(extensionPath: string) {
		YeomanUIPanel.extensionPath = extensionPath;
		YeomanUIPanel.mediaPath = path.join(extensionPath, 'dist', 'media');
	}

	public static loadYeomanUI(uiOptions?: any) {
		const displayedPanel = _.get(YeomanUIPanel, "currentPanel.panel");
		if (displayedPanel) {
			displayedPanel.dispose();
		}
	
		YeomanUIPanel.create(uiOptions);
	}

	public static toggleOutput() {
		const yeomanUi = _.get(YeomanUIPanel, "currentPanel.yeomanui");
		if (yeomanUi) {
			yeomanUi.toggleOutput();
		}
	}

	public static setCurrentPanel(webviewPanel: vscode.WebviewPanel, uiOptions?: any) {
		YeomanUIPanel.currentPanel = new YeomanUIPanel(webviewPanel, uiOptions);
	}

    public static getOutputChannel(channelName: string): vscode.OutputChannel {
		if (!this.channel) {
			this.channel = vscode.window.createOutputChannel(`${YeomanUIPanel.YEOMAN_UI}.${channelName}`);
		}

		return this.channel;
	}

	private static create(uiOptions?: any) {
		const webviewPanel = vscode.window.createWebviewPanel(
			YeomanUIPanel.viewType,
			YeomanUIPanel.YEOMAN_UI,
			vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,
				retainContextWhenHidden : true,
				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.file(YeomanUIPanel.mediaPath)]
			}
		);
		
		YeomanUIPanel.setCurrentPanel(webviewPanel, uiOptions);
	}

	public yeomanui: YeomanUI;
	private readonly panel: vscode.WebviewPanel;
	private readonly logger: IChildLogger = getLogger();
	private rpc: RpcExtension;
	private disposables: vscode.Disposable[] = [];
	private genFilter: any;
	private messages: any;

	// // improves performance
	// // TODO: replace or remove this API
	// // it is very slow, takes more than 2 seconds 
	// defaultNpmPaths = Environment.createEnv().getNpmPaths();

	public constructor(panel: vscode.WebviewPanel, uiOptions: any) {
		this.panel = panel;
		this.genFilter = GeneratorFilter.create(_.get(uiOptions, "filter")); 
		this.messages = _.assign({}, backendMessages, _.get(uiOptions, "messages", {})); 
		this.rpc = new RpcExtension(panel.webview);
		const outputChannel: YouiLog = new OutputChannelLog(this.messages.channel_name);
		const vscodeYouiEvents: YouiEvents = new VSCodeYouiEvents(this.rpc, this.panel, this.genFilter);
		this.yeomanui = new YeomanUI(this.rpc, 
			vscodeYouiEvents, 
			outputChannel, 
			this.logger, 
			{genFilter: this.genFilter, messages: this.messages, defaultNpmPaths},
			_.get(vscode, "workspace.workspaceFolders[0].uri.fsPath"));
		this.yeomanui.registerCustomQuestionEventHandler("file-browser", "getFilePath", this.showOpenFileDialog.bind(this));
		this.yeomanui.registerCustomQuestionEventHandler("folder-browser", "getPath", this.showOpenFolderDialog.bind(this));

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
    
    // private getDefaultPaths() {
	// 	const defaultNpmPaths = Environment.createEnv().getNpmPaths();
	// 	const pocExt: vscode.Extension<any> = vscode.extensions.getExtension("slavik.poc");
	// 	if (pocExt) {
	// 		const location = pocExt.exports.getGeneratorsLocation();
	// 		if (location) {
	// 			defaultNpmPaths.push(location);
	// 		}
	// 	}

	// 	return defaultNpmPaths;
	// }

	private setFocused(focused: boolean) {
		vscode.commands.executeCommand('setContext', 'yeomanUI.Focused', focused);
	}

	private async showOpenFileDialog(currentPath: string): Promise<string> {
		return await this.showOpenDialog(currentPath, true);
	}

	private async showOpenFolderDialog(currentPath: string): Promise<string> {
		return await this.showOpenDialog(currentPath, false);
	}

	private async showOpenDialog(currentPath: string, canSelectFiles: boolean): Promise<string> {
		const canSelectFolders: boolean = !canSelectFiles;
		
		let uri;
		try {
			uri = vscode.Uri.file(currentPath);
		} catch (e) {
			uri = vscode.Uri.file(path.join(os.homedir()));
		}

		try {
			const filePath = await vscode.window.showOpenDialog({
				canSelectFiles,
				canSelectFolders,
				defaultUri: uri
			});
			return _.get(filePath, "[0].fsPath", currentPath);
		} catch (error) {
			return currentPath;
		}
	}
	
	private dispose() {
		this.setFocused(false);
		
		YeomanUIPanel.currentPanel = undefined;
		
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
		let indexHtml: string = await fsextra.readFile(path.join(YeomanUIPanel.mediaPath, 'index.html'), "utf8");
		if (indexHtml) {
			// Local path to main script run in the webview
			const scriptPathOnDisk = vscode.Uri.file(path.join(YeomanUIPanel.mediaPath, path.sep));
			const scriptUri = this.panel.webview.asWebviewUri(scriptPathOnDisk);

			// TODO: very fragile: assuming double quotes and src is first attribute
			// specifically, doesn't work when building vue for development (vue-cli-service build --mode development)
			indexHtml = indexHtml.replace(/<link href=/g, `<link href=${scriptUri.toString()}`);
			indexHtml = indexHtml.replace(/<script src=/g, `<script src=${scriptUri.toString()}`);
			indexHtml = indexHtml.replace(/<img src=/g, `<img src=${scriptUri.toString()}`);
		}
		
		this.panel.title = this.messages.panel_title;
		this.panel.webview.html = indexHtml;
	}
}