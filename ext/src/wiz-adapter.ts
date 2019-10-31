'use strict';
import { Adapter } from "yeoman-environment";
import { Yowiz } from "./yowiz";
import { WizLog } from "./wiz-log";

const chalk = require('chalk');

/**
 * @constructor
 */
export class WizAdapter implements Adapter {
  constructor(logger : WizLog) {
    this._log = logger;
    this.log.writeln = logger.writeln;
    this.log.conflict = logger.conflict;
    this.log.create = logger.create;
    this.log.force = logger.force;
    this.log.identical = logger.identical;
    this.log.skip = logger.skip;
  }

  public setYowiz(yowiz: Yowiz) {
    this._yowiz = yowiz;
  }

  private _yowiz: Yowiz | undefined = undefined;
  private _log: WizLog;

  public log: {
      (value: string):void,
      writeln?: { (str: string): void },
      conflict?: { (str: string): void },
      create?: { (str: string): void },
      force?: { (str: string): void },
      identical?: { (str: string): void },
      skip?: { (str: string): void }
    } = (value: string) => {
      this._log.log(value);
  }

  get _colorDiffAdded() {
    return chalk.black.bgGreen;
  }

  get _colorDiffRemoved() {
    return chalk.bgRed;
  }

  _colorLines(name: string, str: string) {
  }

  /**
   * @param {Array} questions
   * @param {Function} callback
   */
  prompt<T1, T2>(
    questions: Adapter.Questions<T1>,
    cb?: (res: T1) => T2
  ): Promise<T2> {
    if (this._yowiz && questions) {
      return (<Promise<T2>>this._yowiz.showPrompt(questions)).then((result) => {
        if (cb) {
          const response = cb(result as any);
          return response;
        } else {
          return result;
        }
      }).catch((reason) => {
        return Promise.reject(reason);
      });

      // return (<Promise<T2>>this._yowiz.showPrompt(questions));
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
    return "";
  }
}


