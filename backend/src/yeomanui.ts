import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as fsextra from "fs-extra";
import * as _ from "lodash";
import * as Environment from "yeoman-environment";
import * as inquirer from "inquirer";
const titleize = require('titleize');
const humanizeString = require('humanize-string');
const datauri = require("datauri");
import * as defaultImage from "./defaultImage";
import { YouiAdapter } from "./youi-adapter";
import { YouiLog } from "./youi-log";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import Generator = require("yeoman-generator");
import { GeneratorType, GeneratorFilter } from "./filter";

export interface IGeneratorChoice {
  name: string;
  prettyName: string;
  message: string;
  homepage: string;
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
  private static isWin32 = (process.platform === 'win32');
  private static CWD = path.join(os.homedir(), 'projects');
  private static NODE_MODULES = 'node_modules';

  private rpc: IRpc;
  private logger: YouiLog;
  private genMeta: { [namespace: string]: Environment.GeneratorMeta };
  private youiAdapter: YouiAdapter;
  private gen: Generator | undefined;
  private promptCount: number;
  private currentQuestions: Environment.Adapter.Questions<any>;
  private genFilter: GeneratorFilter;

  constructor(rpc: IRpc, logger: YouiLog, genFilter?: GeneratorFilter) {
    this.rpc = rpc;
    if (!this.rpc) {
      throw new Error("rpc must be set");
    }
    this.logger = logger;
    this.rpc.setResponseTimeout(3600000);
    this.rpc.registerMethod({ func: this.receiveIsWebviewReady, thisArg: this });
    this.rpc.registerMethod({ func: this.runGenerator, thisArg: this });
    this.rpc.registerMethod({ func: this.evaluateMethod, thisArg: this });
    this.rpc.registerMethod({ func: this.toggleLog, thisArg: this });
    this.rpc.registerMethod({ func: this.logMessage, thisArg: this });
  
    this.youiAdapter = new YouiAdapter(logger);
    this.youiAdapter.setYeomanUI(this);
    this.promptCount = 0;
    this.genMeta = {};
    this.currentQuestions = {};
    this.setGenFilter(genFilter);
    
  }

  public setGenFilter(genFilter: GeneratorFilter) {
    this.genFilter = genFilter ? genFilter : GeneratorFilter.create();
  }

  public async getGenerators(): Promise<IPrompt> {
    // optimization: looking up generators takes a long time, so if generators are already loaded don't bother
    // on the other hand, we never look for newly installed generators...

    const promise: Promise<IPrompt> = new Promise(resolve => {
      const env: Environment.Options = this.getEnv();
      env.lookup(async () => this.onEnvLookup(env, resolve, this.genFilter));
    });

    return promise;
  }

  private getEnv(): Environment.Options {
    const env: Environment.Options = Environment.createEnv();
    const envGetNpmPaths: () => any = env.getNpmPaths;
    env.getNpmPaths = function (localOnly:boolean = false) {
      // Start with the local paths derived by cwd in vscode 
      // (as opposed to cwd of the plugin host process which is what is used by yeoman/environment)
      // Walk up the CWD and add `node_modules/` folder lookup on each level
      const parts: string[] = YeomanUI.CWD.split(path.sep);
      const localPaths = _.map(parts, (part, index) => {
        const resrpath = path.join(...parts.slice(0, index + 1), YeomanUI.NODE_MODULES);
        return YeomanUI.isWin32 ? resrpath : path.join(path.sep, resrpath);

      });
      const defaultPaths = envGetNpmPaths.call(this, localOnly);
      
      return  _.uniq(localPaths.concat(defaultPaths));
    };
    return env;
  }

  public async runGenerator(generatorName: string) {
    // TODO: wait for dir to be created
    fs.mkdir(YeomanUI.CWD, { recursive: true }, (err) => {
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
      const getGenMetadataName = this.getGenMetaName(generatorName);
      const gen: any = env.create(getGenMetadataName, {});
      // check if generator defined a helper function called getPrompts()
      const genGetPrompts = _.get(gen, "getPrompts");
      if (genGetPrompts) {
        const promptNames: any[] = genGetPrompts();
        const prompts: IPrompt[] = promptNames.map(value => {
          return _.assign({ questions: [], name: "" }, value);
        });
        this.setPrompts(prompts);
      }

      const genGetImage = _.get(gen, "getImage");
      if (genGetImage) {
        const image: any = genGetImage();
        if (image.then) {
          image.then((contents: string) => {
            console.log(`image contents: ${contents}`);
          });
        } else if (image !== undefined) {
          console.log(`image contents: ${image}`);
        }
      }

      this.promptCount = 0;
      this.gen = (gen as Generator);
      this.gen.destinationRoot(YeomanUI.CWD);
      /* Generator.run() returns promise. Sending a callback is deprecated:
           https://yeoman.github.io/generator/Generator.html#run
         ... but .d.ts hasn't been updated for a while:
           https://www.npmjs.com/package/@types/yeoman-generator */
      this.gen.run((err) => {
        let message: string;
        let destinationRoot = this.gen.destinationRoot();
        if (err) {
          console.error(err);
          message = `${generatorName} failed: ${err}.`;
          this.doGeneratorDone(false, message, destinationRoot);
        }

        message = `The '${generatorName}' project has been generated.`;
        console.log("done running yeomanui! " + message + ` You can find it at ${destinationRoot}`);
        this.doGeneratorDone(true, message, destinationRoot);
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  getErrorInfo(error: any) {
    if (_.isString(error)) {
      return error;
    } 
      const name = _.get(error, "name", "");
      const message = _.get(error, "message", "");
      const stack = _.get(error, "stack", "");
      const string = error.toString();

      return `name: ${name}\n message: ${message}\n stack: ${stack}\n string: ${string}\n`;
  }

  handleError(error: any) {
    const errorMessage = `Error info ---->\n ${this.getErrorInfo(error)}`;
    console.error(errorMessage);
    this.logMessage(errorMessage);
    this.toggleLog();
  }

  public doGeneratorDone(success: boolean, message: string, targetPath = ""): Promise<any> {
    return this.rpc.invoke("generatorDone", [true, message, targetPath]);
  }

  public setMessages(messages: any): Promise<void> {
    return this.rpc ? this.rpc.invoke("setMessages", [messages]) : Promise.resolve();
  }

  /**
   * 
   * @param answers - partial answers for the current prompt -- the input parameter to the method to be evaluated
   * @param method
   */
  public evaluateMethod(params: any[], questionName: string, methodName: string): any {
    try {
      if (this.currentQuestions) {
        const relevantQuestion: any = _.find(this.currentQuestions, question => {
          return (_.get(question, "name") === questionName);
        });
        if (relevantQuestion) {
          return relevantQuestion[methodName].apply(this.gen, params);
        }
      }
    } catch (error) {
      this.handleError(error);
    } 
  }

  public async receiveIsWebviewReady() {
    // TODO: loading generators takes a long time; consider prefetching list of generators
    const generators: IPrompt = await this.getGenerators();
    const response: any = await this.rpc.invoke("showPrompt", [generators.questions, "select_generator"]);
    await this.runGenerator(response.name);
  }

  public toggleLog(): boolean {
    return this.logger.showLog();
  }

  public logMessage(message: string): void {
    this.logger.log(message);
  }

  public async showPrompt(questions: Environment.Adapter.Questions<any>): Promise<inquirer.Answers> {
    this.currentQuestions = questions;
    
      this.promptCount++;
      const firstQuestionName = _.get(questions, "[0].name");
      let promptName: string = `Step ${this.promptCount}`;
      if (firstQuestionName) {
        promptName = _.startCase(firstQuestionName);
      }
      const mappedQuestions: Environment.Adapter.Questions<any> = this.normalizeFunctions(questions);
      return this.rpc.invoke("showPrompt", [mappedQuestions, promptName]);
  }
  
  private async onEnvLookup(env: Environment.Options, resolve: any, filter?: GeneratorFilter) {
    this.genMeta = env.getGeneratorsMeta();
    const generatorNames: string[] = env.getGeneratorNames();
    const generatorChoicePromises = _.map(generatorNames, genName => {
      return this.getGeneratorChoice(genName, filter);
    });

    const generatorChoices = await Promise.all(generatorChoicePromises);
    const generatorQuestion: IGeneratorQuestion = {
      type: "generators",
      name: "name",
      message: "",
      choices: _.compact(generatorChoices)
    };
    resolve({ name: "Select Generator", questions: [generatorQuestion] });
  }

  private async getGeneratorChoice(genName: string, filter?: GeneratorFilter): Promise<IGeneratorChoice | undefined> {
    let packageJson: any;
    
    const genPackagePath = this.getGenMetaPackagePath(genName);
    try {
      packageJson = await this.getGenPackageJson(genPackagePath);
    } catch (error) {
      return Promise.resolve(undefined);
    }
    
    const genFilter: GeneratorFilter = GeneratorFilter.create(_.get(packageJson, ["generator-filter"]));
    const typeEqual: boolean = (filter.type === GeneratorType.all || filter.type === genFilter.type);
    const categoriesHasIntersection: boolean = (_.isEmpty(filter.categories) || !_.isEmpty(_.intersection(filter.categories, genFilter.categories)));
    if (typeEqual && categoriesHasIntersection) {
        return this.createGeneratorChoice(genName, genPackagePath, packageJson);
    }

    return Promise.resolve(undefined);
  }

  private async createGeneratorChoice(genName: string, genPackagePath: string, packageJson: any): Promise<IGeneratorChoice> {
    let genImageUrl;

    try {
      genImageUrl = await datauri.promise(path.join(genPackagePath, YeomanUI.YEOMAN_PNG));
    } catch (error) {
      genImageUrl = defaultImage.default;
    }

    const genMessage = _.get(packageJson, "description", YeomanUI.defaultMessage);
    const genPrettyName = titleize(humanizeString(genName));
    const genHomepage = _.get(packageJson, "homepage", '');

    return {
      name: genName,
      prettyName: genPrettyName,
      message: genMessage,
      homepage: genHomepage,
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
    const metadataName: string = this.getGenMetaName(genName);
    return _.get(this, ["genMeta", metadataName]);
  }

  private getGenMetaName(genName: string): string {
    return `${genName}:app`;
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
    return this.rpc.invoke("setPrompts", [prompts]);
  }
}
