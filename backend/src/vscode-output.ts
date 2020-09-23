import * as vscode from "vscode";
import stripAnsi = require("strip-ansi");
import { Output } from "./output";


export class GeneratorOutput implements Output {
	private outputChannel: vscode.OutputChannel;
	private outputChannels: any;

	constructor() {
		this.outputChannels = {};
	}

	public setChannelName(channelName: string) {
		this.outputChannel = this.outputChannels[channelName];
		if (!this.outputChannel) {
			this.outputChannel = vscode.window.createOutputChannel(channelName);
			this.outputChannels[channelName] = this.outputChannel;
		}

		return this.outputChannel;
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
