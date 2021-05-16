import * as path from "path";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { isEmpty, trim } from "lodash";
import { vscode } from "./vscodeProxy";
import { execSync } from "child_process";
import { getClassLogger } from "../logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/types";

const GLOBAL_CONFIG_KEY = "ApplicationWizard.installationLocation";
let logger: IChildLogger;

const _getLogger = (): IChildLogger => {
  if (!logger) {
    logger = getClassLogger("customLocation");
  }

  return logger;
};

const getAbsoluteCustomPath = (): string | undefined => {
  let customPath = trim(
    vscode.workspace.getConfiguration().get(GLOBAL_CONFIG_KEY)
  );
  if (isEmpty(customPath)) {
    _getLogger().debug("customPath is empty");
    return;
  }

  customPath = trim(execSync(`echo ${customPath}`).toString());
  _getLogger().debug(`customPath after echo = ${customPath}`);

  if (!path.isAbsolute(customPath)) {
    customPath = path.resolve(homedir(), customPath);
  }

  _getLogger().debug(`absolute customPath = ${customPath}`);

  return customPath;
};

const isCustomPathExist = (customPath: string) => {
  const exists = existsSync(customPath);
  _getLogger().debug(`${customPath} exists = ${exists}`);
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
    _getLogger().debug(`customNodeModulesPath = ${customNodeModulesPath}`);
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
