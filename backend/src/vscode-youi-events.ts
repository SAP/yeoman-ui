import * as vscode from 'vscode';
import { YouiEvents } from "./youi-events";
import { RpcCommon } from "@sap-devx/webview-rpc/out.ext/rpc-common";

export class VSCodeYouiEvents implements YouiEvents {
    private rpc: RpcCommon;

    constructor(rpc : RpcCommon) {
        this.rpc = rpc;        
    }

    public doGeneratorDone(success: boolean, message: string, targetPath = ""): void {
        this.rpc.invoke("generatorDone", [true, message, targetPath]);
        this.showDoneMessage(targetPath);


    }

    public doGeneratorInstall(): void {
        throw new Error("Method not implemented.");
    }

    private showDoneMessage(targetPath: string): void {
        const Close = 'Close';
        const OpenWorkspace = 'Open Workspace';
        const commandName_Close = "workbench.action.closeActiveEditor";
        const commandName_OpenWorkspace = "vscode.openFolder";
        const commandParam_OpenWorkspace = targetPath;
        vscode.window.showInformationMessage('Where would you like to open the project?', Close , OpenWorkspace)
            .then(selection => {
                if (selection === Close) {
                    this.executeCommand(commandName_Close, undefined);
                } else if (selection === OpenWorkspace) {
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
