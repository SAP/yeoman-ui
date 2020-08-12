import * as os from "os";
import * as path from "path";
import * as fsextra from "fs-extra";
import * as _ from "lodash";
import * as Environment from "yeoman-environment";
import * as inquirer from "inquirer";
import { ReplayUtils, ReplayState } from "./replayUtils";
const datauri = require("datauri"); // eslint-disable-line @typescript-eslint/no-var-requires
const titleize = require('titleize'); // eslint-disable-line @typescript-eslint/no-var-requires
const humanizeString = require('humanize-string'); // eslint-disable-line @typescript-eslint/no-var-requires
import * as defaultImage from "./defaultImage";
import { YouiAdapter } from "./youi-adapter";
import { YouiLog } from "./youi-log";
import { YouiEvents } from "./youi-events";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import Generator = require("yeoman-generator");
import { GeneratorFilter, GeneratorType } from "./filter";
import { IChildLogger } from "@vscode-logging/logger";
import {IPrompt} from "@sap-devx/yeoman-ui-types";

export interface IQuestionsPrompt extends IPrompt{
  questions: any[];
}

export class YeomanUI {
  private static readonly defaultMessage = 
    "Some quick example text of the generator description. This is a long text so that the example will look good.";
  private static readonly YEOMAN_PNG = "yeoman.png";
  private static readonly isWin32 = (process.platform === 'win32');
  private static readonly HOME_DIR = os.homedir();
  private static readonly PROJECTS: string = path.join(YeomanUI.HOME_DIR, 'projects');
  private static readonly NODE_MODULES = 'node_modules';

  private static funcReplacer(key: any, value: any) {
    return _.isFunction(value) ? "__Function" : value;
  }

  private uiOptions: any; // eslint-disable-line @typescript-eslint/prefer-readonly
  private cwd: string;
  private readonly rpc: IRpc;
  private readonly youiEvents: YouiEvents;
  private readonly outputChannel: YouiLog;
  private readonly logger: IChildLogger;
  private genMeta: { [namespace: string]: Environment.GeneratorMeta };
  private readonly youiAdapter: YouiAdapter;
  private gen: Generator | undefined;
  private promptCount: number;
  private currentQuestions: Environment.Adapter.Questions<any>;
  private generatorName: string;
  private readonly replayUtils: ReplayUtils;
  private readonly customQuestionEventHandlers: Map<string, Map<string, Function>>;
  private errorThrown = false;

  constructor(rpc: IRpc, youiEvents: YouiEvents, outputChannel: YouiLog, logger: IChildLogger, uiOptions: any, outputPath: string = YeomanUI.PROJECTS) {
    this.rpc = rpc;
    
    this.generatorName = "";
    this.replayUtils = new ReplayUtils();
    this.youiEvents = youiEvents;
    this.outputChannel = outputChannel;
    this.logger = logger;
    this.rpc.setResponseTimeout(3600000);
    this.rpc.registerMethod({ func: this.receiveIsWebviewReady, thisArg: this });
    this.rpc.registerMethod({ func: this.runGenerator, thisArg: this });
    this.rpc.registerMethod({ func: this.evaluateMethod, thisArg: this });
    this.rpc.registerMethod({ func: this.toggleOutput, thisArg: this });
    this.rpc.registerMethod({ func: this.exploreGenerators, thisArg: this });
    this.rpc.registerMethod({ func: this.logError, thisArg: this });
    this.rpc.registerMethod({ func: this.back, thisArg: this });
    this.rpc.registerMethod({ func: this.setCwd, thisArg: this });
    this.rpc.registerMethod({ func: this.getState, thisArg: this });

    this.youiAdapter = new YouiAdapter(outputChannel, youiEvents);
    this.youiAdapter.setYeomanUI(this);
    this.promptCount = 0;
    this.genMeta = {};
    this.currentQuestions = {};
    this.uiOptions = uiOptions;
    this.customQuestionEventHandlers = new Map();
    this.setCwd(outputPath);
  }

  private async getState() {
    return this.uiOptions;
  }

  public async _notifyGeneratorsChange() {
	const generators: IQuestionsPrompt = await this.getGeneratorsPrompt();
    await this.rpc.invoke("updateGeneratorsPrompt", [generators.questions]);
  }

  public registerCustomQuestionEventHandler(questionType: string, methodName: string, handler: Function): void {
    let entry: Map<string, Function> = this.customQuestionEventHandlers.get(questionType);
    if (entry === undefined) {
      this.customQuestionEventHandlers.set(questionType, new Map());
      entry = this.customQuestionEventHandlers.get(questionType);
    }
    entry.set(methodName, handler);
  }

  private async logError(error: any, prefixMessage?: string) {
    const errorObj: any = this.getErrorInfo(error);
    if (prefixMessage) {
      errorObj.message = `${prefixMessage} - ${errorObj.message}`;
    }

    this.logger.error(errorObj.message, {stack: errorObj.stack});
    return JSON.stringify(errorObj);
  }

  private async getGeneratorsPrompt(): Promise<IQuestionsPrompt> {
    // optimization: looking up generators takes a long time, so if generators are already loaded don't bother
    // on the other hand, we never look for newly installed generators...
    const promise: Promise<IQuestionsPrompt> = new Promise(resolve => {
      const env: Environment.Options = Environment.createEnv();
      const npmPaths = this.getNpmPaths(env); 
      env.lookup({npmPaths}, async () => this.onEnvLookup(env, resolve, this.uiOptions.genFilter));
    });

    return promise;
  }

  private getNpmPaths(env: Environment.Options) {
    const parts: string[] = YeomanUI.HOME_DIR.split(path.sep);
    const userPaths =  _.map(parts, (part, index) => {
      const resPath = path.join(...parts.slice(0, index + 1), YeomanUI.NODE_MODULES);
      return YeomanUI.isWin32 ? resPath : path.join(path.sep, resPath);
    });
     
    const defaultPaths = _.get(this.uiOptions, "defaultNpmPaths", env.getNpmPaths());
    return _.uniq(userPaths.concat(defaultPaths));
  }

  private async getChildDirectories(folderPath: string) {
    const childDirs: string[] = [];
    const result = {targetFolderPath: folderPath, childDirs};

    try {
      for (const file of await fsextra.readdir(folderPath)) {
        const resourcePath: string = path.join(folderPath, file);
        if ((await fsextra.stat(resourcePath)).isDirectory()) {
          result.childDirs.push(resourcePath);
        }
      }
    } catch (error) {
      result.childDirs = [];
    }

    return result;
  }

  private getVscode() {
    try {
      return require("vscode"); 
    } catch (error) {
      return undefined;
    }
  }

	private async runGenerator(generatorName: string) {
		this.generatorName = generatorName;
		// TODO: should create and set target dir only after user has selected a generator;
		// see issue: https://github.com/yeoman/environment/issues/55
		// process.chdir() doesn't work after environment has been created
		try {
		const targetFolder = this.getCwd();
		await fsextra.mkdirs(targetFolder);
		const dirsBefore = await this.getChildDirectories(targetFolder);
		const env: Environment = Environment.createEnv(undefined, {sharedOptions: {forwardErrorToEnvironment: true}}, this.youiAdapter);
		const meta: Environment.GeneratorMeta = this.getGenMetadata(generatorName);
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		env.register(meta.resolved, meta.namespace, meta.packagePath);

		const genNamespace = this.getGenNamespace(generatorName);
		const options = {
			logger: this.logger.getChildLogger({label: generatorName}),
			vscode: this.getVscode(), // TODO: remove this temporary workaround once a better solution is found,
			data: this.uiOptions.data
		};
		const gen: any = env.create(genNamespace, {options});
		// check if generator defined a helper function called setPromptsCallback()
		const setPromptsCallback = _.get(gen, "setPromptsCallback");
		if (setPromptsCallback) {
			setPromptsCallback(this.setPromptList.bind(this));
		}

		this.setGenInstall(gen, generatorName);
		this.promptCount = 0;
		this.gen = (gen as Generator);
		this.gen.destinationRoot(targetFolder);
		// notifies ui wether generator is in writing state
		this.setGenInWriting(this.gen);
		// handles generator errors 
		this.handleErrors(env, this.gen, generatorName);

		// we cannot use new async method, "await this.gen.run()", because generators based on older versions 
		// (for example: 2.0.5) of "yeoman-generator" do not support it
		this.gen.run( (error) => {
			if (!this.errorThrown && !error) {
				this.getChildDirectories(this.gen.destinationRoot()).then( (dirsAfter) => {
					this.onGeneratorSuccess(generatorName, dirsBefore, dirsAfter);
				});
			}
		});
		} catch (error) {
			this.onGeneratorFailure(generatorName, error);
		}
	}

	private setGenInWriting(gen: any) {
		const genMethodName = "writing";
		const originalPrototype = Object.getPrototypeOf(gen);
		const originalGenWriting = _.get(originalPrototype, genMethodName);
		if (!originalGenWriting) {
			originalPrototype[genMethodName] = () => {}
		}
		const uiRpcMethodName = "setGenInWriting";
		this.rpc.invoke(uiRpcMethodName, [false]);
		gen.on(`method:${genMethodName}`, () => {
			this.rpc.invoke(uiRpcMethodName, [true]);
		});
	}

	private handleErrors(env: Environment, gen: any, generatorName: string) {
		const errorEventName = "error";
		env.on(errorEventName, (error: any) => {
			env.removeAllListeners(errorEventName);
			this.onGeneratorFailure(generatorName, error);
			env.emit(errorEventName, error);
		});

		gen.on(errorEventName, (error: any) => {
			this.onGeneratorFailure(generatorName, error);
		});

		process.on("uncaughtException", (error: any) => {
			this.onGeneratorFailure(generatorName, error);
		});
	}

  /**
   * 
   * @param answers - partial answers for the current prompt -- the input parameter to the method to be evaluated
   * @param method
   */
  private async evaluateMethod(params: any[], questionName: string, methodName: string): Promise<any> {
    try {
      if (this.currentQuestions) {
        const relevantQuestion: any = _.find(this.currentQuestions, question => {
          return _.get(question, "name") === questionName;
        });
        if (relevantQuestion) {
          const guiType = _.get(relevantQuestion, "guiOptions.type", relevantQuestion.guiType);
          const customQuestionEventHandler: Function = this.getCustomQuestionEventHandler(guiType, methodName);
          return _.isUndefined(customQuestionEventHandler) ? 
            await relevantQuestion[methodName].apply(this.gen, params) : 
            await customQuestionEventHandler.apply(this.gen, params);
        }
      }
    } catch (error) {
      const questionInfo = `Could not update method '${methodName}' in '${questionName}' question in generator '${this.gen.options.namespace}'`;
      const errorMessage = await this.logError(error, questionInfo);
      this.onGeneratorFailure(this.generatorName, errorMessage);
    } 
  }

  private async receiveIsWebviewReady() {
    try {
      // TODO: loading generators takes a long time; consider prefetching list of generators
      const generators: IQuestionsPrompt = await this.getGeneratorsPrompt();
      const response: any = await this.rpc.invoke("showPrompt", [generators.questions, "select_generator"]);

      this.replayUtils.clear();
      await this.runGenerator(response.generator);
    } catch (error) {
      this.logError(error);
    }
  }

  private toggleOutput(): boolean {
    return this.outputChannel.showOutput();
  }

  private exploreGenerators() {
    const vscodeInstance = this.getVscode();
    if (vscodeInstance) {
      return vscodeInstance.commands.executeCommand("exploreGenerators");
    }
  }

  private setCwd(cwd: string) {
    this.cwd = (cwd || YeomanUI.PROJECTS);
  }

  private getCwd(): string {
    return this.cwd;
  }

  public async showPrompt(questions: Environment.Adapter.Questions<any>): Promise<inquirer.Answers> {
    this.promptCount++;
    const promptName = this.getPromptName(questions);

    if (this.replayUtils.getReplayState() === ReplayState.Replaying) {
      return this.replayUtils.next(this.promptCount, promptName);
    } else if (this.replayUtils.getReplayState() === ReplayState.EndingReplay) {
      const prompts: IPrompt[] = this.replayUtils.stop(questions);
      this.setPromptList(prompts);
    }

    this.replayUtils.recall(questions);

    this.currentQuestions = questions;
    const mappedQuestions: Environment.Adapter.Questions<any> = this.normalizeFunctions(questions);
    if (_.isEmpty(mappedQuestions)) {
      return {};
    }

    const answers = await this.rpc.invoke("showPrompt", [mappedQuestions, promptName]);
    this.replayUtils.remember(questions, answers);
    return answers;
  }

  private back(partialAnswers: Environment.Adapter.Answers, numOfSteps: number): void {
    this.replayUtils.start(this.currentQuestions, partialAnswers, numOfSteps);
    this.runGenerator(this.generatorName);
  }

  private getCustomQuestionEventHandler(questionType: string, methodName: string): Function {
    const entry: Map<string, Function> = this.customQuestionEventHandlers.get(questionType);
    if (entry !== undefined) {
      return entry.get(methodName);
    }
  }

  private getPromptName(questions: Environment.Adapter.Questions<any>): string {
    const firstQuestionName = _.get(questions, "[0].name");
    return (firstQuestionName ? _.startCase(firstQuestionName) : `Step ${this.promptCount}`);
  }

  private onGeneratorSuccess(generatorName: string, reourcesBeforeGen?: any, resourcesAfterGen?: any) {
    let targetFolderPath: string = _.get(resourcesAfterGen, "targetFolderPath");
    if (_.get(reourcesBeforeGen, "targetFolderPath") === targetFolderPath) {
        const newDirs: string[] = _.difference(_.get(resourcesAfterGen, "childDirs"), _.get(reourcesBeforeGen, "childDirs"));
        if (_.size(newDirs) === 1) {
            targetFolderPath = newDirs[0];
        }
    } 

    const message = this.uiOptions.messages.artifact_with_name_generated(generatorName);
    this.logger.debug("done running yeomanui! " + message + ` You can find it at ${targetFolderPath}`);
    this.youiEvents.doGeneratorDone(true, message, targetFolderPath);
  }

  private async onGeneratorFailure(generatorName: string, error: any) {
    this.errorThrown = true;
    const messagePrefix = `${generatorName} generator failed`;
    const errorMessage: string = await this.logError(error, messagePrefix);
    this.youiEvents.doGeneratorDone(false, errorMessage);
  }

  private setGenInstall(gen: any, generatorName: string) {
    const originalPrototype = Object.getPrototypeOf(gen);
    const originalGenInstall = _.get(originalPrototype, "install");
    if (originalGenInstall && !originalPrototype._uiInstall) {
      originalPrototype._uiInstall = true;
      originalPrototype.install = async () => {
        try {
          this.youiEvents.doGeneratorInstall();
          await originalGenInstall.call(gen);
        } catch (error) {
          this.onGeneratorFailure(generatorName, error);
        } finally {
          originalPrototype.install = originalGenInstall;
          delete originalPrototype._uiInstall;
        }
      };
    }
  }

  private getErrorInfo(error: any = "") {
    if (_.isString(error)) {
      return {message: error};
    }

   const res = {
     message: _.get(error, "message", ""),
     stack: _.get(error, "stack", "")
   };

   return res;
 }
  
  private async onEnvLookup(env: Environment.Options, resolve: any, filter: GeneratorFilter) {
    this.genMeta = env.getGeneratorsMeta();
    const generatorNames: string[] = env.getGeneratorNames();

    const questions: any[] = await this.createGeneratorPromptQuestions(generatorNames, filter);

    this.currentQuestions = questions;
    const normalizedQuestions = this.normalizeFunctions(questions);
    
    resolve({ name: "Select Generator", questions: normalizedQuestions });
  }

  private async createGeneratorPromptQuestions(generatorNames: string[], genFilter: GeneratorFilter): Promise<any[]> {
    const generatorChoicePromises = _.map(generatorNames, genName => {
      return this.getGeneratorChoice(genName, genFilter);
    });

    const questions: any[] = [];

    if (_.includes(genFilter.types, GeneratorType.project)) {
      const defaultPath = this.getCwd();
      const targetFolderQuestion: any = {
        type: "input",
        guiOptions: {
          type: "folder-browser",
          hint: this.uiOptions.messages.select_target_folder_question_hint
        },
        name: "generator.target.folder",
        message: "Specify a target folder path",
        default: defaultPath,
        getPath: async (path: string) => path,
        validate: async (path: string) => {
          try {
            await fsextra.access(path, fsextra.constants.W_OK);
            this.setCwd(path);
            return true;
          } catch (error) {
            this.logError(error);
            return "The selected target folder is not writable";
          }
        }
      };
      questions.push(targetFolderQuestion);
    }
    
    const generatorChoices = await Promise.all(generatorChoicePromises);
    const generatorQuestion: any = {
      type: "list",
      guiType: "tiles",
      guiOptions: {
        hint: this.uiOptions.messages.select_generator_question_hint
      },
      name: "generator",
      message: this.uiOptions.messages.select_generator_question_message,
      choices: _.compact(generatorChoices)
    };
    questions.push(generatorQuestion);

    return questions;
  }

  private async getGeneratorChoice(genName: string, filter: GeneratorFilter): Promise<any> {
    let packageJson: any;
    const genPackagePath: string = this.getGenMetaPackagePath(genName);
  
    try {
      packageJson = await this.getGenPackageJson(genPackagePath);
    } catch (error) {
      this.logError(error);
      return Promise.resolve(undefined);
    }

    const genFilter: GeneratorFilter = GeneratorFilter.create(_.get(packageJson, ["generator-filter"]));
    const typesHasIntersection: boolean = GeneratorFilter.hasIntersection(filter.types, genFilter.types);
    const categoriesHasIntersection: boolean = GeneratorFilter.hasIntersection(filter.categories, genFilter.categories);
    if (typesHasIntersection && categoriesHasIntersection) {
      return this.createGeneratorChoice(genName, genPackagePath, packageJson);
    }

    return Promise.resolve(undefined);
  }

  private async createGeneratorChoice(genName: string, genPackagePath: string, packageJson: any): Promise<any> {
    let genImageUrl;

    try {
      genImageUrl = await datauri.promise(path.join(genPackagePath, YeomanUI.YEOMAN_PNG));
    } catch (error) {
      genImageUrl = defaultImage.default;
      this.logger.debug(error);
    }

    const genMessage = _.get(packageJson, "description", YeomanUI.defaultMessage);
    const genDisplayName = _.get(packageJson, "displayName", '');
    const genPrettyName = _.isEmpty(genDisplayName) ? titleize(humanizeString(genName)) : genDisplayName;
    const genHomepage = _.get(packageJson, "homepage", '');

    return {
      value: genName,
      name: genPrettyName,
      description: genMessage,
      homepage: genHomepage,
      image: genImageUrl
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
    const genNamespace = this.getGenNamespace(genName);
    const genMetadata = _.get(this, ["genMeta", genNamespace]);
    if (_.isNil(genMetadata)) {
      const debugMessage = `${genNamespace} generator metadata was not found.`;
      this.logger.debug(debugMessage);
    }
    return genMetadata;
  }

  private getGenNamespace(genName: string): string {
    return `${genName}:app`;
  }

  /**
   * 
   * @param questions 
   * returns a deep copy of the original questions, but replaces Function properties with a placeholder
   * 
   * Functions are lost when being passed to client (using JSON.Stringify)
   * Also functions cannot be evaluated on client)
   */
  private normalizeFunctions(questions: Environment.Adapter.Questions<any>): Environment.Adapter.Questions<any> {
    this.addCustomQuestionEventHandlers(questions);
    return JSON.parse(JSON.stringify(questions, YeomanUI.funcReplacer));
  }

  private setPromptList(prompts: IPrompt[]): Promise<void> {
    const promptsToDisplay: IPrompt[] = prompts.map((prompt: IPrompt) => {
      return _.assign({ questions: [], name: "", description: ""}, prompt);
    });

    if (this.replayUtils.isReplaying) {
      this.replayUtils.setPrompts(promptsToDisplay);
    } else {
      return this.rpc.invoke("setPromptList", [promptsToDisplay]);
    }
  }
  
  private addCustomQuestionEventHandlers(questions: Environment.Adapter.Questions<any>): void {
    for (const question of (questions as any[])) {
      const guiType = _.get(question, "guiOptions.type", question.guiType);
      const questionHandlers = this.customQuestionEventHandlers.get(guiType);
      if (questionHandlers) {
        questionHandlers.forEach((handler, methodName) => {
          (question)[methodName] = handler;
        });
      }
    }
  }
}
