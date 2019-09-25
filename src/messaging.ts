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
      this._yowizPanel.sendQuestions(questions);
    }
    let answers: inquirer.Answers = {};

    for (let i in questions) {
      let question: inquirer.Question = (questions as any)[i];

      answers[question.name as string] = `answer to ${question.message}`;
      console.log(`question ${question.name}: ${question.message}`);
    }

    return Promise.resolve(answers);
  }
}