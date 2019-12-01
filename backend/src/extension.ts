import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Yowiz } from "./yowiz";
import { RpcExtenstion } from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { WizLog } from "./wiz-log";
import { OutputChannelLog } from './output-channel-log';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('sap.loadYowiz', () => {
			YowizPanel.createOrShow(context.extensionPath);
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(YowizPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				YowizPanel.revive(webviewPanel, context.extensionPath);
			}
		});
	}
}

/**
 * Manages webview panels
 */
export class YowizPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static readonly viewType = 'yowiz';
	public static currentPanel: YowizPanel | undefined;

	public static createOrShow(extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (YowizPanel.currentPanel) {
			YowizPanel.currentPanel.panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			YowizPanel.viewType,
			'Yeoman UI',
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'dist', 'media'))]
			}
		);

		YowizPanel.currentPanel = new YowizPanel(panel, extensionPath);
	}

	public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
		YowizPanel.currentPanel = new YowizPanel(panel, extensionPath);
	}

	public yowiz: Yowiz;
	private rpc: RpcExtenstion;
	private readonly panel: vscode.WebviewPanel;
	private readonly extensionPath: string;
	private disposables: vscode.Disposable[] = [];
	private questionsResolutions: Map<number, any>;

	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this.questionsResolutions = new Map();
		this.panel = panel;
		this.extensionPath = extensionPath;
		this.rpc = new RpcExtenstion(this.panel.webview);
		const logger: WizLog = new OutputChannelLog();
		this.yowiz = new Yowiz(this.rpc, logger);

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
		YowizPanel.currentPanel = undefined;

		// Clean up our resources
		this.panel.dispose();

		while (this.disposables.length) {
			const x = this.disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		// TODO: don't use sync
		let indexHtml: string = fs.readFileSync(path.join(this.extensionPath, 'dist', 'media', 'index.html'), "utf8");
		if (indexHtml) {
			// Local path to main script run in the webview
			const scriptPathOnDisk = vscode.Uri.file(
				path.join(this.extensionPath, 'dist', 'media')
			);
			// TODO: call 'webview.asWebviewUri' when we have a theia verion contains PR - https://github.com/eclipse-theia/theia/pull/6465
			const scriptUri = /* webview.asWebviewUri(scriptPathOnDisk) */ "vscode-resource:" + scriptPathOnDisk.path;

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
