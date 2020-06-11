import * as vscode from 'vscode';
import { createExtensionLoggerAndSubscribeToLogSettingsChanges } from "./logger/logger-wrapper";
import { YeomanUIPanel } from "./panels/YeomanUIPanel";
import { ExploreGensPanel } from "./panels/ExploreGensPanel";

let extContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
	extContext = context;

	try {
		createExtensionLoggerAndSubscribeToLogSettingsChanges(extContext);
	} catch (error) {
		console.error("Extension activation failed due to Logger configuration failure:", error.message);
		return;
	}

	// YeomanUIPanel
	const yeomanUIPanel = new YeomanUIPanel(extContext);
	registerAndSubscribeCommand("loadYeomanUI", yeomanUIPanel.loadYeomanUI.bind(yeomanUIPanel));
	registerAndSubscribeCommand("yeomanUI.toggleOutput", yeomanUIPanel.toggleOutput.bind(yeomanUIPanel));

	vscode.window.registerWebviewPanelSerializer(yeomanUIPanel.viewType, {
		async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
			yeomanUIPanel.setPanel(webviewPanel, state);
		}
	});

	// ExploreGensPanel
	const exploreGensPanel = new ExploreGensPanel(extContext);
	registerAndSubscribeCommand("exploreGenerators", exploreGensPanel.exploreGenerators.bind(exploreGensPanel));

	vscode.window.registerWebviewPanelSerializer(exploreGensPanel.viewType, {
		async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
			exploreGensPanel.setPanel(webviewPanel);
		}
	});
}

function registerAndSubscribeCommand(cId: string, cAction: any) {
	extContext.subscriptions.push(vscode.commands.registerCommand(cId, cAction));
}
