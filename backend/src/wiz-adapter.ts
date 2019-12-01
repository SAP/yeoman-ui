import { Adapter } from "yeoman-environment";
import { Yowiz } from "./yowiz";
import { WizLog } from "./wiz-log";
const chalk = require('chalk');

/**
 * @constructor
 */
export class WizAdapter implements Adapter {
  private yowiz: Yowiz | undefined = undefined;
  private wizLog: WizLog;

  constructor(logger: WizLog) {
    this.wizLog = logger;
    this.log.writeln = logger.writeln.bind(this.wizLog);
    this.log.conflict = logger.conflict.bind(this.wizLog);
    this.log.create = logger.create.bind(this.wizLog);
    this.log.force = logger.force.bind(this.wizLog);
    this.log.identical = logger.identical.bind(this.wizLog);
    this.log.skip = logger.skip.bind(this.wizLog);
  }

  public setYowiz(yowiz: Yowiz) {
    this.yowiz = yowiz;
  }

  public log: {
    (value: string): void,
    writeln?: (str: string) => void,
    conflict?: (str: string) => void,
    create?: (str: string) => void,
    force?: (str: string) => void,
    identical?: (str: string) => void,
    skip?: (str: string) => void
  } = (value: string) => {
    this.wizLog.log.call(this.wizLog, value);
  }

  get colorDiffAdded() {
    return chalk.black.bgGreen;
  }

  get colorDiffRemoved() {
    return chalk.bgRed;
  }

  public colorLines(name: string, str: string) {
    return "";
  }

  /**
   * @param {Array} questions
   * @param {Function} callback
   */
  public prompt<T1, T2>(
    questions: Adapter.Questions<T1>,
    cb?: (res: T1) => T2
  ): Promise<T2> {
    if (this.yowiz && questions) {
      return (<Promise<T2>>this.yowiz.showPrompt(questions)).then(result => {
        return cb ?  cb(result as any) : result;
      }).catch((reason) => {
        return Promise.reject(reason);
      });
      // return (<Promise<T2>>this._yowiz.showPrompt(questions));
    }

    return Promise.resolve(({} as T2));
  }

  /**
   * Shows a color-based diff of two strings
   *
   * @param {string} actual
   * @param {string} expected
   */
  public diff(actual: string, expected: string): string {
    return "";
  }
}
