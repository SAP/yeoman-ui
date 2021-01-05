import stripAnsi = require("strip-ansi");
import * as _  from "lodash";
import { Output } from "./output";
import { YeomanUI } from "./yeomanui";


module.exports = ( output: Output, yeomanUi: YeomanUI) => {
	function getMessage(args: any) {
		const message = stripAnsi(_.get(args, "[0]", ""));
		return `${message}`;
	}

	function showMessage(args: any, withNewLine = true) {
		const message = getMessage(args);
		withNewLine ? output.appendLine(message) : output.append(message);
	}

	function log() {
		showMessage(arguments);
		return log;
	}

	log.write = function() {
		showMessage(arguments);
		return log;
	};

	log.writeln = function() {
		showMessage(arguments);
		return log;
	};

	log.error = function() {
		showMessage(arguments);
		return log;
	};

	log.create = function() {
		showMessage(arguments);
		return log;
	};

	log.showProgress = function() {
		const message = getMessage(arguments);
		yeomanUi.showProgress(message);
		return log;
	};

	log.force = function() {
		showMessage(arguments);
		return log;
	};

	log.conflict = function() {
		showMessage(arguments);
		return log;
	};

	log.identical = function() {
		showMessage(arguments);
		return log;
	};

	log.skip = function() {
		showMessage(arguments);
		return log;
	};

	return log;
};
