import * as fsextra from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as vscode from 'vscode';
import { YeomanUI } from "./yeomanui";
import {RpcExtension} from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { YouiLog } from "./youi-log";
import { OutputChannelLog } from './output-channel-log';
import { GeneratorFilter } from './filter';

let thisContext: vscode.ExtensionContext;
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('loadYeomanUI', (genFilter?: GeneratorFilter) => {
			YeomanUIPanel.createOrShow(context.extensionPath, GeneratorFilter.create(genFilter));
	}));

	context.subscriptions.push(
		vscode.commands.registerCommand('loadYeomanUI_projects', () => {
			vscode.commands.executeCommand("loadYeomanUI", GeneratorFilter.create({"type": "project"}));
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

	public static createOrShow(extensionPath: string, genFilter?: GeneratorFilter) {
		YeomanUIPanel.genFilter = genFilter;

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

	public yeomanui: YeomanUI;
	private rpc: RpcExtension;
	private readonly panel: vscode.WebviewPanel;
	private readonly extensionPath: string;
	private disposables: vscode.Disposable[] = [];
	private questionsResolutions: Map<number, any>;

	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this.questionsResolutions = new Map();
		this.panel = panel;
		this.extensionPath = extensionPath;
		this.rpc = new RpcExtension(this.panel.webview);
		const logger: YouiLog = new OutputChannelLog();
		
		this.yeomanui = new YeomanUI(this.rpc, logger);
		this.yeomanui.setGenFilter(YeomanUIPanel.genFilter);

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

		// Update the content based on view changes
		this.panel.onDidChangeViewState(
			e => {
				if (this.panel.visible) {
					this._update();
				}
			},
			null,
			this.disposables
		);

		// Handle messages from the webview
		this.panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
					case 'answers':
						const resolve = this.questionsResolutions.get(message.taskId);
						resolve(message.data);
						return;
				}
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

	private static getMediaPath(extensionPath: string): string {
		return path.join(extensionPath, 'dist', 'media');
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
		this.panel.title = 'Yeoman UI';
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
