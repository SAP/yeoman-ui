import * as vscode from 'vscode';
import { createExtensionLoggerAndSubscribeToLogSettingsChanges, getLogger } from "./logger/logger-wrapper";
import { AbstractWebviewPanel } from "./panels/AbstractWebviewPanel";
import { YeomanUIPanel } from "./panels/YeomanUIPanel";
import { ExploreGensPanel } from "./panels/ExploreGensPanel";
import { SWA } from './swa-tracker/swa-tracker-wrapper';

let extContext: vscode.ExtensionContext;
let yeomanUIPanel: YeomanUIPanel;
let exploreGensPanel: ExploreGensPanel;

export async function activate(context: vscode.ExtensionContext) {
	extContext = context;

	try {
		createExtensionLoggerAndSubscribeToLogSettingsChanges(extContext);
		SWA.createSWATracker(getLogger());
	} catch (error) {
		console.error("Extension activation failed.", error.message);
		return;
	}

	// YeomanUIPanel
	yeomanUIPanel = new YeomanUIPanel(extContext);
	registerAndSubscribeCommand("loadYeomanUI", yeomanUIPanel.loadWebviewPanel.bind(yeomanUIPanel));
	registerAndSubscribeCommand("yeomanUI.toggleOutput", yeomanUIPanel.toggleOutput.bind(yeomanUIPanel));
	registerAndSubscribeCommand("yeomanUI._notifyGeneratorsChange", yeomanUIPanel.notifyGeneratorsChange.bind(yeomanUIPanel));
	registerWebviewPanelSerializer(yeomanUIPanel);

	// ExploreGensPanel
	exploreGensPanel = new ExploreGensPanel(extContext);
	registerAndSubscribeCommand("exploreGenerators", exploreGensPanel.loadWebviewPanel.bind(exploreGensPanel));
	registerAndSubscribeCommand("runAnyGenerator", exploreGensPanel.runAnyGenerator.bind(exploreGensPanel));
	registerWebviewPanelSerializer(exploreGensPanel);
}

function registerAndSubscribeCommand(cId: string, cAction: any) {
	extContext.subscriptions.push(vscode.commands.registerCommand(cId, cAction));
}

function registerWebviewPanelSerializer(abstractPanel: AbstractWebviewPanel) {
	vscode.window.registerWebviewPanelSerializer(abstractPanel.viewType, {
		async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state?: any) {
			abstractPanel.setWebviewPanel(webviewPanel, state);
		}
	});
}

export function deactivate() {
	yeomanUIPanel = null;
	exploreGensPanel = null;
}
