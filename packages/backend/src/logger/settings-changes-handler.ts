import * as vscode from "vscode"; // NOSONAR
import { getLogger } from "./logger-wrapper";
import { LOGGING_LEVEL_CONFIG_PROP, SOURCE_TRACKING_CONFIG_PROP } from "./settings";
import { LogLevel } from "@vscode-logging/logger";

export function logLoggerDetails(context: vscode.ExtensionContext, configLogLevel: string): void {
  getLogger().info(`Start Logging in Log Level: <${configLogLevel}>`);
  getLogger().info(`Full Logs can be found in the <${context.logPath}> folder.`);
}

/**
 * @param {vscode.ExtensionContext} context
 */
export function listenToLogSettingsChanges(context: vscode.ExtensionContext) {
  // To enable dynamic logging level we must listen to VSCode configuration changes
  // on our `loggingLevelConfigProp` configuration setting.
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(LOGGING_LEVEL_CONFIG_PROP)) {
        const logLevel: LogLevel = vscode.workspace.getConfiguration().get(LOGGING_LEVEL_CONFIG_PROP);

        getLogger().changeLevel(logLevel);
        logLoggerDetails(context, logLevel);
      }
    })
  );

  // Enable responding to changes in the sourceLocationTracking setting
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(SOURCE_TRACKING_CONFIG_PROP)) {
        const newSourceLocationTracking: boolean = vscode.workspace.getConfiguration().get(SOURCE_TRACKING_CONFIG_PROP);

        getLogger().changeSourceLocationTracking(newSourceLocationTracking);
      }
    })
  );
}

module.exports = {
  listenToLogSettingsChanges,
  logLoggerDetails,
};
