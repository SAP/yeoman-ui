import * as path from "path";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { isEmpty, trim } from "lodash";
import { vscode } from "./vscodeProxy";
import { execSync } from "child_process";

export const GLOBAL_CONFIG_KEY = "ApplicationWizard.installationLocation";

const getAbsoluteCustomPath = (): string | undefined => {
  let customPath = trim(
    vscode.workspace.getConfiguration().get(GLOBAL_CONFIG_KEY)
  );
  if (isEmpty(customPath)) {
    return;
  }

  customPath = trim(execSync(`echo ${customPath}`).toString());

  if (!path.isAbsolute(customPath)) {
    customPath = path.resolve(homedir(), customPath);
  }

  return customPath;
};

const isCustomPathExist = (customPath: string) => {
  const exists = existsSync(customPath);
  return exists;
};

export const getPath = (): string => {
  const customPath = getAbsoluteCustomPath();
  return isCustomPathExist(customPath) ? trim(customPath) : undefined;
};

export const DEFAULT_LOCATION = path.join(
  homedir(),
  ".application_wizard",
  "generators"
);

export const getNodeModulesPath = (): string => {
  const customPath: string = getPath();
  if (!isEmpty(customPath)) {
    const customNodeModulesPath = path.join(customPath, "node_modules");
    return customNodeModulesPath;
  }
};

export const setDefaultPath = (): Thenable<void> => {
  mkdirSync(DEFAULT_LOCATION, { recursive: true });
  return vscode.workspace
    .getConfiguration()
    .update(
      GLOBAL_CONFIG_KEY,
      DEFAULT_LOCATION,
      vscode.ConfigurationTarget.Global
    );
};
