import { Adapter } from "yeoman-environment";
import { YeomanUI } from "./yeomanui";
import { YouiLog } from "./youi-log";
import { YouiEvents } from "./youi-events";
import * as _ from "lodash";
const chalk = require('chalk');

/**
 * @constructor
 */
export class YouiAdapter implements Adapter {
  private yeomanui: YeomanUI | undefined = undefined;
  private youiLog: YouiLog;
  private youiEvents: YouiEvents;

  constructor(logger: YouiLog, youiEvents: YouiEvents) {
    this.youiLog = logger;
    this.youiEvents = youiEvents;
    this.log.writeln = logger.writeln.bind(this.youiLog);
    this.log.conflict = logger.conflict.bind(this.youiLog);
    this.log.create = logger.create.bind(this.youiLog);
    this.log.force = logger.force.bind(this.youiLog);
    this.log.identical = logger.identical.bind(this.youiLog);
    this.log.skip = logger.skip.bind(this.youiLog);
  }

  public setYeomanUI(yeomanui: YeomanUI) {
    this.yeomanui = yeomanui;
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
    this.youiLog.log.call(this.youiLog, value);
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
  public async prompt<T1, T2>(
    questions: Adapter.Questions<T1>,
    cb?: (res: T1) => T2
  ): Promise<T2> {
    if (this.yeomanui && questions) {
      return (<Promise<T2>>this.yeomanui.showPrompt(questions)).then(async (result: any) => {
        if (cb) {
          try {
            return await cb(result);
          } catch (err) {
            this.youiEvents.doGeneratorDone(false, (_.get(err, "message", 'Yeoman UI detected an error')), "");
            return;
          }
        } 

        return result;
      }).catch((reason) => {
        throw reason;
      });
    }

    return Promise.resolve({} as T2);
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
