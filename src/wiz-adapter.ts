'use strict';
import { Adapter } from "yeoman-environment";
import inquirer = require("inquirer");
import { Messaging } from "./messaging";

const chalk = require('chalk');

/**
 * @constructor
 */
export class WizAdapter implements Adapter {
  constructor() {
    this._log = new WizAdapterLog();
    this.log.writeln = this._log.writeln;
    this.log.conflict = this._log.conflict;
    this.log.create = this._log.create;
    this.log.force = this._log.force;
    this.log.identical = this._log.identical;
  }

  public setMessaging(messaging: Messaging) {
    this._messaging = messaging;
  }

  private _messaging: Messaging | undefined = undefined;
  private _log: WizAdapterLog;

  public log: {
      (value: string):void,
      writeln?: { (str: string): void },
      conflict?: { (str: string): void },
      create?: { (str: string): void },
      force?: { (str: string): void },
      identical?: { (str: string): void }
    } = (value: string) => {
    console.log(value);
  };

  get _colorDiffAdded() {
    return chalk.black.bgGreen;
  }

  get _colorDiffRemoved() {
    return chalk.bgRed;
  }

  _colorLines(name: string, str: string) {
    // return str.split('\n').map(line => this[`_colorDiff${name}`](line)).join('\n');
  }

  /**
   * @param {Array} questions
   * @param {Function} callback
   */
  prompt<T1, T2>(
    questions: Adapter.Questions<T1>,
    cb?: (res: T1) => T2
  ): Promise<T2> {
    if (this._messaging && questions) {
      return (<Promise<T2>>this._messaging.askQuestions(questions));
    } else {
      return Promise.resolve(<T2>{});
    }
  }

  /**
   * Shows a color-based diff of two strings
   *
   * @param {string} actual
   * @param {string} expected
   */
  diff(actual: string, expected: string): string {
    // let msg = diff.diffLines(actual, expected).map(str => {
    //   if (str.added) {
    //     return this._colorLines('Added', str.value);
    //   }

    //   if (str.removed) {
    //     return this._colorLines('Removed', str.value);
    //   }

    //   return str.value;
    // }).join('');

    // // Legend
    // msg = '\n' +
    //   this._colorDiffRemoved('removed') +
    //   ' ' +
    //   this._colorDiffAdded('added') +
    //   '\n\n' +
    //   msg +
    //   '\n';

    // console.log(msg);
    // return msg;
    return "";
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