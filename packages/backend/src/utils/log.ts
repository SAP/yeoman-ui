import stripAnsi = require("strip-ansi");
import { get } from "lodash";
import { Output } from "../output";
import { YeomanUI } from "../yeomanui";

module.exports = (output: Output, yeomanUi: YeomanUI) => {
  function pad(methodName: string) {
    const max = "identical".length;
    const delta = max - methodName.length;
    return delta ? `${" ".repeat(delta)}${methodName}` : methodName;
  }

  function getMessage(args: any, methodName = "") {
    const prefix = `${pad(methodName)} `;
    const message = stripAnsi(get(args, "[0]", ""));
    return `${prefix}${message}`;
  }

  function showMessage(args: any, methodName = "", withNewLine = true) {
    const message = getMessage(args, methodName);
    withNewLine ? output.appendLine(message) : output.append(message);
  }

  function log() {
    showMessage(arguments);
    return log;
  }

  log.write = function () {
    showMessage(arguments);
    return log;
  };

  log.writeln = function () {
    showMessage(arguments);
    return log;
  };

  log.error = function () {
    showMessage(arguments);
    return log;
  };

  log.create = function () {
    showMessage(arguments, "create");
    return log;
  };

  log.showProgress = function () {
    const message = getMessage(arguments);
    yeomanUi.showProgress(message);
    return log;
  };

  log.force = function () {
    showMessage(arguments, "force");
    return log;
  };

  log.invoke = function () {
    showMessage(arguments, "invoke");
    return log;
  };

  log.conflict = function () {
    showMessage(arguments, "conflict");
    return log;
  };

  log.identical = function () {
    showMessage(arguments, "identical");
    return log;
  };

  log.info = function () {
    showMessage(arguments, "info");
    return log;
  };

  log.skip = function () {
    showMessage(arguments, "skip");
    return log;
  };

  return log;
};
