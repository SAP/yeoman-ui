'use strict';
import { Adapter } from "yeoman-environment";
import { PromptModule } from "inquirer";
import inquirer = require("inquirer");

const diff = require('diff');
const chalk = require('chalk');

/**
 * @constructor
 */
export class WizAdapter implements Adapter {
  private promptModule: PromptModule;

  public log(value):void {
    console.log(value);
  };

  public _log: WizAdapterLog;

  constructor() {
    this.promptModule = inquirer.createPromptModule();
    this._log = new WizAdapterLog();
    this.log["writeln"] = this._log.writeln;
    this.log["conflict"] = this._log.conflict;
    this.log["create"] = this._log.create;
    this.log["force"] = this._log.force;
    this.log["identical"] = this._log.identical;
  }

  get _colorDiffAdded() {
    return chalk.black.bgGreen;
  }

  get _colorDiffRemoved() {
    return chalk.bgRed;
  }

  _colorLines(name, str) {
    return str.split('\n').map(line => this[`_colorDiff${name}`](line)).join('\n');
  }

  /**
   * @param {Array} questions
   * @param {Function} callback
   */
  prompt<T1, T2>(
    questions: Adapter.Questions<T1>,
    cb?: (res: T1) => T2
  ): Promise<T2> {
    let answers: inquirer.Answers = {};
    if (questions) {
      for (let i in questions) {
        let question: inquirer.Question = questions[i];
        answers[question.name] = `answer to ${question.message}`;
        console.log(`question ${question.name}: ${question.message}`);
      }
    }
    return Promise.resolve(answers as T2);
  }

  /**
   * Shows a color-based diff of two strings
   *
   * @param {string} actual
   * @param {string} expected
   */
  diff(actual, expected) {
    let msg = diff.diffLines(actual, expected).map(str => {
      if (str.added) {
        return this._colorLines('Added', str.value);
      }

      if (str.removed) {
        return this._colorLines('Removed', str.value);
      }

      return str.value;
    }).join('');

    // Legend
    msg = '\n' +
      this._colorDiffRemoved('removed') +
      ' ' +
      this._colorDiffAdded('added') +
      '\n\n' +
      msg +
      '\n';

    console.log(msg);
    return msg;
  }
}

class WizAdapterLog {
  public writeln(str: string):void {
    console.log(`*** in writeln(): ${str}`);
  }

  public create(str: string):void {
    console.log(`*** in create(): ${str}`);
  }

  public force(str: string):void {
    console.log(`*** in force(): ${str}`);
  }

  public conflict(str: string):void {
    console.log(`*** in conflict(): ${str}`);
  }

  public identical(str: string):void {
    console.log(`*** in identical(): ${str}`);
  }
}