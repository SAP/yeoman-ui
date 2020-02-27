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
        this.showDoneMessage(targetPath);
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
        async (progress) => {
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
        return;
    }

    private showDoneMessage(targetPath: string): void {
        VSCodeYouiEvents.installing = false;
        const OpenWorkspace = 'Open Workspace';
        const commandName_OpenWorkspace = "vscode.openFolder";
        const commandParam_OpenWorkspace = targetPath;
        vscode.window.showInformationMessage('Where would you like to open the project?', OpenWorkspace)
            .then(selection => {
                if (selection === OpenWorkspace) {
                    this.executeCommand(commandName_OpenWorkspace, commandParam_OpenWorkspace);
                }
            });
        return;
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
