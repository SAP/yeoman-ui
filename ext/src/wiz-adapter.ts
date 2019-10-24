'use strict';
import { Adapter } from "yeoman-environment";
import { Yowiz } from "./yowiz";

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
    this.log.skip = this._log.skip;
  }

  public setYowiz(yowiz: Yowiz) {
    this._yowiz = yowiz;
  }

  private _yowiz: Yowiz | undefined = undefined;
  private _log: WizAdapterLog;

  public log: {
      (value: string):void,
      writeln?: { (str: string): void },
      conflict?: { (str: string): void },
      create?: { (str: string): void },
      force?: { (str: string): void },
      identical?: { (str: string): void },
      skip?: { (str: string): void }
    } = (value: string) => {
    console.log(value);
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

  public skip(str: string):void {
    console.log(`*** in skip(): ${str}`);
  }
}
