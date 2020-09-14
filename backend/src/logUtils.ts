import * as vscode from "vscode";
import stripAnsi = require("strip-ansi");
import * as _  from "lodash";
import { OutputChannel } from "./outputUtils";


module.exports = (origLog: any, outputChannel: OutputChannel) => {
	function getMessage(args: any) {
		const message = stripAnsi(_.get(args, "[0]", ""));
		return `${message}`;
	}

	function getMetadata(args: any) {
		const metadata = _.get(args, "[2]", _.get(args, "[1]", {}));
		const type = ["error", "info", "warn"].includes(metadata.type);
		const location = ["inline", "message"].includes(metadata.location);
		if (type && location) {
			return metadata;
		} 
	}

	function log() {
		origLog.apply(origLog, arguments);
		const message = getMessage(arguments);
		outputChannel.appendLine(message);
		const metadata = getMetadata(arguments);
		if (metadata) {
			if (metadata.type === "error" && metadata.location === "message") {
				vscode.window.showErrorMessage(message);
			} else if (metadata.type === "warn" && metadata.location === "message") {
				vscode.window.showWarningMessage(message);
			} else if (metadata.type === "info" && metadata.location === "message") {
				vscode.window.showInformationMessage(message);
			} else if (metadata.type === "error" && metadata.location === "prompt") {
				vscode.window.showErrorMessage(message);
			} else if (metadata.type === "warn" && metadata.location === "prompt") {
				vscode.window.showWarningMessage(message);
			} else if (metadata.type === "info" && metadata.location === "prompt") {
				vscode.window.showInformationMessage(message);
			}
		}

		return origLog;
	}

	const origLogWrite = origLog.write;
	log.write = function() {
		origLogWrite.apply(origLog, arguments);
		const message = getMessage(arguments);
		outputChannel.append(message);
		return origLog;
	}

	const origLogWriteln = origLog.writeln;
	log.writeln = function() {
		origLogWriteln.apply(origLog, arguments);
		const message = getMessage(arguments);
		outputChannel.appendLine(message);
		return origLog;
	}

	const origLogCreate = origLog.create;
	log.create = function() {
		origLogCreate.apply(origLog, arguments);
		const message = getMessage(arguments);
		outputChannel.appendLine(message);
		return origLog;
	}

	const origLogForce = origLog.force;
	log.force = function() {
		origLogForce.apply(origLog, arguments);
		const message = getMessage(arguments);
		outputChannel.appendLine(message);
		return origLog;
	}

	const origLogConflict = origLog.conflict;
	log.conflict = function() {
		origLogConflict.apply(origLog, arguments);
		const message = getMessage(arguments);
		outputChannel.appendLine(message);
		return origLog;
	}

	const origLogIdentical = origLog.identical;
	log.identical = function() {
		origLogIdentical.apply(origLog, arguments);
		const message = getMessage(arguments);
		outputChannel.appendLine(message);
		return origLog;
	}

	const origLogSkip = origLog.skip;
	log.skip = function() {
		origLogSkip.apply(origLog, arguments);
		const message = getMessage(arguments);
		outputChannel.appendLine(message);
		return origLog;
	}

	return log;
}
