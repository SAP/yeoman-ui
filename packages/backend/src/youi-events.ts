import { AppWizard } from "@sap-devx/yeoman-ui-types";

export interface YouiEvents {
  doGeneratorDone(
    success: boolean,
    message: string,
    selectedWorkspace: string,
    type: string,
    targetFolderPath?: string
  ): void;
  doGeneratorInstall(): void;
  showProgress(message?: string): void;
  getAppWizard(): AppWizard;
  executeCommand(id: string, ...args: any[]): Thenable<any>;
  setAppWizardHeaderTitle(title: string, info?: string): void;
}
