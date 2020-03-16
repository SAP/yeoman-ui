import * as Environment from "yeoman-environment";
import {IPrompt} from "@sap-devx/yeoman-ui-types";
import * as hash from "object-hash";

export enum ReplayState {
  Replaying,
  EndingReplay,
  NotReplaying
}

export class ReplayUtils {
  private answersCache: Map<string, Environment.Adapter.Answers>;
  private replayStack: Array<Environment.Adapter.Answers>;
  private replayQueue: Array<Environment.Adapter.Answers>;
  private prompts: Array<IPrompt>;
  public isReplaying: boolean;

  constructor() {
    this.answersCache = new Map();
    this.clear();
  }

  clear(): void {
    this.isReplaying = false;
    this.replayQueue = [];
    this.replayStack = [];
    this.prompts = [];
    this.answersCache.clear();
  }

  start(questions: Environment.Adapter.Questions<any>, answers: Environment.Adapter.Answers): void {
      this._rememberAnswers(questions, answers);
      this.replayQueue = JSON.parse(JSON.stringify(this.replayStack));
      this.isReplaying = true;
  }

  stop(questions: Environment.Adapter.Questions<any>): IPrompt[] {
      const prompts = this.prompts;
      this.isReplaying = false;
      this.prompts = [];
      this.replayQueue = [];
      const answers: Environment.Adapter.Answers = this.replayStack.pop();
      ReplayUtils.setDefaults(questions, answers);
      return prompts;
  }

  next(promptCount: number, promptName: string): Environment.Adapter.Answers {
    if (promptCount > this.prompts.length) {
      const prompt: IPrompt = {
        name: promptName, description: ""
      };
      this.prompts.push(prompt);
    }

    return this.replayQueue.shift();
  }

  setPrompts(prompts: IPrompt[]): void {
    this.prompts = prompts;
  }

  remember(questions: Environment.Adapter.Questions<any>, answers: Environment.Adapter.Answers): void {
    this._rememberAnswers(questions, answers);
    this.replayStack.push(answers);
  }

  recall(questions: Environment.Adapter.Questions<any>): void {
    const key: string = ReplayUtils.getQuestionsHash(questions);
    const previousAnswers: Environment.Adapter.Answers = this.answersCache.get(key);
    if (previousAnswers !== undefined) {
      ReplayUtils.setDefaults(questions, previousAnswers);
    }
  }

  getReplayState(): ReplayState{
    if (this.isReplaying) {
      if (this.replayQueue.length > 1) {
        return ReplayState.Replaying;
      } else {
        return ReplayState.EndingReplay;
      }
    } else {
      return ReplayState.NotReplaying;
    }
  }

  // assuming question names uniquely identifies a prompt
  // also assuming that order of questions is consistent
  private static getQuestionsHash(questions: Environment.Adapter.Questions<any>): string {
    // exclude members that we manipulate in setDefault() below
    const excludeKeys = (key: string) => {
      if (key === "__ForceDefault" || key === "default") {
        return true;
      }
      return false;
    };

    return hash(questions, {excludeKeys});
  }

  private _rememberAnswers(questions: Environment.Adapter.Questions<any>, answers: Environment.Adapter.Answers): void {
    const key: string = ReplayUtils.getQuestionsHash(questions);
    this.answersCache.set(key, answers);
  }

  static setDefaults(questions: Environment.Adapter.Questions<any>, answers: Environment.Adapter.Answers): void {
    for (const question of (questions as any[])) {
      const name = question["name"];
      const answer = answers[name];

      // __ForceDefault is required to let the frontend know to ignore all forms
      //   of default values defined on the question, e.g. the checked property of
      //   the choices array for questions of type checkbox
      question.__ForceDefault = true;
      question.default = answer;
    }
  }
}
