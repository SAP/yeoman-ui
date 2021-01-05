import { AppWizard } from "@sap-devx/yeoman-ui-types";

export interface YouiEvents {
  doGeneratorDone(success: boolean, message: string, isTypeProject: boolean, targetFolderPath?: string): void;
  doGeneratorInstall(): void;
  showProgress(message?: string): void;
  getAppWizard(): AppWizard;
}
