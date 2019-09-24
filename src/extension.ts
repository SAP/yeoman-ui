import * as path from 'path';
import * as vscode from 'vscode';
import { Yowiz } from "./yowiz";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('sap.loadYowiz', () => {
			YowizPanel.createOrShow(context.extensionPath);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('sap.runYowiz', async () => {
			if (YowizPanel.currentPanel) {
				const generatorsList: string[] = await YowizPanel.yowiz.getGenerators();
				const selectedItem = await vscode.window.showQuickPick(generatorsList);
				if (selectedItem) {
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

	public static readonly viewType = 'yowiz';

	public static yowiz: Yowiz;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

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

	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this._panel = panel;
		this._extensionPath = extensionPath;

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
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public sendQuestions(q: string) {
		this._panel.webview.postMessage({ command: 'questions', data: q });
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
		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.file(
			path.join(this._extensionPath, 'out/media', 'main.js')
		);

		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">

                <!--
                Use a content security policy to only allow loading images from https or from our extension directory,
                and only allow scripts that have a specific nonce.
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} http:; script-src 'nonce-${nonce}' http: ${webview.cspSource};">
                -->

                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Yowiz</title>
            </head>
            <body>
                <h1>${name}</h1>
                <h1 id="lines-of-code-counter">0</h1>
                <div id="questions">no questions</div>

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
