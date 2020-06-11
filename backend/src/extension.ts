import * as vscode from 'vscode';
import { createExtensionLoggerAndSubscribeToLogSettingsChanges } from "./logger/logger-wrapper";
import { YeomanUIPanel } from "./YeomanUIPanel";
import { ExploreGensPanel } from "./ExploreGensPanel";

export function activate(context: vscode.ExtensionContext) {
	try {
		createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
	} catch (error) {
		console.error("Extension activation failed due to Logger configuration failure:", error.message);
		return;
	}

	// YeomanUIPanel
	const yeomanUIPanel = new YeomanUIPanel(context);
	context.subscriptions.push(vscode.commands.registerCommand("loadYeomanUI", yeomanUIPanel.loadYeomanUI.bind(yeomanUIPanel)));
	context.subscriptions.push(vscode.commands.registerCommand("yeomanUI.toggleOutput", yeomanUIPanel.toggleOutput.bind(yeomanUIPanel)));

	vscode.window.registerWebviewPanelSerializer(yeomanUIPanel.viewType, {
		async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
			yeomanUIPanel.setPanel(webviewPanel, state);
		}
	});

	// ExploreGensPanel
	const exploreGensPanel = new ExploreGensPanel(context);
	context.subscriptions.push(vscode.commands.registerCommand("exploreGenerators", exploreGensPanel.exploreGenerators.bind(exploreGensPanel)));

	vscode.window.registerWebviewPanelSerializer(exploreGensPanel.viewType, {
		async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
			exploreGensPanel.setPanel(webviewPanel);
		}
	});
}
