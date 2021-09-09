import { ExtensionContext, window } from "vscode";
import { createExtensionLoggerAndSubscribeToLogSettingsChanges, getLogger } from "./logger/logger-wrapper";
import { SWA } from "./swa-tracker/swa-tracker-wrapper";
import * as shellJsWorkarounds from "./utils/shellJsWorkarounds";
import { Commands } from "./commands";

let commands: Commands;

export function activate(context: ExtensionContext) {
  const before = Date.now();
  shellJsWorkarounds.apply();

  //void import("./utils/env");

  try {
    createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
    SWA.createSWATracker(getLogger());
  } catch (error) {
    console.error("Extension activation failed.", error.message);
    return;
  }

  commands = new Commands(context);
  commands.registerAndSubscribeCommands();
  const after = Date.now();
  void window.showInformationMessage(`activation - ${after - before}`);
}

export function deactivate() {
  commands = null;
}
