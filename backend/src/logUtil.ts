import * as vscode from "vscode";
import stripAnsi = require("strip-ansi");
import * as _  from "lodash";
import { OutputChannel } from "./outputUtil";


module.exports = (origLog: any, outputChannel: OutputChannel) => {

	function log() {
		origLog.apply(origLog, arguments);
		const message = _.get(arguments, "[0]");
		outputChannel.appendLine(message);
		return origLog;
	}

	const origLogWrite = origLog.write;
	log.write = function() {
		origLogWrite.apply(origLog, arguments);
		const message = _.get(arguments, "[0]");
		outputChannel.append(message);
		return origLog;
	}

	const origLogWriteln = origLog.writeln;
	log.writeln = function() {
		origLogWriteln.apply(origLog, arguments);
		const message = _.get(arguments, "[0]");
		outputChannel.appendLine(message);
		return origLog;
	}

	const origLogCreate = origLog.create;
	log.create = function() {
		origLogCreate.apply(origLog, arguments);
		const message = _.get(arguments, "[0]");
		outputChannel.appendLine(message);
		return origLog;
	}

	const origLogForce = origLog.force;
	log.force = function() {
		origLogForce.apply(origLog, arguments);
		const message = _.get(arguments, "[0]");
		outputChannel.appendLine(message);
		return origLog;
	}

	const origLogConflict = origLog.conflict;
	log.conflict = function() {
		origLogConflict.apply(origLog, arguments);
		const message = _.get(arguments, "[0]");
		outputChannel.appendLine(message);
		return origLog;
	}

	const origLogIdentical = origLog.identical;
	log.identical = function() {
		origLogIdentical.apply(origLog, arguments);
		const message = _.get(arguments, "[0]");
		outputChannel.appendLine(message);
		return origLog;
	}

	const origLogSkip = origLog.skip;
	log.skip = function() {
		origLogSkip.apply(origLog, arguments);
		const message = _.get(arguments, "[0]");
		outputChannel.appendLine(message);
		return origLog;
	}

	return log;
}
