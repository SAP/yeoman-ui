import * as vscode from 'vscode';
import * as _ from 'lodash';
import { YouiEvents } from "./youi-events";
import { RpcCommon } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { GeneratorFilter, GeneratorType } from './filter';

export class VSCodeYouiEvents implements YouiEvents {
    private rpc: RpcCommon;
    private webviewPanel: vscode.WebviewPanel;
    public static installing: boolean;

    constructor(rpc : RpcCommon, webviewPanel: vscode.WebviewPanel, private genFilter: GeneratorFilter) {
        this.rpc = rpc; 
        this.webviewPanel = webviewPanel;       
    }

    public doGeneratorDone(generationSucceeded: boolean, message: string, targetPath: string = ""): void {
        this.doClose();
        this.showDoneMessage(generationSucceeded, message, targetPath);
    }

    public doGeneratorInstall(): void {
        this.doClose();
        this.showInstallMessage();
    }

    private doClose(): void {
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
            this.webviewPanel = null;
        }
    }

    private showInstallMessage(): void {
        VSCodeYouiEvents.installing = true;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Installing dependencies..."
        },
        async () => {
            await new Promise(resolve => {
                let intervalId = setInterval(() => {
                    if (!VSCodeYouiEvents.installing) {
                        clearInterval(intervalId);
                        resolve(undefined);
                    }
                }, 3000);
            });
            return "installing_dependencies_completed";
        });
    }

    private showDoneMessage(success: boolean, errorMmessage: string, targetPath: string): void {
        VSCodeYouiEvents.installing = false;
        
        if (success) {
            let addToWorkspaceButton: any;
            let openInNewWorkspaceButton: any;
            let infoMessage = "The project has been successfully generated.";
            const uriTargetFolder = vscode.Uri.file(targetPath);

            if (this.genFilter.type !== GeneratorType.module) {
                const targetFolderInWorkspace: vscode.WorkspaceFolder = vscode.workspace.getWorkspaceFolder(uriTargetFolder);
                addToWorkspaceButton = targetFolderInWorkspace ? undefined: 'Add to Workspace';
                const wsFolderPath = _.get(targetFolderInWorkspace, "uri.fsPath");
                openInNewWorkspaceButton = (wsFolderPath === uriTargetFolder.fsPath) ? undefined: 'Open in New Workspace';

                if (addToWorkspaceButton || openInNewWorkspaceButton) {
                    infoMessage = infoMessage.concat("\nWhat would you like to do with it?");
                } 
            }
                
            vscode.window.showInformationMessage(infoMessage, addToWorkspaceButton, openInNewWorkspaceButton).then(selection => {
                if (selection === openInNewWorkspaceButton) {
                    this.executeCommand("vscode.openFolder", targetPath);
                } else if (selection === addToWorkspaceButton) {
                    const wsFoldersQuantity = _.size(vscode.workspace.workspaceFolders);
                    vscode.workspace.updateWorkspaceFolders(wsFoldersQuantity, null, { uri: uriTargetFolder});
                }
            });
        } else {
            vscode.window.showErrorMessage(errorMmessage);
        }
    }

	private async executeCommand(commandName: string, commandParam: any): Promise<any> {
		if (commandName === "vscode.open" || commandName === "vscode.openFolder") {
			commandParam = vscode.Uri.file(commandParam);
		}
		return vscode.commands.executeCommand(commandName, commandParam).then(success => {
			console.debug(`Execution of command ${commandName} returned ${success}`);
		}, failure => {
			console.debug(`Execution of command ${commandName} returned ${failure}`);
		});
	}
}
