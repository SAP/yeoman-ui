import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as _ from "lodash";
import * as Environment from "yeoman-environment";
import * as inquirer from "inquirer";
import { WizAdapter } from "./wiz-adapter";
import { WizLog } from "./wiz-log";
import { RpcCommon } from "./rpc/rpc-common";
import Generator = require("yeoman-generator");

export interface IGeneratorChoice {
  name: string;
  message: string;
  imageUrl?: string;
}

export interface IGeneratorQuestion {
  type: string;
  name: string;
  message: string;
  choices: IGeneratorChoice[];
}

export interface IPrompt {
  name: string;
  questions: any[];
}

export class Yowiz {
  private static funcReplacer(key: any, value: any) {
    if (typeof value === 'function') {
      console.log(value);
      return '__Function';
    } else {
      return value;
    }
  }

  private rpc: RpcCommon;
  private logger: WizLog;
  private genMeta: { [namespace: string]: Environment.GeneratorMeta };
  private wizAdapter: WizAdapter;
  private gen: Generator | undefined;
  private promptCount: number;
  private currentQuestions: Environment.Adapter.Questions<any>;

  constructor(rpc: RpcCommon, logger: WizLog) {
    this.rpc = rpc;
    this.logger = logger;
    this.rpc.setResponseTimeout(3600000);
    this.rpc.registerMethod({ func: this.receiveIsWebviewReady, thisArg: this });
    this.rpc.registerMethod({ func: this.runGenerator, thisArg: this });
    this.rpc.registerMethod({ func: this.evaluateMethod, thisArg: this });
    this.rpc.registerMethod({ func: this.toggleLog, thisArg: this });
    this.wizAdapter = new WizAdapter(logger);
    this.wizAdapter.setYowiz(this);
    this.promptCount = 0;
    this.genMeta = {};
    this.currentQuestions = {};
  }

  public getGenerators(): Promise<IPrompt | undefined> {
    // optimization: looking up generators takes a long time, so if generators are already loaded don't bother
    // on the other hand, we never look for newly installed generators...

    const promise: Promise<IPrompt | undefined> = new Promise((resolve, reject) => {
      const env = Environment.createEnv();
      env.lookup((err) => {
        const generatorNames: string[] = env.getGeneratorNames();
        this.genMeta = env.getGeneratorsMeta();
        if (generatorNames.length > 0) {
          const generatorChoices: IGeneratorChoice[] = generatorNames.map((value, index, array) => {
            const choice: IGeneratorChoice = {
              name: value,
              message: "Some quick example text of the generator description. This is a long text so that the example will look good.",
            };
            choice.imageUrl = "https://yeoman.io/static/illustration-home-inverted.91b07808be.png";
            return choice;
          });
          const generatorQuestion: IGeneratorQuestion = {
            type: "generators",
            name: "name",
            message: "name",
            choices: generatorChoices
          };
          resolve({ name: "Choose Generator", questions: [generatorQuestion] });
        } else {
          return resolve(undefined);
        }
      });
    });
    return promise;
  }

  public runGenerator(generatorName: string) {

    // TODO: ensure generatorName is a valid dir name
    const destinationRoot: string = path.join(os.homedir(), "projects", generatorName);

    // TODO: wait for dir to be created
    fs.mkdir(destinationRoot, { recursive: true }, (err) => {
      if (err) {
        console.error(err);
      }
    });

    // TODO: should create and set target dir only after user has selected a generator;
    //  see issue: https://github.com/yeoman/environment/issues/55
    //  process.chdir() doesn't work after environment has been created

    const env: Environment = Environment.createEnv(undefined, {}, this.wizAdapter);
    try {
      const meta: Environment.GeneratorMeta = this.genMeta[`${generatorName}:app`];
      // TODO: support sub-generators
      env.register(meta.resolved);
      const gen: any = env.create(`${generatorName}:app`, {});
      // check if generator defined a helper function called getPrompts()
      if ((gen as any)["getPrompts"] !== undefined) {
        const promptNames: any[] = (gen as any)["getPrompts"]();
        const prompts: IPrompt[] = promptNames.map((value) => {
          return _.assign({ questions: [], name: "" }, value);
        });
        this.setPrompts(prompts);
      }

      this.promptCount = 0;
      this.gen = (gen as Generator);
      this.gen.destinationRoot(destinationRoot);
      this.gen.run((err) => {
        let message: string;
        if (err) {
          console.error(err);
          message = `${generatorName} failed: ${err}.`;
          this.rpc.invoke("generatorDone", [true, message]);
        }
        console.log('done running yowiz');
        message = `${generatorName} is done. Destination directory is ${destinationRoot}`;
        this.rpc.invoke("generatorDone", [true, message]);
      });
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * 
   * @param answers - partial answers for the current prompt -- the input parameter to the method to be evaluated
   * @param method
   */
  public evaluateMethod(params: any[], questionName: string, methodName: string): any {
    // TODO: handle case where return value is a promise
    if (this.currentQuestions) {
      const relevantQuestion: any = (this.currentQuestions as any[]).find((question) => {
        return (question.name === questionName);
      });
      if (relevantQuestion) {
        return relevantQuestion[methodName].apply(this.gen, params);
      }
    }
  }

  public async receiveIsWebviewReady() {
    // TODO: loading generators takes a long time; consider prefetching list of generators
    if (this.rpc) {
      const generators: IPrompt | undefined = await this.getGenerators();

      const response: any = await this.rpc.invoke("showPrompt", [
        (generators ? generators.questions : []),
        (generators ? generators.name : "")
      ]);
      this.runGenerator(response.name);
    }
  }

  public toggleLog() : boolean {
    if (this._rpc) {
      return this._logger.showLog();
    }
    return false;
  }

  public async showPrompt(questions: Environment.Adapter.Questions<any>): Promise<inquirer.Answers> {
    this.currentQuestions = questions;
    if (this.rpc) {
      this.promptCount++;
      let promptName: string = `Step ${this.promptCount}`;
      if (Array.isArray(questions) && questions.length === 1) {
        promptName = questions[0].name.replace(/(.)/, (match: string, p1: string) => p1.toUpperCase());
      }
      const mappedQuestions: Environment.Adapter.Questions<any> = this.normalizeFunctions(questions);
      return this.rpc.invoke("showPrompt", [mappedQuestions, promptName]).then((response => {
        return response;
      }));
    } else {
      return Promise.resolve({});
    }
  }



  /**
   * 
   * @param quesions 
   * returns a deep copy of the original questions, but replaces Function properties with a placeholder
   * 
   * Functions are lost when being passed to client (using JSON.Stringify)
   * Also functions cannot be evaluated on client)
   */
  private normalizeFunctions(questions: Environment.Adapter.Questions<any>): Environment.Adapter.Questions<any> {
    const mappedQuestions = JSON.parse(JSON.stringify(questions, Yowiz.funcReplacer));
    return mappedQuestions;
  }

  private setPrompts(prompts: IPrompt[]): Promise<void> {
    if (this.rpc) {
      return this.rpc.invoke("setPrompts", [prompts]);
    } else {
      return Promise.resolve();
    }
  }
}
