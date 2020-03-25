import * as vscode from 'vscode';
import { YouiEvents } from "./youi-events";
import { RpcCommon } from "@sap-devx/webview-rpc/out.ext/rpc-common";

export class VSCodeYouiEvents implements YouiEvents {
    private rpc: RpcCommon;
    private webviewPanel: vscode.WebviewPanel;
    public static installing: boolean;

    constructor(rpc : RpcCommon, webviewPanel: vscode.WebviewPanel) {
        this.rpc = rpc; 
        this.webviewPanel = webviewPanel;       
    }

    public doGeneratorDone(success: boolean, message: string, targetPath = ""): void {
        this.doClose();
        this.showDoneMessage(success, message, targetPath);
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

    private showDoneMessage(success: boolean, message: string, targetPath: string): void {
        VSCodeYouiEvents.installing = false;
        if (success) {
            const OpenWorkspace = 'Open in New Workspace';
            const AddToWorkspace = vscode.workspace.workspaceFolders ? 'Add to Workspace' : undefined;
            vscode.window.showInformationMessage('The project has been successfully generated.\nWhat would you like to do with it?', AddToWorkspace, OpenWorkspace).then(selection => {
                if (selection === OpenWorkspace) {
                    this.executeCommand("vscode.openFolder", targetPath);
                } else if (selection === AddToWorkspace) {
                    vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.file(targetPath)});
                }
            });
        } else {
            vscode.window.showErrorMessage(message);
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
