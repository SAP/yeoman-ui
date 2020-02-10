import * as vscode from "vscode"; // NOSONAR
<<<<<<< HEAD
=======
import { resolve } from "dns";
>>>>>>> 0ddcbf20994f059441e819db7e3e1a9563689dd9

/**
 * Note that the values of these configuration properties must match those defined in the package.json
 */
<<<<<<< HEAD
export const LOGGING_LEVEL_CONFIG_PROP = "Yeoman UI.Logger.loggingLevel";
export const SOURCE_TRACKING_CONFIG_PROP = "Yeoman UI.Logger.sourceLocationTracking";
=======
export const LOGGING_LEVEL_CONFIG_PROP = "logger.loggingLevel";
export const SOURCE_TRACKING_CONFIG_PROP = "logger.sourceLocationTracking";
>>>>>>> 0ddcbf20994f059441e819db7e3e1a9563689dd9

/**
 * @returns {LogLevel}
 */
export function getLoggingLevelSetting(): string {
  const config = vscode.workspace.getConfiguration();
  return config.get(LOGGING_LEVEL_CONFIG_PROP);
}

/**
 * @returns {boolean}
 */
export function getSourceLocationTrackingSetting(): boolean {
  const config = vscode.workspace.getConfiguration();
  return config.get(SOURCE_TRACKING_CONFIG_PROP);
}

module.exports = {
  LOGGING_LEVEL_CONFIG_PROP,
  SOURCE_TRACKING_CONFIG_PROP,
  getLoggingLevelSetting,
  getSourceLocationTrackingSetting
}; 