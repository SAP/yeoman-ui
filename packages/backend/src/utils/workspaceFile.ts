import { Uri } from "vscode";
import { writeFileSync, existsSync } from "fs";
import { dirname, join, relative } from "path";
import { Constants } from "./constants";

export interface FolderUriConfig {
  uri: string;
  name: string;
}

export interface FolderPathConfig {
  path: string;
}

export interface WsFoldersToAdd {
  uri: Uri;
  name?: string;
}
class WorkspaceFileUtil {
  public createWsWithPath(targetFolderUri: Uri) {
    const wsFilePath = this.getUniqWorkspaceFilePath();
    const folderConfig: FolderPathConfig = { path: relative(dirname(wsFilePath), targetFolderUri.fsPath) };
    return this.createWs(wsFilePath, folderConfig);
  }

  public createWsWithUri(folderConfig: FolderUriConfig) {
    const wsFilePath = this.getUniqWorkspaceFilePath();
    return this.createWs(wsFilePath, folderConfig);
  }

  private createWs(wsFilePath: string, folderConfig: FolderUriConfig | FolderPathConfig): Uri {
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
