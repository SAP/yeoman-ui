import { Uri } from "vscode";
import { writeFileSync, existsSync } from "fs";
import { join } from "path";
import { Constants } from "./constants";
import { get } from "lodash";

class WorkspaceFileUtil {
  public create(targetFolderPath: string): Uri {
    const wsFilePath = this.getUniqWorkspaceFilePath();
    // in theia it looks like: file:///folder1/folder2/file
    // in vscode it looks like: c:\\folder1\folder2\file
    const filePath = Constants.IS_IN_BAS ? `file://${targetFolderPath}` : `${targetFolderPath.replace(/\\/g, "\\\\")}`;
    const fileContent: string = `{
      "folders": [{
        "path": "${filePath}" 
      }],
      "settings": {
        "actions": []
      }
}`;

    writeFileSync(wsFilePath, fileContent);
    return Uri.file(wsFilePath);
  }

  private createWsFilePath(counter?: number): string {
    const wsFileExt = Constants.IS_IN_BAS ? "theia-workspace" : "code-workspace";
    const wsFileName = this.getWsFileName();
    const counterStr = counter ? `.${counter}.` : `.`;
    return join(Constants.HOMEDIR_PROJECTS, `${wsFileName}${counterStr}${wsFileExt}`);
  }

  private getWsFileName(): string {
    const defaultName = "workspace";
    return get(process, Constants.IS_IN_BAS ? "env.WORKSPACE_ID" : "env.USERNAME", defaultName);
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
