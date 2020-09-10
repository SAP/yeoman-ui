import { YeomanUIPanel } from "./panels/YeomanUIPanel";
import stripAnsi = require("strip-ansi");

function appendLine(value: string, channelName: string) {
	YeomanUIPanel.getOutputChannel(channelName).appendLine(stripAnsi(value));
}

module.exports = (channelName: string) => {

	function log(value: string) {
		appendLine(value, channelName);
		return log;
	}

	log.write = (value: string) => {
		appendLine(value, channelName);
		return log;
	}

	log.writeln = (value: string) => {
		appendLine(value, channelName);
		return log;
	}

	log.create = (value: string) => {
		appendLine(value, channelName);
		return log;
	}

	log.force = (value: string) => {
		appendLine(value, channelName);
	}

	log.conflict = (value: string) => {
		appendLine(value, channelName);
		return log;
	}

	log.identical = (value: string) => {
		appendLine(value, channelName);
		return log;
	}

	log.skip = (value: string) => {
		appendLine(value, channelName);
		return log;
	}

	log.showOutput = (): boolean => {
		YeomanUIPanel.getOutputChannel(channelName).show();
		return true;
	}

	return log;
}
