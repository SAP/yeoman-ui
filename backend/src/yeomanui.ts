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
import * as defaultImage from "./images/defaultImage";
import { YouiAdapter } from "./youi-adapter";
import { YouiEvents } from "./youi-events";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import Generator = require("yeoman-generator");
import { GeneratorFilter, GeneratorType } from "./filter";
import { IChildLogger } from "@vscode-logging/logger";
import { IPrompt } from "@sap-devx/yeoman-ui-types";
import { SWA } from "./swa-tracker/swa-tracker-wrapper";
import TerminalAdapter = require("yeoman-environment/lib/adapter");
import { Output } from "./output";
import { resolve } from "path";


export interface IQuestionsPrompt extends IPrompt {
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
	private output: Output;
	private readonly logger: IChildLogger;
	private genMeta: { [namespace: string]: Environment.GeneratorMeta };
	private readonly youiAdapter: YouiAdapter;
	private gen: Generator | undefined;
	private promptCount: number;
	private npmGlobalPaths: string[];
	private currentQuestions: TerminalAdapter.Questions<any>;
	private generatorName: string;
	private readonly replayUtils: ReplayUtils;
	private readonly customQuestionEventHandlers: Map<string, Map<string, Function>>;
	private errorThrown = false;
	private outputPath: string;
	private initialDestinationRoot: string;

	constructor(rpc: IRpc, youiEvents: YouiEvents, output: Output, logger: IChildLogger, uiOptions: any, outputPath: string = YeomanUI.PROJECTS) {
		this.rpc = rpc;

		this.generatorName = "";
		this.replayUtils = new ReplayUtils();
		this.youiEvents = youiEvents;
		this.logger = logger;
		this.output = output;
		this.outputPath = outputPath;
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

		this.uiOptions = uiOptions;
		this.youiAdapter = new YouiAdapter(youiEvents, output);
		this.youiAdapter.setYeomanUI(this);
		this.promptCount = 0;
		this.genMeta = {};
		this.currentQuestions = {};
		this.customQuestionEventHandlers = new Map();
		this.setCwd(outputPath);
		this.npmGlobalPaths = _.get(uiOptions, "npmGlobalPaths", []);
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

	public async showProgress(message?: string) {
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

	private async getGeneratorsPrompt(): Promise<IQuestionsPrompt> {
		// optimization: looking up generators takes a long time, so if generators are already loaded don't bother
		// on the other hand, we never look for newly installed generators...
		const promise: Promise<IQuestionsPrompt> = new Promise(resolve => {
			const env: Environment.Options = Environment.createEnv();
			const npmPaths = this.getNpmPaths();
			env.lookup({ npmPaths }, async () => this.onEnvLookup(env, resolve, this.uiOptions.filter));
		});

		return promise;
	}

	private getNpmPaths() {
		const parts: string[] = YeomanUI.HOME_DIR.split(path.sep);
		const userPaths = _.map(parts, (part, index) => {
			const resPath = path.join(...parts.slice(0, index + 1), YeomanUI.NODE_MODULES);
			return YeomanUI.isWin32 ? resPath : path.join(path.sep, resPath);
		});

		return this.npmGlobalPaths.concat(userPaths);
	}

	private async getChildDirectories(folderPath: string) {
		const childDirs: string[] = [];
		const result = { targetFolderPath: folderPath, childDirs };

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

	private async runGenerator(generatorNamespace: string) {
		this.generatorName = generatorNamespace;
		// TODO: should create and set target dir only after user has selected a generator;
		// see issue: https://github.com/yeoman/environment/issues/55
		// process.chdir() doesn't work after environment has been created
		try {
			const targetFolder = this.getCwd();
			await fsextra.mkdirs(targetFolder);
			const dirsBefore = await this.getChildDirectories(targetFolder);
			const env: Environment = Environment.createEnv(undefined, { sharedOptions: { forwardErrorToEnvironment: true } }, this.youiAdapter);
			const meta: Environment.GeneratorMeta = this.getGenMetadata(generatorNamespace);
			env.register(meta.resolved, generatorNamespace, meta.packagePath);

			const options = {
				logger: this.logger.getChildLogger({ label: generatorNamespace }),
				vscode: this.getVscode(), // TODO: remove this temporary workaround once a better solution is found,
				data: this.uiOptions.data,
				swaTracker: SWA.getSWATracker(),
				appWizard: this.youiEvents.getAppWizard()
			};
			const gen: any = env.create(generatorNamespace, { options });
			// check if generator defined a helper function called setPromptsCallback()
			const setPromptsCallback = _.get(gen, "setPromptsCallback");
			if (setPromptsCallback) {
				setPromptsCallback(this.setPromptList.bind(this));
			}

			this.promptCount = 0;
			this.gen = (gen as Generator);
			this.initialDestinationRoot = this.gen.destinationRoot();
			this.gen.destinationRoot(targetFolder, true);
			// notifies ui wether generator is in writing state
			this.setGenInWriting(this.gen);
			// handles generator install step if exists
			this.onGenInstall(this.gen);
			// handles generator errors 
			this.handleErrors(env, this.gen, generatorNamespace);

			env.runGenerator(gen, error => {
				if (!this.errorThrown && !error) {
					// Without resolve this code worked only for absolute paths without / at the end.
					// Generator can put a relative path, path including . and .. and / at the end.
					this.getChildDirectories(resolve(this.getCwd(), this.gen.destinationRoot())).then(dirsAfter => {
						this.onGeneratorSuccess(generatorNamespace, dirsBefore, dirsAfter);
					});
				}
			});
		} catch (error) {
			this.onGeneratorFailure(generatorNamespace, this.getErrorWithAdditionalInfo(error, "runGenerator()"));
		}
	}

	private setInitialProcessDir() {
		if (this.initialDestinationRoot) {
			process.chdir(this.initialDestinationRoot);
		}
	}

	private setGenInWriting(gen: any) {
		const genMethodName = "writing";
		const originalPrototype = Object.getPrototypeOf(gen);
		const originalGenWriting = _.get(originalPrototype, genMethodName);
		if (!originalGenWriting) {
			originalPrototype[genMethodName] = () => { }
		}
		const uiRpcMethodName = "setGenInWriting";
		this.rpc.invoke(uiRpcMethodName, [false]);
		gen.on(`method:${genMethodName}`, () => {
			this.rpc.invoke(uiRpcMethodName, [true]);
		});
	}

	private handleErrors(env: Environment, gen: any, generatorName: string) {
		const errorEventName = "error";
		env.on(errorEventName, error => {
			env.removeAllListeners(errorEventName);
			this.onGeneratorFailure(generatorName, this.getErrorWithAdditionalInfo(error, `env.on(${errorEventName})`));
			env.emit(errorEventName, error);
		});

		gen.on(errorEventName, (error: any) => {
			this.onGeneratorFailure(generatorName, this.getErrorWithAdditionalInfo(error, `gen.on(${errorEventName})`));
		});

		process.on("uncaughtException", error => {
			this.onGeneratorFailure(generatorName, this.getErrorWithAdditionalInfo(error, "process.on(uncaughtException)"));
		});
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
			const errorMessage = this.logError(this.getErrorWithAdditionalInfo(error, "evaluateMethod()"), questionInfo);
			this.onGeneratorFailure(this.generatorName, errorMessage);
		}
	}

	private async receiveIsWebviewReady() {
		try {
			let generatorId: string = this.uiOptions.generator;
			const generators: IQuestionsPrompt = await this.getGeneratorsPrompt();
			if (!generatorId){
				const response: any = await this.rpc.invoke("showPrompt", [generators.questions, "select_generator"]);
				generatorId = response.generator;
			}
			this.replayUtils.clear();
			SWA.updateGeneratorStarted(generatorId, this.logger);
			if (!_.includes(generatorId, ":")) {
				generatorId = this.getGenNamespace(generatorId);
			}
			await this.runGenerator(generatorId);
		} catch (error) {
			this.logError(error, "receiveIsWebviewReady");
		}
	}

	private toggleOutput() {
		this.output.show();
	}

	private exploreGenerators() {
		SWA.updateExploreAndInstallGeneratorsLinkClicked(this.logger);
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

	public async showPrompt(questions: TerminalAdapter.Questions<any>): Promise<inquirer.Answers> {
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
		const mappedQuestions: TerminalAdapter.Questions<any> = this.normalizeFunctions(questions);
		if (_.isEmpty(mappedQuestions)) {
			return {};
		}

		const answers = await this.rpc.invoke("showPrompt", [mappedQuestions, promptName]);
		this.replayUtils.remember(questions, answers);
		return answers;
	}

	private back(partialAnswers: Environment.Answers, numOfSteps: number): void {
		SWA.updateOneOfPreviousStepsClicked(this.generatorName, this.logger);
		this.replayUtils.start(this.currentQuestions, partialAnswers, numOfSteps);
		this.runGenerator(this.generatorName);
	}

	private getCustomQuestionEventHandler(questionType: string, methodName: string): Function {
		const entry: Map<string, Function> = this.customQuestionEventHandlers.get(questionType);
		if (entry !== undefined) {
			return entry.get(methodName);
		}
	}

	private getPromptName(questions: TerminalAdapter.Questions<any>): string {
		const firstQuestionName = _.get(questions, "[0].name");
		return (firstQuestionName ? _.startCase(firstQuestionName) : `Step ${this.promptCount}`);
	}

	private onGeneratorSuccess(generatorName: string, resourcesBeforeGen?: any, resourcesAfterGen?: any) {
		let targetFolderPath: string = null;
		// All the paths here absolute normilized paths.
		const targetFolderPathBeforeGen: string = _.get(resourcesBeforeGen, "targetFolderPath");
		const targetFolderPathAfterGen: string = _.get(resourcesAfterGen, "targetFolderPath");
		if (targetFolderPathBeforeGen === targetFolderPathAfterGen) {
			const newDirs: string[] = _.difference(_.get(resourcesAfterGen, "childDirs"), _.get(resourcesBeforeGen, "childDirs"));
			if (_.size(newDirs) === 1) {
				// One folder added by generator and targetFolderPath/destinationRoot was not changed by generator.
				// ---> Fiori project generator flow.
				targetFolderPath = newDirs[0];
			} //else { //_.size(newDirs) = 0 (0 folders) or _.size(newDirs) > 1 (5 folders)
			// We don't know what is the correct targetFolderPath ---> no buttons should be shown.
			// No folder added by generator ---> Fiori module generator flow.
			// Many folders added by generator --->
			// }
		} else { //(targetFolderPathBeforeGen !== targetFolderPathAfterGen)
			// Generator changed targetFolderPath/destinationRoot.
			// ---> FoodQ generator flow.
			targetFolderPath = targetFolderPathAfterGen;
		}

		const message = this.uiOptions.messages.artifact_with_name_generated(generatorName);
		const generatedTemplatePath = targetFolderPath ? targetFolderPath : targetFolderPathBeforeGen;
		this.logger.debug("done running yeomanui! " + message + ` You can find it at ${generatedTemplatePath}`);
		SWA.updateGeneratorEnded(generatorName, true, this.logger);
		this.youiEvents.doGeneratorDone(true, message, targetFolderPath);
		this.setInitialProcessDir();
	}

	private onGeneratorFailure(generatorName: string, error: any) {
		this.errorThrown = true;
		const messagePrefix = `${generatorName} generator failed`;
		const errorMessage: string = this.logError(error, messagePrefix);
		SWA.updateGeneratorEnded(generatorName, false, this.logger, errorMessage);
		this.youiEvents.doGeneratorDone(false, errorMessage);
		this.setInitialProcessDir();
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
					hint: this.uiOptions.messages.select_target_folder_question_hint,
					mandatory: true
				},
				name: "generator.target.folder",
				message: "Specify a target folder path",
				default: defaultPath,
				getPath: async (path: string) => path,
				validate: async (path: string) => {
					try {
						// Without resolve this code worked only for absolute paths without / at the end.
						// The user can put a relative path, path including . and .. and / at the end.
						// In this case many project generation failed or opened invalid folders instead of project at the end (after clicking on the button 'Open project in workspace').
						path = resolve(this.outputPath, path);
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

	private async getGeneratorChoice(genName: string, filter: GeneratorFilter) {
		let packageJson: any;
		const genPackagePath: string = this.getGenMetaPackagePath(genName);

		try {
			packageJson = await this.getGenPackageJson(genPackagePath);
		} catch (error) {
			this.logError(error);
			return;
		}

		const genFilter: GeneratorFilter = GeneratorFilter.create(_.get(packageJson, ["generator-filter"]));
		const typesHasIntersection: boolean = GeneratorFilter.hasIntersection(filter.types, genFilter.types);
		const categoriesHasIntersection: boolean = GeneratorFilter.hasIntersection(filter.categories, genFilter.categories);
		if (typesHasIntersection && categoriesHasIntersection) {
			return this.createGeneratorChoice(genName, genPackagePath, packageJson);
		}
	}

	private async createGeneratorChoice(genName: string, genPackagePath: string, packageJson: any): Promise<any> {
		let genImageUrl;

		try {
			genImageUrl = await datauri(path.join(genPackagePath, YeomanUI.YEOMAN_PNG));
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
		let genNamespace = (_.includes(genName, ":")) ? genName : this.getGenNamespace(genName);
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
	private normalizeFunctions(questions: TerminalAdapter.Questions<any>): TerminalAdapter.Questions<any> {
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

	private addCustomQuestionEventHandlers(questions: TerminalAdapter.Questions<any>): void {
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
