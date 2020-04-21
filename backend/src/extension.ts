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

const YEOMAN_UI = "Yeoman UI";
const ERROR_ACTIVATION_FAILED_LOGGER_CONFIG = 'Extension activation failed due to Logger configuration failure:';
let _context: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
	_context = context;
	try {
		createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
	} catch (error) {
		console.error(ERROR_ACTIVATION_FAILED_LOGGER_CONFIG, error.message);
		return;
	}

	context.subscriptions.push(vscode.commands.registerCommand('loadYeomanUI', loadYeomanUI));
	context.subscriptions.push(vscode.commands.registerCommand('yeomanUI.toggleOutput', toggleOutput));

	if (vscode.window.registerWebviewPanelSerializer) {
		vscode.window.registerWebviewPanelSerializer(YeomanUIPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				YeomanUIPanel.genFilter = GeneratorFilter.create(_.get(state, "filter")); 
				YeomanUIPanel.messages = getUIMessages(state);
				YeomanUIPanel.revive(webviewPanel, _context.extensionPath);
			}
		});
	}
}

function toggleOutput() {
	const yeomanUi = _.get(YeomanUIPanel, "currentPanel.yeomanui");
	if (yeomanUi) {
		yeomanUi.toggleOutput();
	}
}

function loadYeomanUI(options?: any) {
	const displayedPanel = _.get(YeomanUIPanel, "currentPanel.panel");
	if (displayedPanel) {
		displayedPanel.dispose();
	}

	YeomanUIPanel.genFilter = GeneratorFilter.create(_.get(options, "filter")); 
	YeomanUIPanel.messages = getUIMessages(options);
	YeomanUIPanel.create(_context.extensionPath);
}

function getUIMessages(options?: any) {
	return _.assign({}, backendMessages, _.get(options, "messages", {}));
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

	public static create(extensionPath: string) {
		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			YeomanUIPanel.viewType,
			YEOMAN_UI,
			vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,
				retainContextWhenHidden : true,
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
		const canSelectFolders: boolean = !canSelectFiles;
		
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
			return _.get(filePath, "[0].fsPath", currentPath);
		} catch (error) {
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
		const vscodeYouiEvents: YouiEvents = new VSCodeYouiEvents(this.rpc, this.panel, YeomanUIPanel.genFilter);
		this.yeomanui = new YeomanUI(this.rpc, vscodeYouiEvents, outputChannel, this.logger, YeomanUIPanel.genFilter);
		this.yeomanui.registerCustomQuestionEventHandler("file-browser", "getFilePath", this.showOpenFileDialog.bind(this));
		this.yeomanui.registerCustomQuestionEventHandler("folder-browser", "getPath", this.showOpenFolderDialog.bind(this));

		// Set the webview's initial html content
		this._update();

		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
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

	private setState(options: any): Promise<void> {
		return this.rpc ? this.rpc.invoke("setState", [options]) : Promise.resolve();
	}

    private async _update() {
		let indexHtml: string = await fsextra.readFile(path.join(YeomanUIPanel.getMediaPath(this.extensionPath), 'index.html'), "utf8");
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
		
		this.panel.title = _.get(YeomanUIPanel.messages, "panel_title");
		this.panel.webview.html = indexHtml;

		await this.setState({messages: YeomanUIPanel.messages, filter: YeomanUIPanel.genFilter});
	}
}

let channel: vscode.OutputChannel;
export function getOutputChannel(): vscode.OutputChannel {
	if (!channel) {
		channel = vscode.window.createOutputChannel(`${YEOMAN_UI}.Generators`);
	}
	return channel;
}
