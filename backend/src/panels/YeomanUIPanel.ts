import * as _ from 'lodash';
import * as path from 'path';
import * as os from "os";
import * as vscode from 'vscode';
import { YeomanUI } from "../yeomanui";
import { RpcExtension } from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { GeneratorFilter } from '../filter';
import backendMessages from "../messages";
import { YouiEvents } from "../youi-events";
import { VSCodeYouiEvents } from '../vscode-youi-events';
import { AbstractWebviewPanel } from './AbstractWebviewPanel';
import { ExploreGens } from '../exploregens';
import { GeneratorOutput } from '../vscode-output';


export class YeomanUIPanel extends AbstractWebviewPanel {
	public static YEOMAN_UI = "Application Wizard";

	public toggleOutput() {
		this.output.show();
	}

	public notifyGeneratorsChange() {
		const yeomanUi = _.get(this, "yeomanui");
		if (yeomanUi) {
			yeomanUi._notifyGeneratorsChange();
		}
	}

	public setWebviewPanel(webViewPanel: vscode.WebviewPanel, uiOptions?: any) {
        super.setWebviewPanel(webViewPanel);

		this.messages = _.assign({}, backendMessages, _.get(uiOptions, "messages", {}));
		const filter = GeneratorFilter.create(_.get(uiOptions, "filter"));
		const generator = _.get(uiOptions, "generator");

		const rpc = new RpcExtension(this.webViewPanel.webview);
		this.output.setChannelName(`${YeomanUIPanel.YEOMAN_UI}.${this.messages.channel_name}`);
		const vscodeYouiEvents: YouiEvents = new VSCodeYouiEvents(rpc, this.webViewPanel, this.messages, this.output, this.isInBAS);

		const outputPath = this.isInBAS ? undefined: _.get(vscode, "workspace.workspaceFolders[0].uri.fsPath"); 
		this.yeomanui = new YeomanUI(rpc,
			vscodeYouiEvents,
			this.output,
			this.logger,
			{generator, filter, messages: this.messages, data: _.get(uiOptions, "data"), npmGlobalPaths: this.getDefaultPaths() }, outputPath);
		this.yeomanui.registerCustomQuestionEventHandler("file-browser", "getFilePath", this.showOpenFileDialog.bind(this));
		this.yeomanui.registerCustomQuestionEventHandler("folder-browser", "getPath", this.showOpenFolderDialog.bind(this));

		this.initWebviewPanel();
	}

	private yeomanui: YeomanUI;
	private messages: any;
	private output: GeneratorOutput;

	public constructor(context: vscode.ExtensionContext) {
		super(context);
		this.viewType = "yeomanui";
		this.viewTitle = YeomanUIPanel.YEOMAN_UI;
		this.focusedKey = "yeomanUI.Focused";
		this.output = new GeneratorOutput();
	}

	private getDefaultPaths(): string[] {
		const customGensLocation: string = ExploreGens.getInstallationLocation(vscode.workspace.getConfiguration());
		if (!_.isEmpty(customGensLocation)) {
			return _.concat(YeomanUIPanel.npmGlobalPaths, path.join(customGensLocation, "node_modules"));
		}

		return YeomanUIPanel.npmGlobalPaths;
	}

	private async showOpenFileDialog(currentPath: string): Promise<string> {
		return await this.showOpenDialog(currentPath, true);
	}

	private async showOpenFolderDialog(currentPath: string): Promise<string> {
		return await this.showOpenDialog(currentPath, false);
	}

	private async showOpenDialog(currentPath: string, canSelectFiles: boolean): Promise<string> {
		const canSelectFolders = !canSelectFiles;

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

	public disposeWebviewPanel() {
		super.disposeWebviewPanel();
		this.yeomanui = null;
	}

	public initWebviewPanel() {
		super.initWebviewPanel();
		this.webViewPanel.title = this.messages.panel_title;
	}
}
