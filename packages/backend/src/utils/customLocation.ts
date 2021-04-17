import * as path from "path";
import { existsSync } from "fs";
import { isEmpty, trim } from "lodash";
import { vscode } from "./vscodeProxy";
import { execSync } from "child_process";

export const getInstallationPath = (): string => {
  return vscode.workspace
    .getConfiguration()
    .get("ApplicationWizard.installationLocation");
};

export const getCustomNpmPath = (): string => {
  const installationLocation: string = getInstallationPath();
  if (!isEmpty(installationLocation)) {
    return path.join(installationLocation, "node_modules");
  }
};

export const checkPathExists = () => {
  const customNpmPath = getCustomNpmPath();
  let abs = trim(execSync(`echo ${customNpmPath}`).toString());

  if (!path.isAbsolute(abs)) {
    abs = path.resolve(abs);
  }

  return existsSync(abs);
};
