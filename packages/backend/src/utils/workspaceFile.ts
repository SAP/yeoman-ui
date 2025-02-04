import { Uri } from "vscode";
import { writeFileSync, existsSync } from "fs";
import { dirname, join, relative } from "path";
import { Constants } from "./constants";

class WorkspaceFileUtil {
  public createWorkspaceFile(folderPath: string, isUri: boolean): Uri {
    const wsFilePath = this.getUniqWorkspaceFilePath();
    const folderConfig = isUri ? { uri: folderPath } : { path: relative(dirname(wsFilePath), folderPath) };

    const fileContent = {
      folders: [folderConfig],
      settings: {},
    };

    writeFileSync(wsFilePath, JSON.stringify(fileContent));
    return Uri.file(wsFilePath);
  }

  private createWsFilePath(counter?: number): string {
    const counterStr = counter ? `.${counter}.` : `.`;
    return join(Constants.HOMEDIR_PROJECTS, `workspace${counterStr}code-workspace`);
  }

  private getUniqWorkspaceFilePath(): string {
    let wsFilePath = this.createWsFilePath();

    let counter = 0;
    while (existsSync(wsFilePath)) {
      wsFilePath = this.createWsFilePath(++counter);
    }

    return wsFilePath;
  }
}

export const WorkspaceFile = new WorkspaceFileUtil();
