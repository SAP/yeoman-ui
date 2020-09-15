import * as vscode from "vscode";
import stripAnsi = require("strip-ansi");
import * as _  from "lodash";
import { OutputChannel } from "./outputUtils";
import { YeomanUI } from "./yeomanui";


module.exports = (origLog: any, outputChannel: OutputChannel, yeomanUi: YeomanUI) => {
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

	function showNotificationMessage(message: string, messageType: string) {
		if (messageType === "error") {
			vscode.window.showErrorMessage(message);
		} else if (messageType === "warn") {
			vscode.window.showWarningMessage(message);
		} else if (messageType === "info") {
			vscode.window.showInformationMessage(message);
		} 
	}

	function showMessage(args: any, withNewLine = true, forceType?: string) {
		const message = getMessage(args);
		const metadata = getMetadata(args);
		const messageLocation = _.get(metadata, "location");
		const messageType = forceType || _.get(metadata, "type");
		if (messageLocation === "message") {
			showNotificationMessage(message, messageType);
		} else if (messageLocation === "prompt") {
			yeomanUi.showPromptMessage(message, messageType);
		}
		withNewLine ? outputChannel.appendLine(message) : outputChannel.append(message);
	}

	function log() {
		origLog.apply(origLog, arguments);
		showMessage(arguments);

		return origLog;
	}

	const origLogWrite = origLog.write;
	log.write = function() {
		origLogWrite.apply(origLog, arguments);
		showMessage(arguments, false);
		return origLog;
	}

	const origLogWriteln = origLog.writeln;
	log.writeln = function() {
		origLogWriteln.apply(origLog, arguments);
		showMessage(arguments);
		return origLog;
	}

	const origLoError = origLog.error;
	log.writeln = function() {
		origLoError.apply(origLog, arguments);
		showMessage(arguments, true, "error");
		return origLog;
	}

	const origLogCreate = origLog.create;
	log.create = function() {
		origLogCreate.apply(origLog, arguments);
		showMessage(arguments);
		return origLog;
	}

	const origLogForce = origLog.force;
	log.force = function() {
		origLogForce.apply(origLog, arguments);
		showMessage(arguments);
		return origLog;
	}

	const origLogConflict = origLog.conflict;
	log.conflict = function() {
		origLogConflict.apply(origLog, arguments);
		showMessage(arguments);
		return origLog;
	}

	const origLogIdentical = origLog.identical;
	log.identical = function() {
		origLogIdentical.apply(origLog, arguments);
		showMessage(arguments);
		return origLog;
	}

	const origLogSkip = origLog.skip;
	log.skip = function() {
		origLogSkip.apply(origLog, arguments);
		showMessage(arguments);
		return origLog;
	}

	return log;
}
