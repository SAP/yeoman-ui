import { ExtensionContext } from "vscode";
import { createExtensionLoggerAndSubscribeToLogSettingsChanges, getLogger } from "./logger/logger-wrapper";
import { SWA } from "./swa-tracker/swa-tracker-wrapper";
import * as shellJsWorkarounds from "./utils/shellJsWorkarounds";
import { ExtCommands } from "./extCommands";

export function activate(context: ExtensionContext) {
  shellJsWorkarounds.apply();

  // performs first time lookup of installed generators
  // runs in background
  void import("./utils/env");

  try {
    createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
    SWA.createSWATracker(getLogger());
  } catch (error) {
    console.error("Extension activation failed.", error.message);
    return;
  }

  ExtCommands.registerAndSubscribeCommands(context);
}
