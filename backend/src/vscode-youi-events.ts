import * as vscode from 'vscode';
import * as _ from 'lodash';
import { YouiEvents } from "./youi-events";
import { RpcCommon, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { GeneratorFilter, GeneratorType } from './filter';

export class VSCodeYouiEvents implements YouiEvents {
    private webviewPanel: vscode.WebviewPanel;
    private genFilter: GeneratorFilter;
    private resolveFunc: any;

    constructor(rpc : IRpc, webviewPanel: vscode.WebviewPanel, genFilter: GeneratorFilter) {
        this.webviewPanel = webviewPanel;   
        this.genFilter = genFilter;    
    }

    public doGeneratorDone(success: boolean, message: string, targetFolderPath?: string): void {
        this.doClose();
        this.showDoneMessage(success, message, targetFolderPath);
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

    private showDoneMessage(success: boolean, errorMmessage: string, targetFolderPath?: string): Thenable<any> {
        this.resolveInstallingProgress();

        if (success) {
            const addToWorkspace: string = "Add to Workspace";
            const openInNewWorkspace: any = "Open in New Workspace";
            const items: string[] = [];
            
            const targetFolderUri: vscode.Uri = vscode.Uri.file(targetFolderPath);

            if (_.indexOf(this.genFilter.types, GeneratorType.module) === -1) {
                const workspacePath = _.get(vscode, "workspace.workspaceFolders[0].uri.fsPath");
                // 1. target workspace folder should not already contain target generator folder
                const foundInWorkspace = _.find(vscode.workspace.workspaceFolders, (wsFolder: vscode.WorkspaceFolder) => {
                    return targetFolderUri.fsPath === wsFolder.uri.fsPath;
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

            const successInfoMessage = "The project has been generated.";
            if (_.isEmpty(items)) {
                return vscode.window.showInformationMessage(successInfoMessage);
            } 

            return vscode.window.showInformationMessage(`${successInfoMessage}\nWhat would you like to do with it?`, ...items).then(selection => {
                if (selection === openInNewWorkspace) {
                    return vscode.commands.executeCommand("vscode.openFolder", targetFolderUri);
                } else if (selection === addToWorkspace) {
                    const wsFoldersQuantity = _.size(vscode.workspace.workspaceFolders);
                    return vscode.workspace.updateWorkspaceFolders(wsFoldersQuantity, null, { uri: targetFolderUri});
                }
            });
        }

        return vscode.window.showErrorMessage(errorMmessage);
    }
}
