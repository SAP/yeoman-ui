import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as fsextra from "fs-extra";
import * as _ from "lodash";
import * as Environment from "yeoman-environment";
import * as inquirer from "inquirer";
import * as datauri from "datauri";
import * as defaultImage from "./defaultImage";
import { YouiAdapter } from "./youi-adapter";
import { YouiLog } from "./youi-log";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import Generator = require("yeoman-generator");
import { Type } from "./filter";

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
    return _.isFunction(value) ? "__Function" : value;
  }

  private static defaultMessage = 
    "Some quick example text of the generator description. This is a long text so that the example will look good.";
  private static YEOMAN_PNG = "yeoman.png";

  private rpc: IRpc;
  private logger: YouiLog;
  private genMeta: { [namespace: string]: Environment.GeneratorMeta };
  private youiAdapter: YouiAdapter;
  private gen: Generator | undefined;
  private promptCount: number;
  private currentQuestions: Environment.Adapter.Questions<any>;

  constructor(rpc: IRpc, logger: YouiLog) {
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

  public async getGenerators(type?: Type): Promise<IPrompt> {
    // optimization: looking up generators takes a long time, so if generators are already loaded don't bother
    // on the other hand, we never look for newly installed generators...

    const promise: Promise<IPrompt> = new Promise(resolve => {
      const env: Environment.Options = Environment.createEnv();
      env.lookup(async () => this.onEnvLookup(env, resolve, type));
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
      const meta: Environment.GeneratorMeta = this.getGenMetadata(generatorName);
      // TODO: support sub-generators
      env.register(meta.resolved);
      const gen: any = env.create(`${generatorName}:app`, {});
      // check if generator defined a helper function called getPrompts()
      const genGetPrompts = _.get(gen, "getPromts");
      if (genGetPrompts) {
        const promptNames: any[] = genGetPrompts();
        const prompts: IPrompt[] = promptNames.map((value) => {
          return _.assign({ questions: [], name: "" }, value);
        });
        this.setPrompts(prompts);
      }

      const genGetImage = _.get(gen, "getImage");
      if (genGetImage) {
        const image: string | Promise<string> | undefined = genGetImage();
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
      this.gen.run((err) => {
        let message: string;
        if (err) {
          console.error(err);
          message = `${generatorName} failed: ${err}.`;
          this.doGeneratorDone(false, message);
        }

        console.log("done running yeomanui");
        message = `${generatorName} is done. Destination directory is ${destinationRoot}`;
        this.doGeneratorDone(true, message);
      });
    } catch (err) {
      console.error(err);
    }
  }

  public doGeneratorDone(success: boolean, message: string): Promise<any> {
    return this.rpc ? this.rpc.invoke("generatorDone", [true, message]) : Promise.resolve();
  }

  /**
   * 
   * @param answers - partial answers for the current prompt -- the input parameter to the method to be evaluated
   * @param method
   */
  public evaluateMethod(params: any[], questionName: string, methodName: string): any {
    if (this.currentQuestions) {
      const relevantQuestion: any = _.find(this.currentQuestions, question => {
        return (_.get(question, "name") === questionName);
      });
      if (relevantQuestion) {
        return relevantQuestion[methodName].apply(this.gen, params);
      }
    }
  }

  public async receiveIsWebviewReady(type?: Type) {
    // TODO: loading generators takes a long time; consider prefetching list of generators
    if (this.rpc) {
      const generators: IPrompt = await this.getGenerators(type);
      const response: any = await this.rpc.invoke("showPrompt", [generators.questions, generators.name]);
      this.runGenerator(response.name);
    }
  }

  public toggleLog(): boolean {
    return this.rpc ? this.logger.showLog() : false;
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
    } 

    return Promise.resolve({});
  }
  
  private async onEnvLookup(env: Environment.Options, resolve: any, type?: Type) {
    this.genMeta = env.getGeneratorsMeta();
    const generatorNames: string[] = env.getGeneratorNames();
    const generatorChoicePromises = _.map(generatorNames, genName => {
      return this.createGeneratorChoice(genName, type);
    });

    const generatorChoices = await Promise.all(generatorChoicePromises);
    const generatorQuestion: IGeneratorQuestion = {
      type: "generators",
      name: "name",
      message: "name",
      choices: generatorChoices
    };
    resolve({ name: "Choose Generator", questions: [generatorQuestion] });
  }

  private async createGeneratorChoice(genName: string, type?: Type): Promise<IGeneratorChoice> {
    const genPackagePath = this.getGenMetaPackagePath(genName);
    let genImageUrl;
    let genMessage;
      
    try {
      genImageUrl = await datauri.promise(path.join(genPackagePath, YeomanUI.YEOMAN_PNG));
    } catch (err) {
      genImageUrl = defaultImage.default;
    }

    try {
      const packageJson: any = await this.getGenPackageJson(genPackagePath);
      genMessage = _.get(packageJson, "description", YeomanUI.defaultMessage);
    } catch (err) {
      genMessage = YeomanUI.defaultMessage;
    }

    return {
      name: genName,
      message: genMessage,
      imageUrl: genImageUrl
    };
  }

  private async getGenPackageJson(genPackagePath: string): Promise<any> {
    const packageJsonString: string = await fsextra.readFile(path.join(genPackagePath, "package.json"), "utf8");
    return JSON.parse(packageJsonString);
  }

  private getGenMetaPackagePath(genName: string): string {
    return _.get(this.getGenMetadata(genName), "packagePath");
  }

  private getGenMetadata(genName: string): Environment.GeneratorMeta {
    return _.get(this, ["genMeta", `${genName}:app`]);
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
    return JSON.parse(JSON.stringify(questions, YeomanUI.funcReplacer));
  }

  private setPrompts(prompts: IPrompt[]): Promise<void> {
    return this.rpc ? this.rpc.invoke("setPrompts", [prompts]) : Promise.resolve();
  }
}
