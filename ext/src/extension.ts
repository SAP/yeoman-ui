import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Yowiz } from "./yowiz";
import inquirer = require('inquirer');
import { RpcExtenstion } from './rpc/rpc-extension';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('sap.loadYowiz', () => {
			YowizPanel.createOrShow(context.extensionPath);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('sap.runYowiz', async () => {
			if (YowizPanel.currentPanel) {
				const selectedItem = await vscode.window.showQuickPick(YowizPanel.yowiz.getGenerators(), { placeHolder: "Choose a generator..." });
				if (selectedItem) {
					YowizPanel.currentPanel.initWizard(selectedItem);
					YowizPanel.yowiz.run(selectedItem);
				}
			}
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
	public static currentPanel: YowizPanel | undefined;
	private _rpc: RpcExtenstion;

	public static readonly viewType = 'yowiz';

	public static yowiz: Yowiz;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];
	private _questionsResolutions: Map<number, any>;
	private _taskId: number;

	public static createOrShow(extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (YowizPanel.currentPanel) {
			YowizPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			YowizPanel.viewType,
			'Yowiz',
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.file(path.join(extensionPath, '/out/media'))]
			}
		);

		YowizPanel.currentPanel = new YowizPanel(panel, extensionPath);
		this.yowiz = new Yowiz(YowizPanel.currentPanel);
	}

	public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
		YowizPanel.currentPanel = new YowizPanel(panel, extensionPath);
		this.yowiz = new Yowiz(YowizPanel.currentPanel);
	}

	showMessage(message: string) {
		let _vscode = vscode;
		return new Promise((resolve, reject) => {
			_vscode.window.showInformationMessage(message, "yes", "no").then((res) => {
				resolve(res);
			});
		});
	}

	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this._questionsResolutions = new Map();
		this._taskId = 0;
		this._panel = panel;
		this._extensionPath = extensionPath;
		this._rpc = new RpcExtenstion(this._panel.webview);
		this._rpc.registerMethod({ func: this.showMessage, thisArg: this });

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
					case 'answers':
						const resolve = this._questionsResolutions.get(message.taskId);
						resolve(message.data);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public initWizard(generatorName: string) {
		this._rpc.invoke("setGeneratorName", [generatorName]);
	}

	public askQuestions(questions: inquirer.QuestionCollection<any>): Promise<inquirer.Answers> {
		return this._rpc.invoke("receivePrompts", [questions]).then((response => {
			vscode.window.showInformationMessage(response);
			return Promise.resolve([]);
		}));
	}

	public dispose() {
		YowizPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;

		// Vary the webview's content based on where it is located in the editor.
		switch (this._panel.viewColumn) {
			case vscode.ViewColumn.Two:
				this._updateSpecificColumn(webview, 'Compiling');
				return;

			case vscode.ViewColumn.Three:
				this._updateSpecificColumn(webview, 'Testing');
				return;

			case vscode.ViewColumn.One:
			default:
				this._updateSpecificColumn(webview, 'Yowiz');
				return;
		}
	}

	private _updateSpecificColumn(webview: vscode.Webview, name: string) {
		this._panel.title = name;
		this._panel.webview.html = this._getHtmlForWebview(webview, name);
	}

	private _getHtmlForWebview(webview: vscode.Webview, name: string) {
		// TODO: don't use sync
		let indexHtml: string = fs.readFileSync(path.join(__dirname, "media", "index.html"), "utf8");
		if (indexHtml) {
			// Local path to main script run in the webview
			const scriptPathOnDisk = vscode.Uri.file(
				path.join(this._extensionPath, 'out/media')
			);
			const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

			// TODO: very fragile: assuming double quotes and src is first attribute
			// specifically, doesn't work when building vue for development (vue-cli-service build --mode development)
			indexHtml = indexHtml.replace(/<link href=/g, `<link href=${scriptUri.toString()}`);
			indexHtml = indexHtml.replace(/<script src=/g, `<script src=${scriptUri.toString()}`);
		}
		return indexHtml;
	}
}
