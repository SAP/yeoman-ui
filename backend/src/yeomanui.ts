import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as _ from "lodash";
import * as Environment from "yeoman-environment";
import * as inquirer from "inquirer";
import { promise as DataURI } from "datauri";
require("./datauri");
import * as defaultImage from "./defaultImage";
import { YouiAdapter } from "./youi-adapter";
import { YouiLog } from "./youi-log";
import { RpcCommon } from "@sap-devx/webview-rpc/out.ext/rpc-common";
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

export class YeomanUI {
  private static funcReplacer(key: any, value: any) {
    if (typeof value === 'function') {
      return '__Function';
    } else {
      return value;
    }
  }

  private rpc: RpcCommon;
  private logger: YouiLog;
  private genMeta: { [namespace: string]: Environment.GeneratorMeta };
  private youiAdapter: YouiAdapter;
  private gen: Generator | undefined;
  private promptCount: number;
  private currentQuestions: Environment.Adapter.Questions<any>;

  constructor(rpc: RpcCommon, logger: YouiLog) {
    this.rpc = rpc;
    this.logger = logger;
    this.rpc.setResponseTimeout(3600000);
    this.rpc.registerMethod({ func: this.receiveIsWebviewReady, thisArg: this });
    this.rpc.registerMethod({ func: this.runGenerator, thisArg: this });
    this.rpc.registerMethod({ func: this.evaluateMethod, thisArg: this });
    this.rpc.registerMethod({ func: this.toggleLog, thisArg: this });
    this.youiAdapter = new YouiAdapter(logger);
    this.youiAdapter.setYeomanUI(this);
    this.promptCount = 0;
    this.genMeta = {};
    this.currentQuestions = {};
  }

  private static async getDescription(fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        let chunks: string = "";
        fs.createReadStream(fileName, { 'encoding': 'utf8' })
          .on('data', chunk => chunks += chunk)
          .on('error', err => {
            reject(err);
          })
          .on('end', () => {
            const packageJSON = JSON.parse(chunks);
            resolve(packageJSON.description);
          });
      } catch (err) {
        reject(err);
      }
    });
  }

  public async getGenerators(): Promise<IPrompt | undefined> {
    // optimization: looking up generators takes a long time, so if generators are already loaded don't bother
    // on the other hand, we never look for newly installed generators...

    const promise: Promise<IPrompt | undefined> = new Promise((resolve, reject) => {
      const env = Environment.createEnv();
      env.lookup(async (err) => {
        const generatorNames: string[] = env.getGeneratorNames();
        this.genMeta = env.getGeneratorsMeta();
        if (generatorNames.length > 0) {
          const generatorChoices: IGeneratorChoice[] = [];
          for (let i = 0; i < generatorNames.length; i++) {
            let genName: string = generatorNames[i];
            const choice: IGeneratorChoice = {
              name: genName,
              message: "Some quick example text of the generator description. This is a long text so that the example will look good.",
            };

            const meta: Environment.GeneratorMeta = this.genMeta[`${genName}:app`];
            try {
              const imgSrc = await DataURI(path.join((meta as any).packagePath, 'yeoman.png'));
              choice.imageUrl = imgSrc;
            } catch (err) {
              choice.imageUrl = defaultImage.default;
            }

            try {
              const packageJsonFile: string = path.join((meta as any).packagePath, 'package.json');
              choice.message = await YeomanUI.getDescription(packageJsonFile);
            } catch (err) {
              // no description found -- falling back to generator name
            }
            generatorChoices.push(choice);
          }
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

    const env: Environment = Environment.createEnv(undefined, {}, this.youiAdapter);
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

      if ((gen as any)["getImage"] !== undefined) {
        const image: string | Promise<string> | undefined = (gen as any)["getImage"]();
        if ((image as any)["then"]) {
          (image as any)["then"]((contents: string) => {
            console.log(`image contents: ${contents}`);
          });
        } else if (image !== undefined) {
          console.log(`image contents: ${image}`);
        }
      }

      this.promptCount = 0;
      this.gen = (gen as Generator);
      this.gen.destinationRoot(destinationRoot);
      /* Generator.run() returns promise. Sending a callback is deprecated:
           https://yeoman.github.io/generator/Generator.html#run
         ... but .d.ts hasn't been updated for a while:
           https://www.npmjs.com/package/@types/yeoman-generator */
      const runPromise: Promise<any> = <Promise<any>><unknown>this.gen.run();
      runPromise.then((err) => {
        let message: string;
        if (err) {
          console.error(err);
          message = `${generatorName} failed: ${err}.`;
          this.doGeneratorDone(false, message);
        }

        console.log('done running yeomanui');
        message = `${generatorName} is done. Destination directory is ${destinationRoot}`;
        this.doGeneratorDone(true, message);
      }).catch((reason) => {
        console.error(reason);
      });
    } catch (err) {
      console.error(err);
    }
  }

  public doGeneratorDone(success: boolean, message: string): Promise<any> {
    return this.rpc.invoke("generatorDone", [true, message]);
  }

  /**
   * 
   * @param answers - partial answers for the current prompt -- the input parameter to the method to be evaluated
   * @param method
   */
  public evaluateMethod(params: any[], questionName: string, methodName: string): any {
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

  public toggleLog(): boolean {
    if (this.rpc) {
      return this.logger.showLog();
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
      return this.rpc.invoke("showPrompt", [mappedQuestions, promptName]);
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
    const mappedQuestions = JSON.parse(JSON.stringify(questions, YeomanUI.funcReplacer));
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
