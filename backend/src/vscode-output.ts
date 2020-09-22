import * as vscode from "vscode";
import * as _ from "lodash";
import stripAnsi = require("strip-ansi");
import { Output } from "./output";


export class GeneratorOutput implements Output {
	private outputChannel: vscode.OutputChannel;
	private outputChannels: any;

	constructor() {
		this.outputChannels = {};
	}

	public setChannelName(channelName: string) {
		const outputChannel = _.get(this.outputChannels, channelName);
		if (!outputChannel) {
			this.outputChannel = vscode.window.createOutputChannel(channelName);
			_.set(this.outputChannels, channelName, this.outputChannel);
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
