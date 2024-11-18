import * as path from "path";
import { promises, watch, statSync, FSWatcher } from "fs";
import * as _ from "lodash";
import * as inquirer from "inquirer";
import { ReplayUtils, ReplayState } from "./replayUtils";
const datauri = require("datauri"); // eslint-disable-line @typescript-eslint/no-var-requires
const titleize = require("titleize"); // eslint-disable-line @typescript-eslint/no-var-requires
const humanizeString = require("humanize-string"); // eslint-disable-line @typescript-eslint/no-var-requires
import * as defaultImage from "./images/defaultImage";
import { YouiAdapter } from "./youi-adapter";
import { YouiEvents } from "./youi-events";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { GeneratorFilter, GeneratorType } from "./filter";
import { IChildLogger } from "@vscode-logging/logger";
import { IPrompt, MessageType } from "@sap-devx/yeoman-ui-types";
import { AnalyticsWrapper } from "./usage-report/usage-analytics-wrapper";
import { Output } from "./output";
import { resolve } from "path";
import { Env, EnvGen, GeneratorData, GeneratorNotFoundError } from "./utils/env";
import { vscode, getVscode } from "./utils/vscodeProxy";
import * as Generator from "yeoman-generator";
import * as Environment from "yeoman-environment";
import { Questions } from "yeoman-environment/lib/adapter";
import { State } from "./utils/promise";
import { Constants } from "./utils/constants";

export interface IQuestionsPrompt extends IPrompt {
  questions: any[];
}

export class YeomanUI {
  private static readonly defaultMessage =
    "Some quick example text of the generator description. This is a long text so that the example will look good.";
  private static readonly YEOMAN_PNG = "yeoman.png";

  private static funcReplacer(key: any, value: any) {
    return _.isFunction(value) ? "__Function" : value;
  }

  private uiOptions: any; // eslint-disable-line @typescript-eslint/prefer-readonly
  private cwd: string;
  private readonly rpc: IRpc;
  private readonly youiEvents: YouiEvents;
  private readonly output: Output;
  private readonly logger: IChildLogger;
  private readonly youiAdapter: YouiAdapter;
  private gen: Generator | undefined;
  private promptCount: number;
  private currentQuestions: Questions<any>;
  private generatorName: string;
  private readonly replayUtils: ReplayUtils;
  // eslint-disable-next-line @typescript-eslint/ban-types
  private readonly customQuestionEventHandlers: Map<string, Map<string, Function>>;
  private errorThrown = false;
  private readonly initialCwd: string;
  private readonly typesMap: Map<string, string>;
  private readonly generatorsToIgnoreArray: string[];

  private readonly flowState: State<void>;

  private readonly TARGET_FOLDER_CONFIG_PROP = "ApplicationWizard.TargetFolder";
  private readonly SELECTED_WORKSPACE_CONFIG_PROP = "ApplicationWizard.Workspace";
  private readonly HIDE_GENERATORS_PROP = "ApplicationWizard.HideGenerator";
  private onUncaughtException: (e: Error) => void;

  constructor(
    rpc: IRpc,
    youiEvents: YouiEvents,
    output: Output,
    logger: IChildLogger,
    uiOptions: any,
    flowState: State<void>,
  ) {
    this.rpc = rpc;

    this.flowState = flowState;
    this.generatorName = "";
    this.replayUtils = new ReplayUtils();
    this.youiEvents = youiEvents;
    this.logger = logger;
    this.output = output;
    this.rpc.registerMethod({
      func: this.receiveIsWebviewReady,
      thisArg: this,
    });
    this.rpc.registerMethod({ func: this.runGenerator, thisArg: this });
    this.rpc.registerMethod({ func: this.evaluateMethod, thisArg: this });
    this.rpc.registerMethod({ func: this.toggleOutput, thisArg: this });
    this.rpc.registerMethod({ func: this.exploreGenerators, thisArg: this });
    this.rpc.registerMethod({ func: this.logError, thisArg: this });
    this.rpc.registerMethod({ func: this.back, thisArg: this });
    this.rpc.registerMethod({ func: this.executeCommand, thisArg: this });
    this.rpc.registerMethod({ func: this.getState, thisArg: this });

    this.initialCwd = process.cwd();
    this.uiOptions = uiOptions;
    this.youiAdapter = new YouiAdapter(youiEvents, output);
    this.youiAdapter.setYeomanUI(this);
    this.promptCount = 0;
    this.currentQuestions = {};
    this.customQuestionEventHandlers = new Map();
    this.typesMap = new Map();
    this.generatorsToIgnoreArray = [];
  }

  private getState() {
    return this.uiOptions;
  }

  public async _notifyGeneratorsChange(): Promise<void> {
    const generators: IQuestionsPrompt = await this.getGeneratorsPrompt();
    return this.rpc.invoke("updateGeneratorsPrompt", [generators.questions]);
  }

  public async _notifyGeneratorsInstall(args: any[], force: boolean = false) {
    this.uiOptions.installGens = _.isObject(args) && _.isEmpty(args) ? undefined : args;
    if (!_.isNil(args)) {
      const isGeneratorsPrompt: boolean = await this.rpc.invoke("isGeneratorsPrompt");
      if (isGeneratorsPrompt || force) {
        if (_.isEmpty(args)) {
          this.hideGeneratorsInstallingMessage();
        } else {
          this.showGeneratorsInstallingMessage();
        }
      }
    }
  }

  private showGeneratorsInstallingMessage() {
    this.youiEvents
      .getAppWizard()
      .showWarning(this.uiOptions.messages.generators_are_being_installed, MessageType.prompt);
  }

  private hideGeneratorsInstallingMessage() {
    void this.rpc.invoke("resetPromptMessage");
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public registerCustomQuestionEventHandler(questionType: string, methodName: string, handler: Function): void {
    // eslint-disable-next-line @typescript-eslint/ban-types
    let entry: Map<string, Function> = this.customQuestionEventHandlers.get(questionType);
    if (entry === undefined) {
      this.customQuestionEventHandlers.set(questionType, new Map());
      entry = this.customQuestionEventHandlers.get(questionType);
    }
    entry.set(methodName, handler);
  }

  public showProgress(message?: string) {
    this.youiEvents.showProgress(message);
  }

  private logError(error: any, prefixMessage?: string) {
    const errorObj: any = this.getErrorInfo(error);
    if (prefixMessage) {
      errorObj.message = `${prefixMessage} - ${errorObj.message}`;
    }

    this.logger.error(errorObj.message, { stack: errorObj.stack });
    return JSON.stringify(errorObj);
  }

  private async getGeneratorsPrompt(): Promise<any> {
    const gensData: GeneratorData[] = await Env.getGeneratorsData();
    const questions: any[] = await this.createGeneratorPromptQuestions(gensData, this.uiOptions.filter);

    this.currentQuestions = questions;
    const normalizedQuestions = this.normalizeFunctions(questions);

    return { name: "Select Generator", questions: normalizedQuestions };
  }

  private startWatch(folderPath: string, targetMap: Map<string, any>): FSWatcher {
    return watch(folderPath, { recursive: true }, (eventType, filename) => {
      try {
        // file or directory added or removed
        if (`rename` === eventType && filename) {
          const fullPath = path.join(folderPath, filename);
          const stat = statSync(fullPath);
          targetMap.set(fullPath, {
            isDirectory: stat.isDirectory(),
            size: stat.size,
            modifiedTime: stat.mtime,
          });
        }
      } catch (error) {
        // ignore : broken soft link or access denied
      }
    });
  }

  private wsGet(key: string): string {
    return _.trim(vscode.workspace.getConfiguration().get(key));
  }

  private async runGenerator(generatorNamespace: string) {
    this.generatorName = generatorNamespace;
    let watcher: FSWatcher;
    const targetFolderMap: Map<string, any> = new Map();
    // let targetChanges: any;
    // TODO: should create and set target dir only after user has selected a generator;
    // see issue: https://github.com/yeoman/environment/issues/55
    // process.chdir() doesn't work after environment has been created
    try {
      const targetFolder = this.getCwd();
      await promises.mkdir(targetFolder, { recursive: true });

      const options = {
        logger: this.logger.getChildLogger({ label: generatorNamespace }),
        vscode: getVscode(), // TODO: remove this temporary workaround once a better solution is found,
        data: this.uiOptions.data,
        tracker: AnalyticsWrapper.getTracker(),
        appWizard: this.youiEvents.getAppWizard(),
      };

      const envGen: EnvGen = await Env.createEnvAndGen(generatorNamespace, options, this.youiAdapter);

      // check if generator defined a helper function called setPromptsCallback()
      const setPromptsCallback = _.get(envGen.gen, "setPromptsCallback");
      if (setPromptsCallback) {
        setPromptsCallback(this.setPromptList.bind(this));
      }

      this.promptCount = 0;
      this.gen = envGen.gen as Generator;
      // do not add second parameter with value true
      // some generators rely on fact that this.env.cwd and
      // the current working directory is changed.
      this.gen.destinationRoot(targetFolder);
      // notifies ui wether generator is in writing state
      this.setGenInWriting(this.gen);
      // handles generator install step if exists
      this.onGenInstall(this.gen);
      // handles generator errors
      this.handleErrors(envGen.env, this.gen, generatorNamespace);

      const targetFolderAfter = resolve(this.getCwd(), this.gen.destinationRoot());
      watcher = this.startWatch(targetFolderAfter, targetFolderMap);

      await envGen.env.runGenerator(envGen.gen);
      if (!this.errorThrown) {
        // Without resolve this code worked only for absolute paths without / at the end.
        // Generator can put a relative path, path including . and .. and / at the end.
        this.onGeneratorSuccess(
          generatorNamespace,
          { targetFolderPath: targetFolder },
          { targetFolderPath: targetFolderAfter, changeMap: targetFolderMap },
        );
      }
    } catch (error) {
      if (error instanceof GeneratorNotFoundError) {
        vscode.window.showErrorMessage(error.message);
      }
      this.onGeneratorFailure(generatorNamespace, this.getErrorWithAdditionalInfo(error, "runGenerator()"));
    } finally {
      this.onUncaughtException && process.removeListener("uncaughtException", this.onUncaughtException);
      watcher?.close();
    }
  }

  private setInitialProcessDir() {
    process.chdir(this.initialCwd);
  }

  private resetHeaderTitle(): void {
    void this.youiEvents.setAppWizardHeaderTitle(undefined);
  }

  private setGenInWriting(gen: any) {
    const genMethodName = "writing";
    const originalPrototype = Object.getPrototypeOf(gen);
    const originalGenWriting = _.get(originalPrototype, genMethodName);
    if (!originalGenWriting) {
      originalPrototype[genMethodName] = () => "";
    }
    const uiRpcMethodName = "setGenInWriting";
    void this.rpc.invoke(uiRpcMethodName, [false]);
    gen.on(`method:${genMethodName}`, () => this.rpc.invoke(uiRpcMethodName, [true]));
  }

  private handleErrors(env: Environment, gen: any, generatorName: string) {
    const errorEventName = "error";
    env.on(errorEventName, (error) => {
      env.removeAllListeners(errorEventName);
      this.onGeneratorFailure(generatorName, this.getErrorWithAdditionalInfo(error, `env.on(${errorEventName})`));
      env.emit(errorEventName, error);
    });

    gen.on(errorEventName, (error: any) =>
      this.onGeneratorFailure(generatorName, this.getErrorWithAdditionalInfo(error, `gen.on(${errorEventName})`)),
    );

    // when generator "restart" is selected, re-register the "uncaughtException" listener (with the updated context variables)
    this.onUncaughtException && process.removeListener("uncaughtException", this.onUncaughtException);
    this.onUncaughtException = (error) => {
      this.onGeneratorFailure(generatorName, this.getErrorWithAdditionalInfo(error, "process.on(uncaughtException)"));
      env.emit("end", error); // forced shutdown the running
    };
    process.on("uncaughtException", this.onUncaughtException);
  }

  private getErrorWithAdditionalInfo(error: any, additionalInfo: string) {
    _.set(error, "message", `${additionalInfo} ${_.get(error, "message", "")}`);
    return error;
  }

  /**
   *
   * @param answers - partial answers for the current prompt -- the input parameter to the method to be evaluated
   * @param method
   */
  private async evaluateMethod(params: any[], questionName: string, methodName: string): Promise<any> {
    try {
      if (this.currentQuestions) {
        const relevantQuestion: any = _.find(this.currentQuestions, (question) => {
          return _.get(question, "name") === questionName;
        });
        if (relevantQuestion) {
          const guiType = _.get(relevantQuestion, "guiOptions.type", relevantQuestion.guiType);
          // eslint-disable-next-line @typescript-eslint/ban-types
          const customQuestionEventHandler: Function = this.getCustomQuestionEventHandler(guiType, methodName);
          return _.isUndefined(customQuestionEventHandler)
            ? await relevantQuestion[methodName].apply(this.gen, params)
            : await customQuestionEventHandler.apply(this.gen, params);
        }
      }
    } catch (error) {
      const questionInfo = `Could not update method '${methodName}' in '${questionName}' question in generator '${this.gen.options.namespace}'`;
      const errorMessage = this.logError(this.getErrorWithAdditionalInfo(error, "evaluateMethod()"), questionInfo);
      this.onGeneratorFailure(this.generatorName, errorMessage);
    }
  }

  private async receiveIsWebviewReady() {
    try {
      let generatorId: string = this.uiOptions.generator;
      if (!generatorId) {
        // Reset current header title label, in case it has been updated by generators
        this.resetHeaderTitle();
        const generators: IQuestionsPrompt = await this.getGeneratorsPrompt();
        await this._notifyGeneratorsInstall(this.uiOptions.installGens, true);
        AnalyticsWrapper.updateGeneratorStarted();
        const response: any = await this.rpc.invoke("showPrompt", [generators.questions, "select_generator"]);
        generatorId = response.generator;
      }
      this.replayUtils.clear();
      AnalyticsWrapper.updateGeneratorSelected(generatorId);
      await this.runGenerator(generatorId);
    } catch (error) {
      this.logError(error, "receiveIsWebviewReady");
    }
  }

  private toggleOutput() {
    this.output.show();
  }

  private exploreGenerators() {
    return vscode.commands.executeCommand("exploreGenerators");
  }

  private getCwd(): string {
    const targetFolderConfig = this.wsGet(this.TARGET_FOLDER_CONFIG_PROP);
    if (!_.isEmpty(targetFolderConfig)) {
      return targetFolderConfig;
    }

    return Constants.IS_IN_BAS
      ? Constants.HOMEDIR_PROJECTS
      : _.get(vscode, "workspace.workspaceFolders[0].uri.fsPath", Constants.HOMEDIR_PROJECTS);
  }

  public async showPrompt(questions: Questions<any>): Promise<inquirer.Answers> {
    this.promptCount++;
    const promptName = this.getPromptName(questions);

    if (this.replayUtils.getReplayState() === ReplayState.Replaying) {
      return this.replayUtils.next(this.promptCount, promptName);
    } else if (this.replayUtils.getReplayState() === ReplayState.EndingReplay) {
      const prompts: IPrompt[] = this.replayUtils.stop(questions);
      void this.setPromptList(prompts);
    }

    this.replayUtils.recall(questions);

    this.currentQuestions = questions;
    const mappedQuestions: Questions<any> = this.normalizeFunctions(questions);
    if (_.isEmpty(mappedQuestions)) {
      return {};
    }

    const answers = await this.rpc.invoke("showPrompt", [mappedQuestions, promptName]);
    this.replayUtils.remember(questions, answers);
    return answers;
  }

  private async back(partialAnswers: Environment.Answers, numOfSteps: number): Promise<void> {
    this.replayUtils.start(this.currentQuestions, partialAnswers, numOfSteps);
    return this.runGenerator(this.generatorName);
  }

  private executeCommand(id: string, ...args: any[]): void {
    void this.youiEvents.executeCommand(id, args);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private getCustomQuestionEventHandler(questionType: string, methodName: string): Function {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const entry: Map<string, Function> = this.customQuestionEventHandlers.get(questionType);
    if (entry !== undefined) {
      return entry.get(methodName);
    }
  }

  private getPromptName(questions: Questions<any>): string {
    const firstQuestionName = _.get(questions, "[0].name");
    return firstQuestionName ? _.startCase(firstQuestionName) : `Step ${this.promptCount}`;
  }

  private onGeneratorSuccess(
    generatorName: string,
    resourcesBeforeGen?: { targetFolderPath: string },
    resourcesAfterGen?: { targetFolderPath: string; changeMap: Map<string, any> },
  ) {
    function _getChangesStat(
      targetPath: string,
      changeMap: Map<string, { isDirectory: boolean }>,
    ): { folders: string[]; files: string[] } {
      const files: string[] = [];
      const folders: string[] = []; // Top-level folders

      for (const [filePath, fileInfo] of changeMap) {
        if (fileInfo.isDirectory) {
          const relativePath = path.relative(targetPath, filePath).trim();
          const parts = relativePath.split(path.sep).filter(Boolean);
          if (parts.length === 1) {
            // Top-level folder
            folders.push(filePath);
          }
        } else {
          files.push(filePath);
        }
      }
      return { folders, files };
    }

    let targetFolderPath: string = null;
    // All the paths here absolute normilized paths.
    const targetFolderPathBeforeGen: string = _.get(resourcesBeforeGen, "targetFolderPath");
    const targetFolderPathAfterGen: string = _.get(resourcesAfterGen, "targetFolderPath");
    let hasNewDirs: boolean = true;
    if (targetFolderPathBeforeGen === targetFolderPathAfterGen) {
      const stats = _getChangesStat(targetFolderPathAfterGen, resourcesAfterGen.changeMap);
      if (_.size(stats.folders) === 1) {
        // One folder added by generator and targetFolderPath/destinationRoot was not changed by generator.
        // ---> Fiori project generator flow.
        targetFolderPath = stats.folders[0];
      } else if (_.size(stats.folders) === 0 && _.size(stats.files) === 0) {
        // No files or folders added by generator.
        hasNewDirs = false;
      }
      //else { // _.size(newDirs) > 1 (5 folders)
      // We don't know what is the correct targetFolderPath ---> no buttons should be shown.
      // No folder added by generator ---> Fiori module generator flow.
      // Many folders added by generator --->
      // }
    } else {
      //(targetFolderPathBeforeGen !== targetFolderPathAfterGen)
      // Generator changed targetFolderPath/destinationRoot.
      // ---> FoodQ generator flow.
      targetFolderPath = targetFolderPathAfterGen;
    }

    const type: string = this.typesMap.has(generatorName) ? this.typesMap.get(generatorName) : "files";
    // For now - A Fiori project is supposed to create the project and not open it
    const ignoreGen: boolean = this.generatorsToIgnoreArray.includes(generatorName);
    const selectedWorkspace: string =
      type === "files" || type === "module" || ignoreGen
        ? this.uiOptions.messages.create_and_close
        : this.wsGet(this.SELECTED_WORKSPACE_CONFIG_PROP);

    const message = this.uiOptions.messages.artifact_with_name_generated(generatorName);
    const generatedTemplatePath = targetFolderPath ? targetFolderPath : targetFolderPathBeforeGen;
    this.logger.debug(`done running yeomanui! ${message} You can find it at ${generatedTemplatePath}`);
    AnalyticsWrapper.updateGeneratorEnded(generatorName);
    // when targetFolderPath is undefined and no files are generated, send type = '' to get the empty toast message
    this.youiEvents.doGeneratorDone(true, message, selectedWorkspace, hasNewDirs ? type : "", targetFolderPath);
    this.setInitialProcessDir();
    this.flowState.resolve();
    this.generatorName = ""; // reset generator name
  }

  private onGeneratorFailure(generatorName: string, error: any) {
    // avoid display the error multiple times due the same running
    if (!this.errorThrown) {
      this.errorThrown = true;
      const messagePrefix = `${generatorName} generator failed`;
      const errorMessage: string = this.logError(error, messagePrefix);
      this.youiEvents.doGeneratorDone(false, errorMessage, "", "files");
      this.setInitialProcessDir();
      this.flowState.reject(error);
      this.generatorName = ""; // reset generator name
    }
  }

  private onGenInstall(gen: any) {
    gen.on("method:install", () => {
      this.youiEvents.doGeneratorInstall();
    });
  }

  private getErrorInfo(error: any = "") {
    if (_.isString(error)) {
      return { message: error };
    }

    const res = {
      message: _.get(error, "message", ""),
      stack: _.get(error, "stack", ""),
    };

    return res;
  }

  private async createGeneratorPromptQuestions(gensData: GeneratorData[], genFilter: GeneratorFilter): Promise<any[]> {
    //read the hidden generators from settings
    const hiddenGenerators = this.wsGet(this.HIDE_GENERATORS_PROP);
    const hiddenGeneratorsArray = hiddenGenerators.split(",").map((gen) => gen.trim());
    const generatorChoicePromises = _.map(gensData, (genData) => {
      return this.getGeneratorChoice(genData, genFilter, hiddenGeneratorsArray);
    });

    const questions: any[] = [];

    if (_.includes(genFilter.types, GeneratorType.project)) {
      const targetFolderQuestion: any = {
        type: "input",
        guiOptions: {
          type: "label",
          hint: this.uiOptions.messages.select_target_folder_question_hint,
          link: {
            text: "Preferences",
            command: {
              id: "workbench.action.openSettings",
              params: [`ApplicationWizard.TargetFolder`],
            },
          },
        },
        name: "generator.target.folder",
        message: "Specify a target folder path",
        default: this.getCwd(),
      };
      questions.push(targetFolderQuestion);

      const locationQuestion: any = {
        type: "label",
        guiOptions: {
          hint: this.uiOptions.messages.select_open_workspace_question_hint,
          link: {
            text: "Preferences",
            command: {
              id: "workbench.action.openSettings",
              params: [`ApplicationWizard.Workspace`],
            },
          },
        },
        name: "selectedWorkspace",
        message: this.uiOptions.messages.select_open_workspace_question_hint,
        default: this.wsGet(this.SELECTED_WORKSPACE_CONFIG_PROP),
      };
      questions.push(locationQuestion);
    }

    const generatorChoices = await Promise.all(generatorChoicePromises);
    const generatorQuestion: any = {
      type: "list",
      guiType: "tiles",
      guiOptions: {
        hint: this.uiOptions.messages.select_generator_question_hint,
        breadcrumb: "", // Empty string hides label for selected generator nav breadcrumb
      },
      name: "generator",
      message: this.uiOptions.messages.select_generator_question_message,
      choices: _.compact(generatorChoices),
    };
    questions.push(generatorQuestion);

    return questions;
  }

  private async getGeneratorChoice(genData: GeneratorData, filter: GeneratorFilter, hiddenGeneratorsArray: string[]) {
    const packageJson = genData.generatorPackageJson;
    const genMeta = genData.generatorMeta;
    const genFilter: GeneratorFilter = GeneratorFilter.create(_.get(packageJson, ["generator-filter"]));
    const typesHasIntersection: boolean = GeneratorFilter.hasIntersection(filter.types, genFilter.types);
    const categoriesHasIntersection: boolean = GeneratorFilter.hasIntersection(filter.categories, genFilter.categories);
    const type = _.includes(genFilter.types, GeneratorType.project)
      ? "project"
      : _.includes(genFilter.types, GeneratorType.module)
        ? "module"
        : "files";
    this.typesMap.set(genMeta.namespace, type);
    _.includes(genFilter.types, "tools-suite") && this.generatorsToIgnoreArray.push(genMeta.namespace);
    let hidden = _.includes(genFilter.categories, "hidden");
    // check the settings and hide generators accordingly. example: @bas-dev/basic-multitarget-application
    if (_.includes(hiddenGeneratorsArray, genMeta.namespace.split(":")[0])) {
      hidden = true;
    }
    if (!hidden && typesHasIntersection && categoriesHasIntersection) {
      return this.createGeneratorChoice(genMeta.namespace, genMeta.packagePath, packageJson);
    }
  }

  private async createGeneratorChoice(genNamespace: string, genPackagePath: string, packageJson: any): Promise<any> {
    let genImageUrl;

    try {
      genImageUrl = await datauri(path.join(genPackagePath, YeomanUI.YEOMAN_PNG));
    } catch (error) {
      genImageUrl = defaultImage.default;
      this.logger.debug(error);
    }

    const genName = Environment.namespaceToName(genNamespace);
    const genMessage = _.get(packageJson, "description", YeomanUI.defaultMessage);
    const genDisplayName = _.get(packageJson, "displayName", "");
    const genPrettyName = _.isEmpty(genDisplayName) ? titleize(humanizeString(genName)) : genDisplayName;
    const genHomepage = _.get(packageJson, "homepage", "");
    const filter = _.get(packageJson, "generator-filter", undefined);
    const isToolsSuiteType = filter ? _.includes(filter.types, "tools-suite") : false;

    return {
      genNamespace,
      value: genNamespace,
      name: genPrettyName,
      description: genMessage,
      homepage: genHomepage,
      image: genImageUrl,
      isToolsSuiteType: isToolsSuiteType,
    };
  }

  /**
   *
   * @param questions
   * returns a deep copy of the original questions, but replaces Function properties with a placeholder
   *
   * Functions are lost when being passed to client (using JSON.Stringify)
   * Also functions cannot be evaluated on client)
   */
  private normalizeFunctions(questions: Questions<any>): Questions<any> {
    this.addCustomQuestionEventHandlers(questions);
    return JSON.parse(JSON.stringify(questions, YeomanUI.funcReplacer));
  }

  private setPromptList(prompts: IPrompt[]): Promise<void> {
    const promptsToDisplay: IPrompt[] = prompts.map((prompt: IPrompt) => {
      return _.assign({ questions: [], name: "", description: "" }, prompt);
    });

    if (this.replayUtils.isReplaying) {
      this.replayUtils.setPrompts(promptsToDisplay);
    } else {
      return this.rpc.invoke("setPromptList", [promptsToDisplay]);
    }
  }

  private addCustomQuestionEventHandlers(questions: Questions<any>): void {
    for (const question of questions as any[]) {
      const guiType = _.get(question, "guiOptions.type", question.guiType);
      const questionHandlers = this.customQuestionEventHandlers.get(guiType);
      if (questionHandlers) {
        questionHandlers.forEach((handler, methodName) => {
          question[methodName] = handler;
        });
      }
    }
  }
}
