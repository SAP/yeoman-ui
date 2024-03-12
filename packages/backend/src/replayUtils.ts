import { Answers } from "yeoman-environment/index.js";
import { IPrompt } from "@sap-devx/yeoman-ui-types";
import hash from "object-hash";
import * as TerminalAdapter from "yeoman-environment/lib/adapter.js";

export enum ReplayState {
  Replaying,
  EndingReplay,
  NotReplaying,
}

export class ReplayUtils {
  // assuming that order of questions is consistent
  private static getQuestionsHash(questions: TerminalAdapter.Questions<any>): string {
    // we need exclude members that we manipulate in setDefault() below
    // we also need to exclude members set by custom event handlers
    // instead of blacklisting member, we whitelist them based on inquirer.js docs:
    const whietlistedKeys: string[] = [
      "type",
      "name",
      "message",
      "choices",
      "validate",
      "filter",
      "transformer",
      "when",
    ];

    const excludeKeys = (key: string) => {
      const keyIndex = whietlistedKeys.findIndex((value) => {
        return value === key;
      });
      return keyIndex < 0;
    };

    return hash(questions, { excludeKeys });
  }

  private static setDefaults(questions: TerminalAdapter.Questions<any>, answers: Answers): void {
    for (const question of questions as any[]) {
      const name = question["name"];
      const answer = answers[name];

      // __ForceDefault is required to let the frontend know to ignore all forms
      //   of default values defined on the question, e.g. the checked property of
      //   the choices array for questions of type checkbox
      if (answer !== undefined) {
        question.__ForceDefault = true;
        question.__origAnswer = answer;
      }
    }
  }

  public isReplaying: boolean = false;
  private readonly answersCache: Map<string, Answers>;
  private replayStack: Answers[] = [];
  private replayQueue: Answers[] = [];
  private numOfSteps: number = 0;
  private prompts: IPrompt[] = [];

  constructor() {
    this.answersCache = new Map();
    this.clear();
  }

  public clear(): void {
    this.isReplaying = false;
    this.replayQueue = [];
    this.replayStack = [];
    this.prompts = [];
    this.answersCache.clear();
    this.numOfSteps = 0;
  }

  public start(questions: TerminalAdapter.Questions<any>, answers: Answers, numOfSteps: number): void {
    this._rememberAnswers(questions, answers);
    this.numOfSteps = numOfSteps;
    this.replayQueue = JSON.parse(JSON.stringify(this.replayStack));
    this.isReplaying = true;
  }

  public stop(questions: TerminalAdapter.Questions<any>): IPrompt[] {
    const prompts = this.prompts;
    this.isReplaying = false;
    this.prompts = [];
    this.replayQueue = [];
    const answers: Answers = this.replayStack.pop() ?? {};
    ReplayUtils.setDefaults(questions, answers);
    this.replayStack.splice(this.replayStack.length - this.numOfSteps + 1);
    return prompts;
  }

  public next(promptCount: number, promptName: string): Answers {
    if (promptCount > this.prompts.length) {
      const prompt: IPrompt = {
        name: promptName,
        description: "",
      };
      this.prompts.push(prompt);
    }

    return this.replayQueue.shift() ?? {};
  }

  public setPrompts(prompts: IPrompt[]): void {
    this.prompts = prompts;
  }

  public remember(questions: TerminalAdapter.Questions<any>, answers: Answers): void {
    this._rememberAnswers(questions, answers);
    this.replayStack.push(answers);
  }

  public recall(questions: TerminalAdapter.Questions<any>): void {
    const key: string = ReplayUtils.getQuestionsHash(questions);
    const previousAnswers: Answers = this.answersCache.get(key) ?? {};
    if (previousAnswers !== undefined) {
      ReplayUtils.setDefaults(questions, previousAnswers);
    }
  }

  public getReplayState(): ReplayState {
    if (this.isReplaying) {
      if (this.replayQueue.length > this.numOfSteps) {
        return ReplayState.Replaying;
      } else {
        return ReplayState.EndingReplay;
      }
    } else {
      return ReplayState.NotReplaying;
    }
  }

  private _rememberAnswers(questions: TerminalAdapter.Questions<any>, answers: Answers): void {
    const key: string = ReplayUtils.getQuestionsHash(questions);
    this.answersCache.set(key, answers);
  }
}
