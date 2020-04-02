import * as vscode from 'vscode';
import * as _ from 'lodash';
import { YouiEvents } from "./youi-events";
import { RpcCommon } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { GeneratorFilter, GeneratorType } from './filter';

export class VSCodeYouiEvents implements YouiEvents {
    private rpc: RpcCommon;
    private webviewPanel: vscode.WebviewPanel;
    public static installing: boolean;
    private genFilter: GeneratorFilter;

    constructor(rpc : RpcCommon, webviewPanel: vscode.WebviewPanel, genFilter: GeneratorFilter) {
        this.rpc = rpc; 
        this.webviewPanel = webviewPanel;   
        this.genFilter = genFilter;    
    }

    public doGeneratorDone(success: boolean, message: string, targetPath: string = ""): void {
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

    private showDoneMessage(success: boolean, errorMmessage: string, targetPath: string): Thenable<any> {
        VSCodeYouiEvents.installing = false;
        
        if (success) {
            const addToWorkspace: string = "Add to Workspace";
            const openInNewWorkspace: any = "Open in New Workspace";
            const items: string[] = [];
            
            const uriTargetFolder = vscode.Uri.file(targetPath);

            if (this.genFilter.type !== GeneratorType.module) {
                const targetWorkspaceFolder: vscode.WorkspaceFolder = vscode.workspace.getWorkspaceFolder(uriTargetFolder);
                // 1. target workspace folder should not already contain target generator folder
                // 2. Theia bug: vscode.workspace.workspaceFolders should not be undefined
                if (!targetWorkspaceFolder && (_.size(vscode.workspace.workspaceFolders) > 0)) {
                    items.push(addToWorkspace);
                }

                // target workspace path should not be equal to target generator folder path
                if (_.get(targetWorkspaceFolder, "uri.fsPath") !== _.get(uriTargetFolder, "fsPath")) {
                    items.push(openInNewWorkspace);
                }
            }

            const successInfoMessage = "The project has been successfully generated.";
            if (_.isEmpty(items)) {
                return vscode.window.showInformationMessage(successInfoMessage);
            } 

            return vscode.window.showInformationMessage(`${successInfoMessage}\nWhat would you like to do with it?`, ...items).then(selection => {
                if (selection === openInNewWorkspace) {
                    return vscode.commands.executeCommand("vscode.openFolder", uriTargetFolder);
                } else if (selection === addToWorkspace) {
                    const wsFoldersQuantity = _.size(vscode.workspace.workspaceFolders);
                    return vscode.workspace.updateWorkspaceFolders(wsFoldersQuantity, null, { uri: uriTargetFolder});
                }
            });
        }

        return vscode.window.showErrorMessage(errorMmessage);
    }
}
