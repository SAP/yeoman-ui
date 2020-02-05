import * as vscode from "vscode"; // NOSONAR

/**
 * Note that the values of these configuration properties must match those defined in the package.json
 */
export const LOGGING_LEVEL_CONFIG_PROP = "Yeoman UI.loggingLevel";
export const SOURCE_TRACKING_CONFIG_PROP = "Yeoman UI.sourceLocationTracking";

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