import { Uri } from "vscode";
import { writeFileSync, existsSync } from "fs";
import { dirname, join, relative } from "path";
import { Constants } from "./constants";
import messages from "../messages";

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

export function isUriFlow(optionalFolderUri: string): boolean {
  return getFolderUri(optionalFolderUri) !== undefined;
}

export function getFolderUri(optionalFolderUri: string): FolderUriConfig | undefined {
  try {  
    const folderUri = JSON.parse(optionalFolderUri);
    return folderUri?.uri && folderUri?.name ? folderUri : undefined;
  } catch {
    return undefined;
  }
}

export function getValidFolderUri(folderUri: any): FolderUriConfig {
  if (
    folderUri && 
    typeof folderUri.uri === 'string' && 
    isValidUri(folderUri.uri) && 
    typeof folderUri.name === 'string'
  ) {
    return { uri: folderUri.uri, name: folderUri.name };
  }
  throw new Error(messages.bad_project_uri_config_error);
}

export function isValidUri(uri: string): boolean {
  try {
    new URL(uri);
    return true;
  } catch {
    return false;
  }
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
