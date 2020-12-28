import { YeomanUI } from "./yeomanui";
import { YouiEvents } from "./youi-events";
const yoUiLog = require("./logUtils"); // eslint-disable-line @typescript-eslint/no-var-requires
import * as _ from "lodash";
import chalk = require('chalk');
import TerminalAdapter = require("yeoman-environment/lib/adapter");
import { Output } from "./output";


export class YouiAdapter extends TerminalAdapter {
  private yeomanui: YeomanUI | undefined = undefined;
  private readonly youiEvents: YouiEvents;
  private readonly output: Output;

  constructor(youiEvents: YouiEvents, output: Output) {
	super({});
	this.youiEvents = youiEvents;
	this.output = output;
  }

  public setYeomanUI(yeomanui: YeomanUI) {
	this.yeomanui = yeomanui;
	this.log = yoUiLog(this.output, this.yeomanui);
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
    questions: TerminalAdapter.Questions<T1>,
    cb?: (res: T1) => T2
  ): Promise<T2> {
    if (this.yeomanui && questions) {
      const result: any = await (this.yeomanui.showPrompt(questions) as Promise<T2>);
      if (!_.isEmpty(cb)) {
        try {
          return await cb(result); // eslint-disable-line @typescript-eslint/await-thenable
        } catch (err) {
          this.youiEvents.doGeneratorDone(false, (_.get(err, "message", 'Application Wizard detected an error')), false);
          return;
        }
      }

      return result;
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
