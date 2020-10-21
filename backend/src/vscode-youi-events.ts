import * as vscode from 'vscode';
import * as _ from 'lodash';
import { YouiEvents } from "./youi-events";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { relative, isAbsolute } from 'path';
import { GeneratorOutput } from './vscode-output';
import { IChildLogger } from '@vscode-logging/logger';
import { getClassLogger } from './logger/logger-wrapper';
import { getImage } from "./images/messageImages"
import { AppWizard, Message } from '@sap-devx/yeoman-ui-types';


class YoUiMessages extends AppWizard.Messages {
	constructor(private events: VSCodeYouiEvents) {
		super();
	}

	public show(): void {

	}

	public showProgress(message?: string): void {
		this.events.showProgress(message);
	}
}
class YoUiAppWizard extends AppWizard {
	constructor(messages: AppWizard.Messages) {
		super(messages);
	}
}

export class VSCodeYouiEvents implements YouiEvents {
	private rpc: IRpc;
	private webviewPanel: vscode.WebviewPanel;
	private readonly messages: any;
	private resolveFunc: any;
	private output: GeneratorOutput;
	private readonly logger: IChildLogger;
	private readonly isInBAS: boolean;
	private appWizard: AppWizard;

	constructor(
		rpc: IRpc,
		webviewPanel: vscode.WebviewPanel,
		messages: any,
		output: GeneratorOutput,
		isInBAS: boolean) {
		this.rpc = rpc;
		this.webviewPanel = webviewPanel;
		this.messages = messages;
		this.output = output;
		this.logger = getClassLogger("VSCodeYouiEvents");
		this.isInBAS = isInBAS;
		this.appWizard = new YoUiAppWizard(new YoUiMessages(this));
	}

	public doGeneratorDone(success: boolean, message: string, targetFolderPath?: string): void {
		this.doClose();
		this.showDoneMessage(success, message, targetFolderPath);
	}

	public doGeneratorInstall(): void {
		this.doClose();
		this.showInstallMessage();
	}

	public getAppWizard(): AppWizard {
		return this.appWizard;
	}

	private getMessageImage(type: Message.Type): any {
		return getImage(type, this.isInBAS);
	}

	public showLogMessage(message: Message) {
		if (message.location === Message.Location.notification) {
			this.showNotificationMessage(message.text, message.type);
		} else if (message.location === Message.Location.prompt) {
			this.showPromptMessage(message.text, message.type, this.getMessageImage(message.type));
		}
	}

	private showNotificationMessage(message: string, type: Message.Type) {
		if (type === Message.Type.error) {
			vscode.window.showErrorMessage(message);
		} else if (type === Message.Type.warn) {
			vscode.window.showWarningMessage(message);
		} else if (type === Message.Type.info) {
			vscode.window.showInformationMessage(message);
		}
	}

	private showPromptMessage(message: string, type: Message.Type, image: any) {
		this.rpc.invoke("showPromptMessage", [message, type, image]);
	}

	public showProgress(message?: string): void {
		const openOutput: any = this.messages.show_progress_button;
		const buttons: string[] = [];
		buttons.push(openOutput);
		if (_.isEmpty(message)) {
			message = this.messages.show_progress_message;
		}
		this.logger.debug("Showing Progress.", {
			notificationMessage: message,
		});
		vscode.window.showInformationMessage(message, ...buttons).then(selection => {
			if (selection === openOutput) {
				return this.toggleOutput();
			}
		});
	}

	private toggleOutput() {
		this.output.show();
		this.logger.trace("Output was shown.");
	}

	private doClose(): void {
		if (this.webviewPanel) {
			this.webviewPanel.dispose();
			this.webviewPanel = null;
		}
	}

	private showInstallMessage(): void {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Installing dependencies..."
		},
			async () => {
				await new Promise(resolve => {
					this.resolveFunc = resolve;
				});
			});
	}

	private resolveInstallingProgress() {
		if (this.resolveFunc) {
			this.resolveFunc();
		}
	}

	/**
	 * Returns true in case probablePredecessorPath is the predecessor path of currentPath.
	 * In other words, returns true when currentPath is contained in some place in probablePredecessorPath.
	 * It can not be implemented by currentPath.contains(probablePredecessorPath), because the path can be the following for example (see tests):
	 * /home/user/projects/../projects
	 * /home/user/./projects
	 * And te pathes above are valid.
	 * So we need to use relative() of path.
	 * When relative path starts with '..', it means that the the pathes don't have a common part.
	 * Otherwise, the pathes have a common part and probablePredecessorPath is really predecessor of currentPath.
	 * The check isAbsolute() is needed for the following case (see it("on success, project path and workspace folder are Windows style ---> add to workspace button and open in new workspace button are visible"):
	 * probablePredecessorPath = "C:\\Windows" and currentPath = "D:\\Program Files".
	 * 
	 * @param probablePredecessorPath 
	 * @param currentPath 
	 */
	private isPredecessorOf(probablePredecessorPath: string, currentPath: string) {
		const relativePath = relative(probablePredecessorPath, currentPath);
		return !_.isEmpty(relativePath) && !_.startsWith(relativePath, '..') && !isAbsolute(relativePath);
	}

	private showDoneMessage(success: boolean, errorMmessage: string, targetFolderPath?: string): Thenable<any> {
		this.resolveInstallingProgress();

		if (success) {
			const addToWorkspace = "Add to Workspace";
			const openInNewWorkspace: any = "Open in New Workspace";
			const items: string[] = [];
			let targetFolderUri: vscode.Uri = null;

			// The correct targetFolderPath is unknown ---> no buttons should be shown
			if (!_.isNil(targetFolderPath)) {
				// Target folder is visible in workpace ---> addToWorkspace only
				// Target folder is not visible in workpace ---> addToWorkspace and openInNewWorkspace

				targetFolderUri = vscode.Uri.file(targetFolderPath);
				const workspacePath = _.get(vscode, "workspace.workspaceFolders[0].uri.fsPath");
				// 1. target workspace folder should not already contain target generator folder
				const foundInWorkspace = _.find(vscode.workspace.workspaceFolders, (wsFolder: vscode.WorkspaceFolder) => {
					// wsFolder is accessor of targetFolderUri, so targetFolderUri is already shown inside wsFolder
					return ((wsFolder.uri.fsPath === targetFolderUri.fsPath) || this.isPredecessorOf(wsFolder.uri.fsPath, targetFolderUri.fsPath));
				});
				// 2. Theia bug: vscode.workspace.workspaceFolders should not be undefined or empty
				if (!foundInWorkspace && workspacePath) {
					items.push(addToWorkspace);
				}

				// target workspace path should not be equal to target generator folder path
				if (workspacePath !== targetFolderUri.fsPath) {
					items.push(openInNewWorkspace);
				}
			}

			const successInfoMessage = this.messages.artifact_generated;
			if (_.isEmpty(items)) {
				return vscode.window.showInformationMessage(successInfoMessage);
			}

			return vscode.window.showInformationMessage(`${successInfoMessage}\nWhat would you like to do with it?`, ...items).then(selection => {
				if (selection === openInNewWorkspace) {
					return vscode.commands.executeCommand("vscode.openFolder", targetFolderUri);
				} else if (selection === addToWorkspace) {
					const wsFoldersQuantity = _.size(vscode.workspace.workspaceFolders);
					return vscode.workspace.updateWorkspaceFolders(wsFoldersQuantity, null, { uri: targetFolderUri });
				}
			});
		}

		return vscode.window.showErrorMessage(errorMmessage);
	}
}
