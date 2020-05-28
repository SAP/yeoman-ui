import * as _ from 'lodash';
import * as vscode from 'vscode';
import { createExtensionLoggerAndSubscribeToLogSettingsChanges } from "./logger/logger-wrapper";
import { ExploreGensPanel } from './ExploreGensPanel';
import {YeomanUIPanel} from "./YeomanUIPanel"

const YEOMAN_UI = "Yeoman UI";

export function activate(context: vscode.ExtensionContext) {
	try {
		createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
	} catch (error) {
		console.error("Extension activation failed due to Logger configuration failure:", error.message);
		return;
	}

	YeomanUIPanel.setPaths(context.extensionPath);
	context.subscriptions.push(vscode.commands.registerCommand("loadYeomanUI", YeomanUIPanel.loadYeomanUI));
	context.subscriptions.push(vscode.commands.registerCommand("yeomanUI.toggleOutput", YeomanUIPanel.toggleOutput));
	context.subscriptions.push(vscode.commands.registerCommand("exploreGenerators", ExploreGensPanel.loadYeomanUI));

	vscode.window.registerWebviewPanelSerializer(YeomanUIPanel.viewType, {
		async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
			YeomanUIPanel.setCurrentPanel(webviewPanel, state);
		}
	});

	vscode.window.registerWebviewPanelSerializer(ExploreGensPanel.viewType, {
		async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
			YeomanUIPanel.setCurrentPanel(webviewPanel, state);
		}
	});
}

let channel: vscode.OutputChannel;
export function getOutputChannel(channelName: string): vscode.OutputChannel {
	if (!channel) {
		channel = vscode.window.createOutputChannel(`${YEOMAN_UI}.${channelName}`);
	}

	return channel;
}
