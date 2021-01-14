import * as _ from 'lodash';
import * as path from 'path';
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
import * as envUtils from "../env/utils";


export class YeomanUIPanel extends AbstractWebviewPanel {
	public static YEOMAN_UI = "Application Wizard";

	private static getGensMeta(): Promise<any> {
		const npmPaths = YeomanUIPanel.getNpmPaths();
		return envUtils.getGeneratorsMeta(npmPaths);
	}

	private static getNpmPaths() {
		const parts: string[] = envUtils.HOME_DIR.split(path.sep);
		const userPaths = _.map(parts, (part, index) => {
			const resPath = path.join(...parts.slice(0, index + 1), envUtils.NODE_MODULES);
			return envUtils.isWin32 ? resPath : path.join(path.sep, resPath);
		});

		return YeomanUIPanel.getDefaultPaths().concat(userPaths);
	}
	
	public toggleOutput() {
		this.output.show();
	}

	public notifyGeneratorsChange() {
		const yeomanUi = _.get(this, "yeomanui");
		if (yeomanUi) {
			yeomanUi._notifyGeneratorsChange(YeomanUIPanel.getGensMeta());
		}
	}

	public async runGenerator() {
		const gensMetaPromise = YeomanUIPanel.getGensMeta();
		const gensMeta: string[] = await gensMetaPromise;
		const generator = await vscode.window.showQuickPick(_.keys(gensMeta));
		if (generator) {
			this.loadWebviewPanel({generator});
		}
	}

	public setWebviewPanel(webViewPanel: vscode.WebviewPanel, uiOptions?: any) {
        super.setWebviewPanel(webViewPanel);

		this.messages = _.assign({}, backendMessages, _.get(uiOptions, "messages", {}));
		const filter = GeneratorFilter.create(_.get(uiOptions, "filter"));
		const generator = _.get(uiOptions, "generator");
		const gensMetaPromise = YeomanUIPanel.getGensMeta();

		this.rpc = new RpcExtension(this.webViewPanel.webview);
		this.output.setChannelName(`${YeomanUIPanel.YEOMAN_UI}.${this.messages.channel_name}`);
		const vscodeYouiEvents: YouiEvents = new VSCodeYouiEvents(this.rpc, this.webViewPanel, this.messages, this.output, this.isInBAS);

		const outputPath = _.get(vscode, "workspace.workspaceFolders[0].uri.fsPath"); 
		this.yeomanui = new YeomanUI(this.rpc,
			vscodeYouiEvents,
			this.output,
			this.logger,
			{ generator, filter, messages: this.messages, data: _.get(uiOptions, "data"), gensMetaPromise }, outputPath);
		this.yeomanui.registerCustomQuestionEventHandler("file-browser", "getFilePath", this.showOpenFileDialog.bind(this));
		this.yeomanui.registerCustomQuestionEventHandler("folder-browser", "getPath", this.showOpenFolderDialog.bind(this));

		this.initWebviewPanel();
	}

	private yeomanui: YeomanUI;
	private messages: any;
	private readonly output: GeneratorOutput;

	public constructor(context: vscode.ExtensionContext) {
		super(context);
		this.viewType = "yeomanui";
		this.viewTitle = YeomanUIPanel.YEOMAN_UI;
		this.focusedKey = "yeomanUI.Focused";
		this.output = new GeneratorOutput();
	}

	private static getDefaultPaths(): string[] {
		const customGensLocation: string = ExploreGens.getInstallationLocation(vscode.workspace.getConfiguration());
		if (!_.isEmpty(customGensLocation)) {
			return _.concat(YeomanUIPanel.npmGlobalPaths, path.join(customGensLocation, envUtils.NODE_MODULES));
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
			if (_.isEmpty(currentPath)) {
				throw new Error('Empty path');
			}
			uri = vscode.Uri.file(currentPath);
		} catch (e) {
			uri = _.get(vscode, "workspace.workspaceFolders[0].uri")
			if (_.isNil(uri)) {
				uri = vscode.Uri.file(path.join(envUtils.HOME_DIR));
			}
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
