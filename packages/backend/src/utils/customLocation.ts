import * as path from "path";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { isEmpty, trim } from "lodash";
import { vscode } from "./vscodeProxy";
// import { execSync } from "child_process";

const GLOBAL_CONFIG_KEY = "ApplicationWizard.installationLocation";
export const DEFAULT_LOCATION = path.join(homedir(), ".application_wizard", "generators");

export const getPath = (): string => {
  const location = vscode.workspace.getConfiguration().get(GLOBAL_CONFIG_KEY);
  return existsSync(location) ? trim(location) : undefined;
};

export const getNodeModulesPath = (): string => {
  const customPath: string = getPath();
  if (!isEmpty(customPath)) {
    return path.join(customPath, "node_modules");
  }
};

export const setDefaultPath = (): Thenable<void> => {
  mkdirSync(DEFAULT_LOCATION, { recursive: true });
  return vscode.workspace
    .getConfiguration()
    .update(GLOBAL_CONFIG_KEY, DEFAULT_LOCATION, vscode.ConfigurationTarget.Global);
};
// TODo: support ~/ as path
// export const checkPathExists = () => {
//   const npmPath = getNpmPath();
//   let abs = trim(execSync(`echo ${npmPath}`).toString());

//   if (!path.isAbsolute(abs)) {
//     abs = path.resolve(abs);
//   }

//   return existsSync(abs);
// };
