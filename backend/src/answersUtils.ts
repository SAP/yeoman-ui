import * as Environment from "yeoman-environment";
import * as objectHash from "object-hash";
import { IPrompt } from "./iPrompt";

export class AnswersUtils {
    private answersMap: Map<string, Environment.Adapter.Answers>;
    public replayStack: Array<Environment.Adapter.Answers>;
    public replayQueue: Array<Environment.Adapter.Answers>;
    public replayedPrompts: Array<IPrompt>;
    public isReplaying: boolean;
  
    constructor() {
      this.answersMap = new Map();
      this.reset();
    }
  
    reset(): void {
      this.isReplaying = false;
      this.replayQueue = [];
      this.replayStack = [];
      this.replayedPrompts = [];
      this.clearAnswers();
    }
  
    startReplay(): void {
        this.replayQueue = JSON.parse(JSON.stringify(this.replayStack));
        this.isReplaying = true;
    }

    stopReplay(): void {
        this.isReplaying = false;
        this.replayedPrompts = [];
        this.replayQueue = [];
    }

    recallAnswers(questions: Environment.Adapter.Questions<any>): Environment.Adapter.Answers {
      const key = objectHash(questions);
      return this.answersMap.get(key);
    }
  
    clearAnswers(): void {
      return this.answersMap.clear();
    }
  
    rememberAnswers(questions: Environment.Adapter.Questions<any>, answers: Environment.Adapter.Answers): void {
      const key = objectHash(questions);
      this.answersMap.set(key, answers);
    }
  
    static setDefaults(questions: Environment.Adapter.Questions<any>, answers: Environment.Adapter.Answers): void {
      for (const question of (questions as any[])) {
        const name = question["name"];
        const answer = answers[name];
        question.default = answer;
      }
    }
  }
  
  