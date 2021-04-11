import { YeomanUI } from "./yeomanui";
import { YouiEvents } from "./youi-events";
const yoUiLog = require("./utils/log"); // eslint-disable-line @typescript-eslint/no-var-requires
import * as _ from "lodash";
import chalk = require("chalk");
import { Questions } from "yeoman-environment/lib/adapter";
import { Output } from "./output";

let adapterLog: any;
export class YouiAdapter {
  private yeomanui: YeomanUI;

  constructor(
    private readonly youiEvents: YouiEvents,
    private readonly output: Output
  ) {}

  public log() {
    console.log(arguments);
  }

  public setYeomanUI(yeomanui: YeomanUI) {
    this.yeomanui = yeomanui;
    adapterLog = yoUiLog(this.output, this.yeomanui);
    this.log = adapterLog;
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
  public async prompt<T1, T2>(
    questions: Questions<T1>,
    cb?: (res: T1) => T2
  ): Promise<T2> {
    if (this.yeomanui && questions) {
      const result: any = await (this.yeomanui.showPrompt(
        questions
      ) as Promise<T2>);
      if (_.isFunction(cb)) {
        try {
          return await cb(result); // eslint-disable-line @typescript-eslint/await-thenable
        } catch (err) {
          this.youiEvents.doGeneratorDone(
            false,
            _.get(err, "message", "Template Wizard detected an error"),
            "",
            "files"
          );
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
  public diff(): string {
    return "";
  }
}
