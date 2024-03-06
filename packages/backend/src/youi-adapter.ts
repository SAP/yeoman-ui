import { YeomanUI } from "./yeomanui.js";
import { YouiEvents } from "./youi-events.js";
const yoUiLog = require("./utils/log"); // eslint-disable-line @typescript-eslint/no-var-requires
import { isFunction, get } from "lodash";
const chalk = require("chalk");
import { Questions } from "yeoman-environment/lib/adapter.js";
import { Output } from "./output.js";
import { Answers } from "yeoman-environment/index.js";

export class YouiAdapter {
  private yeomanui: YeomanUI;

  constructor(
    private readonly youiEvents: YouiEvents,
    private readonly output: Output,
    yeomanui: YeomanUI,
  ) {
    this.yeomanui = yeomanui;
  }

  public log() {
    console.log(arguments);
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

  public colorLines() {
    return "";
  }

  /**
   * @param {Array} questions
   * @param {Function} callback
   */
  public async prompt<T1 extends Answers, T2 extends Answers>(
    questions: Questions<T1>,
    cb?: (res: T1) => T2,
  ): Promise<T2 | undefined> {
    if (this.yeomanui && questions) {
      const result: any = await (this.yeomanui.showPrompt(questions) as Promise<T1>);
      if (isFunction(cb)) {
        try {
          return await cb(result);
        } catch (err) {
          this.youiEvents.doGeneratorDone(false, get(err, "message", "Template Wizard detected an error"), "", "files");
          return undefined;
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
  public diff(): string {
    return "";
  }
}
