import * as vscode from "vscode";
import stripAnsi = require("strip-ansi");
import { YeomanUIPanel } from "./panels/YeomanUIPanel";


export class OutputChannel {
	private outputChannel: vscode.OutputChannel;

	constructor(channelName: string) {
		this.outputChannel = vscode.window.createOutputChannel(channelName);
	}

	public show() {
		this.outputChannel.show();
	}

	public append(value: string) {
		this.outputChannel.append(stripAnsi(value));
	}

	public appendLine(value: string) {
		this.outputChannel.appendLine(stripAnsi(value));
	}
}
