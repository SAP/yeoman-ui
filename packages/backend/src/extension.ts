import { ExtensionContext, window, WebviewPanel } from "vscode";
import { createExtensionLoggerAndSubscribeToLogSettingsChanges } from "./logger/logger-wrapper";
import { AnalyticsWrapper } from "./usage-report/usage-analytics-wrapper";
import * as shellJsWorkarounds from "./utils/shellJsWorkarounds";
import { ExtCommands } from "./extCommands";

let extCommands: ExtCommands;

export function activate(context: ExtensionContext) {
  shellJsWorkarounds.apply();

  extCommands = new ExtCommands(context);

  // performs first time lookup of installed generators
  // runs in background
  void import("./utils/env");

  try {
    createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
    AnalyticsWrapper.createTracker(context);
  } catch (error) {
    console.error("Extension activation failed.", error.message);
    return;
  }

  extCommands.registerAndSubscribeCommands();

  context.subscriptions.push(
    window.registerWebviewPanelSerializer("yeomanui", {
      async deserializeWebviewPanel(webViewPanel: WebviewPanel, state?: unknown) {
        (await extCommands.getYeomanUIPanel()).setWebviewPanel(webViewPanel, state);
      },
    }),
  );

  context.subscriptions.push(
    window.registerWebviewPanelSerializer("exploreGens", {
      async deserializeWebviewPanel(webViewPanel: WebviewPanel, state?: unknown) {
        (await extCommands.getExploreGensPanel()).setWebviewPanel(webViewPanel, state);
      },
    }),
  );
}

export function deactivate() {
  extCommands = null;
}
