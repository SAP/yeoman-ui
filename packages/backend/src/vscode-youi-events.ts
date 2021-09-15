import * as vscode from "vscode";
import { isEmpty, size, isNil, get } from "lodash";
import { YouiEvents } from "./youi-events";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as fs from "fs";
import * as path from "path";
import { GeneratorOutput } from "./vscode-output";
import { IChildLogger } from "@vscode-logging/logger";
import { getClassLogger } from "./logger/logger-wrapper";
import { getImage } from "./images/messageImages";
import { AppWizard, MessageType, Severity } from "@sap-devx/yeoman-ui-types";
import { YeomanUI } from "./yeomanui";

class YoUiAppWizard extends AppWizard {
  constructor(private readonly events: VSCodeYouiEvents) {
    super();
  }

  public showError(message: string, type: MessageType): void {
    this.events.showMessage(message, Severity.error, type);
  }

  public showWarning(message: string, type: MessageType): void {
    this.events.showMessage(message, Severity.warning, type);
  }

  public showInformation(message: string, type: MessageType): void {
    this.events.showMessage(message, Severity.information, type);
  }

  public showProgress(message?: string): void {
    this.events.showProgress(message);
  }
}

export class VSCodeYouiEvents implements YouiEvents {
  private readonly rpc: IRpc;
  private webviewPanel: vscode.WebviewPanel;
  private readonly messages: any;
  private resolveFunc: any;
  public output: GeneratorOutput;
  private readonly logger: IChildLogger;
  private isInBAS: boolean; // eslint-disable-line @typescript-eslint/prefer-readonly
  private readonly appWizard: AppWizard;

  constructor(rpc: IRpc, webviewPanel: vscode.WebviewPanel, messages: any, output: GeneratorOutput, isInBAS: boolean) {
    this.rpc = rpc;
    this.webviewPanel = webviewPanel;
    this.messages = messages;
    this.output = output;
    this.logger = getClassLogger("VSCodeYouiEvents");
    this.isInBAS = isInBAS;
    this.appWizard = new YoUiAppWizard(this);
  }

  public doGeneratorDone(
    success: boolean,
    message: string,
    selectedWorkspace: string,
    type: string,
    targetFolderPath?: string
  ): void {
    this.doClose();
    void this.showDoneMessage(success, message, selectedWorkspace, type, targetFolderPath);
  }

  public doGeneratorInstall(): void {
    this.doClose();
    this.showInstallMessage();
  }

  public getAppWizard(): AppWizard {
    return this.appWizard;
  }

  public executeCommand(id: string, args: any[]): Thenable<any> {
    return vscode.commands.executeCommand(id, ...args);
  }

  private getMessageImage(state: Severity): any {
    return getImage(state, this.isInBAS);
  }

  private showPromptMessage(message: string, state: Severity) {
    const image = this.getMessageImage(state);
    void this.rpc.invoke("showPromptMessage", [`${message}`, state, image]);
  }

  private showNotificationMessage(message: string, state: Severity) {
    switch (state) {
      case Severity.error:
        return vscode.window.showErrorMessage(message);
      case Severity.warning:
        return vscode.window.showWarningMessage(message);
      default:
        return vscode.window.showInformationMessage(message); // Severity.information
    }
  }

  public showMessage(message = "", state: Severity, type: MessageType) {
    message = `${message}`;
    this.output.appendLine(message);
    if (type === MessageType.notification) {
      void this.showNotificationMessage(message, state);
    } else {
      // prompt
      this.showPromptMessage(message, state);
    }
  }

  public showProgress(message?: string): void {
    const openOutput: any = this.messages.show_progress_button;
    const buttons: string[] = [];
    buttons.push(openOutput);
    if (isEmpty(message)) {
      message = this.messages.show_progress_message;
    }
    this.output.appendLine(message);
    this.logger.debug("Showing Progress.", {
      notificationMessage: message,
    });
    void vscode.window.showInformationMessage(message, ...buttons).then((selection) => {
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
    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Installing dependencies...",
      },
      async () => {
        await new Promise((resolve) => {
          this.resolveFunc = resolve;
        });
      }
    );
  }

  private resolveInstallingProgress() {
    if (this.resolveFunc) {
      this.resolveFunc();
    }
  }

  private showDoneMessage(
    success: boolean,
    errorMmessage: string,
    selectedWorkspace: string,
    type: string,
    targetFolderPath?: string
  ): Thenable<any> {
    this.resolveInstallingProgress();

    if (success) {
      let targetFolderUri: vscode.Uri = null;

      // The correct targetFolderPath is unknown
      if (!isNil(targetFolderPath)) {
        targetFolderUri = vscode.Uri.file(targetFolderPath);
      }

      const successInfoMessage = this.getSuccessInfoMessage(selectedWorkspace, type);

      if (selectedWorkspace === this.messages.open_in_a_new_workspace) {
        void vscode.commands.executeCommand("vscode.openFolder", targetFolderUri);
      } else if (selectedWorkspace === this.messages.add_to_workspace) {
        const wsFoldersQuantity = size(vscode.workspace.workspaceFolders);
        vscode.workspace.updateWorkspaceFolders(wsFoldersQuantity, null, {
          uri: targetFolderUri,
        });
        if (wsFoldersQuantity === 0) {
          const workspaceFileUri = this.createNewWorkspaceFile(targetFolderUri.fsPath);
          void vscode.commands.executeCommand("vscode.openFolder", workspaceFileUri);
        }
      }

      return vscode.window.showInformationMessage(successInfoMessage);
    }
    return vscode.window.showErrorMessage(errorMmessage);
  }

  private createNewWorkspaceFile(targetFolderPath: string): vscode.Uri {
    const wsFilePath = this.getUniqWorkspaceFilePath();
    const filePath = this.isInBAS ? `file://${targetFolderPath}` : `${targetFolderPath.replace(/\\/g, "\\\\")}`;
    const fileContent: string = `{
      "folders": [{
        "path": "${filePath}" 
      }],
      "settings": {
        "actions": []
      }
  }`;

    fs.writeFileSync(wsFilePath, fileContent);
    return vscode.Uri.file(wsFilePath);
  }

  private createWsFilePath(counter?: number): string {
    const wsFileExt = this.isInBAS ? "theia-workspace" : "code-workspace";
    const wsFileName = this.getWsFileName();
    const counterStr = counter ? `.${counter}.` : `.`;
    return path.join(YeomanUI["PROJECTS"], `${wsFileName}${counterStr}${wsFileExt}`);
  }

  private getWsFileName(): string {
    const defaultName = "workspace";
    return this.isInBAS ? get(process, "env.WORKSPACE_ID", defaultName) : get(process, "env.USERNAME", defaultName);
  }

  private getUniqWorkspaceFilePath(): string {
    let wsFilePath = this.createWsFilePath();

    let counter = 0;
    while (fs.existsSync(wsFilePath)) {
      wsFilePath = this.createWsFilePath(++counter);
    }

    return wsFilePath;
  }

  private getSuccessInfoMessage(selectedWorkspace: string, type: string): string {
    let successInfoMessage: string = this.messages.artifact_generated_files;
    if (type === "project") {
      if (selectedWorkspace === this.messages.open_in_a_new_workspace) {
        successInfoMessage = this.messages.artifact_generated_project_open_in_a_new_workspace;
      } else if (selectedWorkspace === this.messages.add_to_workspace) {
        successInfoMessage = this.messages.artifact_generated_project_add_to_workspace;
      } else {
        successInfoMessage = this.messages.artifact_generated_project_saved_for_future;
      }
    } else if (type === "module") {
      successInfoMessage = this.messages.artifact_generated_module;
    }
    return successInfoMessage;
  }
}
