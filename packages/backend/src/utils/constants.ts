import { isEmpty, get } from "lodash";
import { join } from "path";
import { homedir } from "os";
import { devspace } from "@sap/bas-sdk";
import { URL } from "url";
import { FolderUriConfig } from "./workspaceFile";
import messages from "../messages";

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


class ConstantsUtil {
  public IS_IN_BAS = !isEmpty(get(process, "env.WS_BASE_URL")) || devspace.getBasMode() === "personal-edition";
  public HOMEDIR_PROJECTS: string = join(homedir(), "projects");
  public GENERATOR_COMPLETED: string = "generatorCompleted";
}

export const Constants = new ConstantsUtil();


