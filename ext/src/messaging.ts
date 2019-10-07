'use strict';
import { Adapter } from "yeoman-environment";
import * as inquirer from "inquirer";
import { YowizPanel } from "./extension";

/**
 * @constructor
 */
export class Messaging {
  private _yowizPanel: YowizPanel | undefined;

  constructor(yowizPanel?: YowizPanel) {
    if (yowizPanel) {
      this._yowizPanel = yowizPanel;
    }
  }

  public async askQuestions(questions: Adapter.Questions<any>): Promise<inquirer.Answers> {
    if (this._yowizPanel) {
      const answers = await this._yowizPanel.sendQuestions(questions);
      return answers;
    }
    return Promise.resolve({});
  }
}