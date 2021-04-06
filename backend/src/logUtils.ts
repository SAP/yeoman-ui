import stripAnsi = require("strip-ansi");
import * as _  from "lodash";
import { Output } from "./output";
import { YeomanUI } from "./yeomanui";


module.exports = ( output: Output, yeomanUi: YeomanUI) => {

	const defaultColors = {
		skip: 'yellow',
		force: 'yellow',
		create: 'green',
		invoke: 'bold',
		conflict: 'red',
		identical: 'cyan',
		info: 'gray'
	  };

	function pad(status: string) {
		const max = 'identical'.length;
		const delta = max - status.length;
		return delta ? ' '.repeat(delta) + status : status;
	}
	  
	function getPrefix(status: string) {
		const color = _.get(defaultColors, status);
		if (_.isEmpty(color)) return '';
		return `${pad(status)} `;
	}
	
	function getMessage(args: any, status = '') {
		const prefix = getPrefix(status);
		const message = stripAnsi(_.get(args, "[0]", ""));
		return `${prefix}${message}`;
	}

	function showMessage(args: any, status = '', withNewLine = true) {
		const message = getMessage(args, status);
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
		showMessage(arguments, 'create');
		return log;
	};

	log.showProgress = function() {
		const message = getMessage(arguments);
		yeomanUi.showProgress(message);
		return log;
	};

	log.force = function() {
		showMessage(arguments, 'force');
		return log;
	};

	log.invoke = function() {
		showMessage(arguments, 'invoke');
		return log;
	};

	log.conflict = function() {
		showMessage(arguments, 'conflict');
		return log;
	};

	log.identical = function() {
		showMessage(arguments, 'identical');
		return log;
	};

	log.info = function() {
		showMessage(arguments, 'info');
		return log;
	};

	log.skip = function() {
		showMessage(arguments, 'skip');
		return log;
	};

	return log;
};
