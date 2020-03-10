import * as Environment from "yeoman-environment";
import { IPrompt } from "./iPrompt";

export enum ReplayState {
  Replaying,
  EndingReplay,
  NotReplaying
}
export class ReplayUtils {
    private answersCache: Map<string, Environment.Adapter.Answers>;
    private replayStack: Array<Environment.Adapter.Answers>;
    private replayQueue: Array<Environment.Adapter.Answers>;
    private replayedPrompts: Array<IPrompt>;
    public isReplaying: boolean;

    constructor() {
      this.answersCache = new Map();
      this.clear();
    }

    clear(): void {
      this.isReplaying = false;
      this.replayQueue = [];
      this.replayStack = [];
      this.replayedPrompts = [];
      this.answersCache.clear();
    }

    startReplay(questions: Environment.Adapter.Questions<any>, answers: Environment.Adapter.Answers): void {
        this._rememberAnswers(questions, answers);
        this.replayQueue = JSON.parse(JSON.stringify(this.replayStack));
        this.isReplaying = true;
    }

    stopReplay(questions: Environment.Adapter.Questions<any>): IPrompt[] {
        const prompts = this.replayedPrompts;
        this.isReplaying = false;
        this.replayedPrompts = [];
        this.replayQueue = [];
        const answers: Environment.Adapter.Answers = this.replayStack.pop();
        ReplayUtils.setDefaults(questions, answers);
        return prompts;
    }

    advanceReplay(promptName: string): Environment.Adapter.Answers {
      const prompt: IPrompt = {
        name: promptName, description: "", questions: []
      };
      this.replayedPrompts.push(prompt);
      return this.replayQueue.shift();
    }

    setPrompts(prompts: IPrompt[]): void {
      this.replayedPrompts.push(...prompts);
    }

    rememberAnswers(questions: Environment.Adapter.Questions<any>, answers: Environment.Adapter.Answers): void {
      this._rememberAnswers(questions, answers);
      this.replayStack.push(answers);
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

    recallAnswers(questions: Environment.Adapter.Questions<any>): void {
      const key: string = ReplayUtils.getQuestionsHash(questions);
      const previousAnswers: Environment.Adapter.Answers = this.answersCache.get(key);
      if (previousAnswers !== undefined) {
        ReplayUtils.setDefaults(questions, previousAnswers);
      }
    }

    // assuming order of questions remains consistent
    private static getQuestionsHash(questions: Environment.Adapter.Questions<any>): string {
      let hash: string = "";
      for (const question of (questions as any[])) {
        hash = `${hash}-${question.name}`;
      }
      return hash;
    }

    private _rememberAnswers(questions: Environment.Adapter.Questions<any>, answers: Environment.Adapter.Answers): void {
      const key: string = ReplayUtils.getQuestionsHash(questions);
      this.answersCache.set(key, answers);
    }

    static setDefaults(questions: Environment.Adapter.Questions<any>, answers: Environment.Adapter.Answers): void {
      for (const question of (questions as any[])) {
        const name = question["name"];
        const answer = answers[name];
        question.default = answer;
      }
    }
  }
  
  