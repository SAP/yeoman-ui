import stripAnsi = require("strip-ansi");
import * as _  from "lodash";
import { Output } from "./output";
import { YeomanUI } from "./yeomanui";


module.exports = (origLog: any, output: Output, yeomanUi: YeomanUI) => {
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

	function showMessage(args: any, withNewLine = true, forceType?: string) {
		const message = getMessage(args);
		const metadata = getMetadata(args);
		if (metadata) {
			const location = _.get(metadata, "location");
			const type = forceType || _.get(metadata, "type");
			yeomanUi.showLogMessage({location, value: message, type});
		}
		withNewLine ? output.appendLine(message) : output.append(message);
	}

	function log() {
		showMessage(arguments);
		return log;
	}

	log.write = function() {
		showMessage(arguments, false);
		return log;
	}

	log.writeln = function() {
		showMessage(arguments);
		return origLog;
	}

	log.error = function() {
		showMessage(arguments, true, "error");
		return log;
	}

	log.create = function() {
		showMessage(arguments);
		return log;
	}

	log.force = function() {
		showMessage(arguments);
		return log;
	}

	log.conflict = function() {
		showMessage(arguments);
		return log;
	}

	log.identical = function() {
		showMessage(arguments);
		return log;
	}

	log.skip = function() {
		showMessage(arguments);
		return log;
	}

	return log;
}
