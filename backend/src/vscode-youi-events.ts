import * as vscode from 'vscode';
import * as _ from 'lodash';
import { YouiEvents } from "./youi-events";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { GeneratorFilter, GeneratorType } from './filter';
import { relative, isAbsolute } from 'path';

export class VSCodeYouiEvents implements YouiEvents {
    private webviewPanel: vscode.WebviewPanel;
    private readonly filter: GeneratorFilter;
    private readonly messages: any;
    private resolveFunc: any;

    constructor(rpc: IRpc, webviewPanel: vscode.WebviewPanel, filter: GeneratorFilter, messages: any) {
        this.webviewPanel = webviewPanel;   
        this.filter = filter;
        this.messages = messages;    
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
            
            const targetFolderUri: vscode.Uri = vscode.Uri.file(targetFolderPath);

            if (!_.includes(this.filter.types, GeneratorType.module)) {
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
                    return vscode.workspace.updateWorkspaceFolders(wsFoldersQuantity, null, { uri: targetFolderUri});
                }
            });
        }

        return vscode.window.showErrorMessage(errorMmessage);
    }
}
