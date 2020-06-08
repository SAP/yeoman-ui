import * as vscode from 'vscode';
import { createExtensionLoggerAndSubscribeToLogSettingsChanges } from "./logger/logger-wrapper";
import {YeomanUIPanel} from "./YeomanUIPanel";
import {ExploreGensPanel} from "./ExploreGensPanel";

export function activate(context: vscode.ExtensionContext) {
	try {
		createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
	} catch (error) {
		console.error("Extension activation failed due to Logger configuration failure:", error.message);
		return;
	}

	// YeomanUIPanel
	YeomanUIPanel.setPaths(context.extensionPath);
	context.subscriptions.push(vscode.commands.registerCommand("loadYeomanUI", YeomanUIPanel.loadYeomanUI));
	context.subscriptions.push(vscode.commands.registerCommand("yeomanUI.toggleOutput", YeomanUIPanel.toggleOutput));

	vscode.window.registerWebviewPanelSerializer(YeomanUIPanel.viewType, {
		async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
			YeomanUIPanel.setCurrentPanel(webviewPanel, state);
		}
	});

	// ExploreGensPanel
	ExploreGensPanel.setPaths(context.extensionPath);
	context.subscriptions.push(vscode.commands.registerCommand("exploreGenerators", ExploreGensPanel.exploreGenerators));

	vscode.window.registerWebviewPanelSerializer(ExploreGensPanel.viewType, {
		async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
			ExploreGensPanel.setCurrentPanel(webviewPanel);
		}
	});
}
