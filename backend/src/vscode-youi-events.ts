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
    }

    private showDoneMessage(success: boolean, message: string, targetPath: string): void {
        VSCodeYouiEvents.installing = false;
        const OpenWorkspace = 'Open Workspace';
        const commandNameOpenWorkspace = "vscode.openFolder";
        const commandParamOpenWorkspace = targetPath;
        if (success) {
            vscode.window.showInformationMessage('The project has been successfully generated.\nWould you like to open it?', OpenWorkspace).then(selection => {
                if (selection === OpenWorkspace) {
                    this.executeCommand(commandNameOpenWorkspace, commandParamOpenWorkspace);
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
