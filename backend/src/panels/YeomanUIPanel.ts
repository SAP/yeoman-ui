import * as _ from 'lodash';
import * as path from 'path';
import * as os from "os";
import * as vscode from 'vscode';
import { YeomanUI } from "../yeomanui";
import { RpcExtension } from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { YouiLog } from "../youi-log";
import { GeneratorFilter } from '../filter';
import backendMessages from "../messages";
import { OutputChannelLog } from '../output-channel-log';
import { YouiEvents } from "../youi-events";
import { VSCodeYouiEvents } from '../vscode-youi-events';
import Environment = require('yeoman-environment');
import { AbstractWebviewPanel } from './AbstractWebviewPanel';


export class YeomanUIPanel extends AbstractWebviewPanel {
	public static YEOMAN_UI = "Yeoman UI";
	private static channel: vscode.OutputChannel;

	public loadYeomanUI(uiOptions?: any) {
		this.disposePanel();
		const webViewPanel = this.createWebviewPanel();
		this.setPanel(webViewPanel, uiOptions);
	}

	public toggleOutput() {
		this.outputChannel.showOutput();
	}

	public setPanel(webViewPanel: vscode.WebviewPanel, uiOptions?: any) {
		super.setPanel(webViewPanel);

		this.messages = _.assign({}, backendMessages, _.get(uiOptions, "messages", {}))
		this.genFilter = GeneratorFilter.create(_.get(uiOptions, "filter"));

		const rpc = new RpcExtension(this.panel.webview);
		this.outputChannel = new OutputChannelLog(this.messages.channel_name);
		const vscodeYouiEvents: YouiEvents = new VSCodeYouiEvents(rpc, this.panel, this.genFilter);
		this.yeomanui = new YeomanUI(rpc,
			vscodeYouiEvents,
			this.outputChannel,
			this.logger,
			{ genFilter: this.genFilter, messages: this.messages, defaultNpmPaths: this.getDefaultPaths() },
			_.get(vscode, "workspace.workspaceFolders[0].uri.fsPath"));
		this.yeomanui.registerCustomQuestionEventHandler("file-browser", "getFilePath", this.showOpenFileDialog.bind(this));
		this.yeomanui.registerCustomQuestionEventHandler("folder-browser", "getPath", this.showOpenFolderDialog.bind(this));

		this.initWebviewPanel();
	}

	public static getOutputChannel(channelName: string): vscode.OutputChannel {
		if (!this.channel) {
			this.channel = vscode.window.createOutputChannel(`${YeomanUIPanel.YEOMAN_UI}.${channelName}`);
		}

		return this.channel;
	}

	private yeomanui: YeomanUI;
	private genFilter: any;
	private messages: any;
	private outputChannel: YouiLog;
	// improves first time performance
	// TODO: replace or remove this API it is very slow, takes more than 2 seconds 
	private readonly defaultNpmPaths: string[] = Environment.createEnv().getNpmPaths();

	public constructor(context: vscode.ExtensionContext) {
		super(context);
		this.viewType = "yeomanui";
		this.viewTitle = YeomanUIPanel.YEOMAN_UI;
		this.focusedKey = "yeomanUI.Focused";
	}

	private getDefaultPaths(): string[] {
		const generatorsLocation: string = _.trim(this.workspaceConfig.get("Yeoman UI.generatorsLocation"));
		if (!_.isEmpty(generatorsLocation)) {
			return _.concat(this.defaultNpmPaths, path.join(generatorsLocation, "node_modules"));
		}

		return this.defaultNpmPaths;
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

	public dispose() {
		super.dispose();
		this.yeomanui = null;
	}

	public initWebviewPanel() {
		super.initWebviewPanel();
		this.panel.title = this.messages.panel_title;
	}
}
