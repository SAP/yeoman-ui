import * as fsextra from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as vscode from 'vscode';
import { YeomanUI } from "./yeomanui";
import {RpcExtension} from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { YouiLog } from "./youi-log";
import { OutputChannelLog } from './output-channel-log';
import { YouiEvents } from "./youi-events";
import { VSCodeYouiEvents } from './vscode-youi-events';
import { GeneratorFilter } from './filter';
import backendMessages from "./messages";
import { getClassLogger, createExtensionLoggerAndSubscribeToLogSettingsChanges } from "./logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";

const ERROR_ACTIVATION_FAILED_LOGGER_CONFIG = 'Extension activation failed due to Logger configuration failure:';

export function activate(context: vscode.ExtensionContext) {
	try {
		createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
	} catch (error) {
		console.error(ERROR_ACTIVATION_FAILED_LOGGER_CONFIG, error.message);
		return;
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('loadYeomanUI', (options?: any) => {
			const genFilter = _.get(options, "filter"); 
			const messages = _.get(options, "messages");
			
			const displayedPanel = _.get(YeomanUIPanel, "currentPanel.panel");
			if (displayedPanel) {
				displayedPanel.dispose();
			}
			
			YeomanUIPanel.createOrShow(context.extensionPath, GeneratorFilter.create(genFilter), messages);
	}));
	context.subscriptions.push(
		vscode.commands.registerCommand('yeomanUI.toggleOutput', () => {
			const yeomanUi = _.get(YeomanUIPanel, "currentPanel.yeomanui");
			if (yeomanUi) {
				yeomanUi.toggleOutput();
			}
	}));

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(YeomanUIPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				YeomanUIPanel.revive(webviewPanel, context.extensionPath);
			}
		});
	}
}

/**
 * Manages webview panels
 */
export class YeomanUIPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static readonly viewType = 'yeomanui';
	public static currentPanel: YeomanUIPanel | undefined;
	public static genFilter: GeneratorFilter;
	public static messages: any;

	public static createOrShow(extensionPath: string, genFilter?: GeneratorFilter, messages?: any) {
		YeomanUIPanel.genFilter = genFilter;
		YeomanUIPanel.messages = messages;
		
		const column = _.get(vscode.window, "activeTextEditor.viewColumn");

		// If we already have a panel, show it.
		if (YeomanUIPanel.currentPanel) {
			YeomanUIPanel.currentPanel.yeomanui.setGenFilter(YeomanUIPanel.genFilter);
			YeomanUIPanel.currentPanel.panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			YeomanUIPanel.viewType,
			'Yeoman UI',
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.file(YeomanUIPanel.getMediaPath(extensionPath))]
			}
		);
		
		YeomanUIPanel.currentPanel = new YeomanUIPanel(panel, extensionPath);
	}

	public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
		YeomanUIPanel.currentPanel = new YeomanUIPanel(panel, extensionPath);
	}

	private static getMediaPath(extensionPath: string): string {
		return path.join(extensionPath, 'dist', 'media');
	}

	public async showOpenFileDialog(currentPath: string): Promise<string> {
		return await this.showOpenDialog(currentPath, true);
	}

	public async showOpenFolderDialog(currentPath: string): Promise<string> {
		return await this.showOpenDialog(currentPath, false);
	}

	private async showOpenDialog(currentPath: string, canSelectFiles: boolean): Promise<string> {
		let canSelectFolders: boolean = false;
		if (!canSelectFiles) {
			canSelectFolders = true;
		}
		let uri;
		try {
			uri = vscode.Uri.file(currentPath);
		} catch (e) {
			uri = vscode.Uri.file('/');
		}

		try {
			const filePath = await vscode.window.showOpenDialog({
				canSelectFiles,
				canSelectFolders,
				defaultUri: uri
			});
			return (filePath as vscode.Uri[])[0].fsPath;
		} catch (e) {
			return currentPath;
		}
	}

	public yeomanui: YeomanUI;
	private readonly logger: IChildLogger = getClassLogger(YeomanUI.name);
	private rpc: RpcExtension;
	private readonly extensionPath: string;
	private disposables: vscode.Disposable[] = [];

	private constructor(public readonly panel: vscode.WebviewPanel, extensionPath: string) {
		this.extensionPath = extensionPath;
		this.rpc = new RpcExtension(this.panel.webview);
		const outputChannel: YouiLog = new OutputChannelLog();
		const vscodeYouiEvents: YouiEvents = new VSCodeYouiEvents(this.rpc, this.panel);
		const outputFolder = _.get(vscode, "vscode.workspace.workspaceFolders[0].uri.path");
		this.yeomanui = new YeomanUI(this.rpc, vscodeYouiEvents, outputChannel, this.logger, YeomanUIPanel.genFilter, outputFolder);
		this.yeomanui.registerCustomQuestionEventHandler("file-browser", "getFilePath", this.showOpenFileDialog.bind(this));
		this.yeomanui.registerCustomQuestionEventHandler("folder-browser", "getPath", this.showOpenFolderDialog.bind(this));

		// Set the webview's initial html content
		this._update();

		// Set the context (yeoman-ui is focused)
		vscode.commands.executeCommand('setContext', 'yeomanUI.Focused', this.panel.active);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

		// Update the content based on view changes
		this.panel.onDidChangeViewState(
			e => {
				if (this.panel.visible) {
					this._update();
				}
				vscode.commands.executeCommand('setContext', 'yeomanUI.Focused', this.panel.active);
			},
			null,
			this.disposables
		);
	}
	
	public dispose() {
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

	private setMessages(messages: any): Promise<void> {
		return this.rpc ? this.rpc.invoke("setMessages", [messages]) : Promise.resolve();
	}

	private _update() {
		
		// TODO: don't use sync
		let indexHtml: string = fsextra.readFileSync(path.join(YeomanUIPanel.getMediaPath(this.extensionPath), 'index.html'), "utf8");
		if (indexHtml) {
			// Local path to main script run in the webview
			const scriptPathOnDisk = vscode.Uri.file(path.join(YeomanUIPanel.getMediaPath(this.extensionPath), path.sep));
			const scriptUri = this.panel.webview.asWebviewUri(scriptPathOnDisk);

			// TODO: very fragile: assuming double quotes and src is first attribute
			// specifically, doesn't work when building vue for development (vue-cli-service build --mode development)
			indexHtml = indexHtml.replace(/<link href=/g, `<link href=${scriptUri.toString()}`);
			indexHtml = indexHtml.replace(/<script src=/g, `<script src=${scriptUri.toString()}`);
			indexHtml = indexHtml.replace(/<img src=/g, `<img src=${scriptUri.toString()}`);
		}
		const uiMessages = _.assign({}, backendMessages, _.get(YeomanUIPanel, "messages", {}));
		this.panel.title = _.get(uiMessages, "panel_title");

		this.setMessages(uiMessages);

		this.panel.webview.html = indexHtml;
	}
}

let channel: vscode.OutputChannel;
export function getOutputChannel(): vscode.OutputChannel {
	if (!channel) {
		channel = vscode.window.createOutputChannel('Yeoman UI');
	}
	return channel;
}
