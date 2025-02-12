import { Uri } from "vscode";
import { writeFileSync, existsSync } from "fs";
import { dirname, join, relative } from "path";
import { Constants } from "./constants";

interface FolderConfig {
  name?: string;
}

interface FolderUriConfig extends FolderConfig {
  uri: string;
}

interface FolderPathConfig extends FolderConfig {
  path: string;
}

class WorkspaceFileUtil {
  public create(targetFolderUri: Uri, name: string, isUri: boolean = false): Uri {
    const wsFilePath = this.getUniqWorkspaceFilePath();
    const folderConfig: FolderUriConfig | FolderPathConfig = isUri
      ? { uri: targetFolderUri.toString() }
      : { path: relative(dirname(wsFilePath), targetFolderUri.fsPath) };
    folderConfig.name = name;
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
