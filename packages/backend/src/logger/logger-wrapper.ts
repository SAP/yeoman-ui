import * as vscode from "vscode"; // NOSONAR
import {
  getExtensionLogger,
  getExtensionLoggerOpts,
  IChildLogger,
  IVSCodeExtLogger,
  LogLevel,
} from "@vscode-logging/logger";
import {
  listenToLogSettingsChanges,
  logLoggerDetails,
} from "./settings-changes-handler";
import {
  getLoggingLevelSetting,
  getSourceLocationTrackingSetting,
} from "./settings";

const YEOMAN_UI_LOGGER_NAME = "yeomanui";
const YEOMAN_UI = "Application Wizard";
const WEBVIEW_RPC_LOGGER_NAME = "Webview Rpc";

/**
 * A Simple Wrapper to hold the state of our "singleton" (per extension) IVSCodeExtLogger
 * implementation.
 */

export const ERROR_LOGGER_NOT_INITIALIZED =
  "Logger has not yet been initialized!";

/**
 * @type {IVSCodeExtLogger}
 */
let logger: any;

function isInitialized(): boolean {
  return logger !== undefined ? true : false;
}

/**
 * Note the use of a getter function so the value would be lazy resolved on each use.
 * This enables concise and simple consumption of the Logger throughout our Extension.
 *
 * @returns { IVSCodeExtLogger }
 */
export function getLogger(): IVSCodeExtLogger {
  if (isInitialized() === false) {
    throw Error(ERROR_LOGGER_NOT_INITIALIZED);
  }
  return logger;
}

function getLibraryLogger(libraryName: string): IChildLogger {
  return getLogger().getChildLogger({ label: libraryName });
}

export function getClassLogger(className: string): IChildLogger {
  return getLogger().getChildLogger({ label: className });
}

export function getYeomanUILibraryLogger(): IChildLogger {
  return getLibraryLogger(YEOMAN_UI_LOGGER_NAME);
}

export function getWebviewRpcLibraryLogger(): IChildLogger {
  return getLibraryLogger(WEBVIEW_RPC_LOGGER_NAME);
}

export function getConsoleWarnLogger(): IChildLogger {
  const consoleLog = (msg: string, ...args: any[]): void => {
    console.log(msg, args);
  };
  const noopLog = () => {};
  const warningLogger = {
    fatal: consoleLog,
    error: consoleLog,
    warn: consoleLog,
    info: noopLog,
    debug: noopLog,
    trace: noopLog,
    getChildLogger: () => {
      return warningLogger;
    },
  };
  return warningLogger;
}

/**
 * This function should be invoked after the Logger has been initialized in the Extension's `activate` function.
 * @param {IVSCodeExtLogger} newLogger
 */
function initLoggerWrapper(newLogger: any) {
  logger = newLogger;
}

function createExtensionLogger(context: vscode.ExtensionContext) {
  const contextLogPath = context.logPath;
  const logLevelSetting: LogLevel = getLoggingLevelSetting();
  const sourceLocationTrackingSettings: boolean = getSourceLocationTrackingSetting();
  const logOutputChannel = vscode.window.createOutputChannel(YEOMAN_UI);

  //TODO:  const meta = require(resolve(context.extensionPath, PACKAGE_JSON));
  const extensionLoggerOpts: getExtensionLoggerOpts = {
    extName: YEOMAN_UI,
    level: logLevelSetting,
    logPath: contextLogPath,
    logOutputChannel: logOutputChannel,
    sourceLocationTracking: sourceLocationTrackingSettings,
    logConsole: true,
  };

  // The Logger must first be initialized before any logging commands may be invoked.
  const extensionLogger = getExtensionLogger(extensionLoggerOpts);
  // Update the logger-wrapper with a reference to the extLogger.
  initLoggerWrapper(extensionLogger);
  logLoggerDetails(context, logLevelSetting);
}

export function createExtensionLoggerAndSubscribeToLogSettingsChanges(
  context: vscode.ExtensionContext
) {
  createExtensionLogger(context);
  // Subscribe to Logger settings changes.
  listenToLogSettingsChanges(context);
}
