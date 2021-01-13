import * as mocha from "mocha";
import * as sinon from "sinon";
const datauri = require("datauri"); // eslint-disable-line @typescript-eslint/no-var-requires
import * as fsextra from "fs-extra";
import { expect } from "chai";
import * as _ from "lodash";
import * as path from "path";
import { YeomanUI } from "../src/yeomanui";
import { ReplayUtils } from "../src/replayUtils";
import * as yeomanEnv from "yeoman-environment";
import { YouiEvents } from '../src/youi-events';
import { IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { GeneratorFilter } from "../src/filter";
import * as os from "os";
import messages from "../src/messages";
import Environment = require("yeoman-environment");
import { SWA } from "../src/swa-tracker/swa-tracker-wrapper";
import { AppWizard } from "@sap-devx/yeoman-ui-types";
import { mockVscode } from "./mockUtil";

const config = {
    get: () => new Error("not implemented"),
    update: () => new Error("not implemented"),
};
const Global = new Error("not implemented");

const testVscode = {
    workspace: {
        getConfiguration: () => config
	},
	ConfigurationTarget: {
		Global
	}
};
mockVscode(testVscode, "src/yeomanui.ts");

describe('yeomanui unit test', () => {
	let sandbox: any;
	let yeomanEnvMock: any;
	let fsExtraMock: any;
	let datauriMock: any;
	let loggerMock: any;
	let swaTrackerWrapperMock: any;
	let rpcMock: any;
	let youiEventsMock: any;
	const UTF8 = "utf8";
	const PACKAGE_JSON = "package.json";
	let vscodeWorkspaceMock: any;
	let vscodeConfigurationTargetMock: any;
	let vscodeMock: any;

	const choiceMessage =
		"Some quick example text of the generator description. This is a long text so that the example will look good.";
	class TestEvents implements YouiEvents {
		public doGeneratorDone(success: boolean, message: string, selectedWorkspace: string, type: string, targetPath?: string): void {
			return;
		}
		public doGeneratorInstall(): void {
			return;
		}
		public showProgress(message?: string): void {
			return;
		}
		public getAppWizard(): AppWizard {
			return;
		}
		public executeCommand(command: string, ...rest: any[]): Thenable<any> {
			return;
		}
	}
	class TestRpc implements IRpc {
		public timeout: number;
		public promiseCallbacks: Map<number, IPromiseCallbacks>;
		public methods: Map<string, IMethod>;
		public sendRequest(): void {
			return;
		}
		public sendResponse(): void {
			return;
		}
		public setResponseTimeout(): void {
			return;
		}
		public registerMethod(): void {
			return;
		}
		public unregisterMethod(): void {
			return;
		}
		public listLocalMethods(): string[] {
			return [];
		}
		public handleResponse(): void {
			return;
		}
		public listRemoteMethods(): Promise<string[]> {
			return Promise.resolve([]);
		}
		public invoke(): Promise<any> {
			return Promise.resolve();
		}
		public handleRequest(): Promise<void> {
			return Promise.resolve();
		}
	}

	const testLogger = {
		debug: () => true, error: () => true,
		fatal: () => true, warn: () => true, info: () => true, trace: () => true, getChildLogger: () => { return testLogger; }
	};

	const rpc = new TestRpc();
	const outputChannel: any = {
		appendLine: () => "",
		show: () => ""
	};
	const youiEvents = new TestEvents();
	const yeomanUi: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger,
		{ filter: GeneratorFilter.create(), messages }, undefined);

	before(() => {
		sandbox = sinon.createSandbox();
	});

	after(() => {
		sandbox.restore();
	});

	beforeEach(() => {
		yeomanEnvMock = sandbox.mock(yeomanEnv);
		fsExtraMock = sandbox.mock(fsextra);
		datauriMock = sandbox.mock(datauri);
		rpcMock = sandbox.mock(rpc);
		loggerMock = sandbox.mock(testLogger);
		swaTrackerWrapperMock = sandbox.mock(SWA);
		youiEventsMock = sandbox.mock(youiEvents);
		vscodeWorkspaceMock = sandbox.mock(testVscode.workspace);
		vscodeConfigurationTargetMock = sandbox.mock(testVscode.ConfigurationTarget.Global);
		vscodeMock = sandbox.mock(testVscode.ConfigurationTarget.Global);
	});

	afterEach(() => {
		yeomanEnvMock.verify();
		fsExtraMock.verify();
		datauriMock.verify();
		rpcMock.verify();
		loggerMock.verify();
		swaTrackerWrapperMock.verify();
		youiEventsMock.verify();
		vscodeWorkspaceMock.verify();
		vscodeConfigurationTargetMock.verify();
		vscodeMock.verify();
	});

	describe("receiveIsWebviewReady", () => {
		it("flow is successfull", async () => {
			rpcMock.expects("invoke").withArgs("showPrompt").resolves({ generator: "testGenerator" });
			swaTrackerWrapperMock.expects("updateGeneratorStarted").withArgs("testGenerator");
			swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("testGenerator:app", false);
			youiEventsMock.expects("doGeneratorDone").withArgs(false);
			await yeomanUi["receiveIsWebviewReady"]();
		});

		it("an error is thrown", async () => {
			loggerMock.expects("error");
			youiEventsMock.expects("doGeneratorDone").never();
			await yeomanUi["receiveIsWebviewReady"]();
		});
	});

	describe("showPrompt", () => {
		it("prompt without questions", async () => {
			const answers = await yeomanUi.showPrompt([]);
			expect(answers).to.be.empty;
		});
	});

	describe("executeCommand", () => {
		it("called with command id & args", async () => {
			const commandId = "vscode.open";
			const commandArgs = [ {	fsPath: "https://en.wikipedia.org"} ];
			youiEventsMock.expects("executeCommand").withExactArgs(commandId, commandArgs);
			await yeomanUi["executeCommand"](commandId, commandArgs);
		});

	});

	describe("showProgress", () => {
		it("called with message parameter ---> call showProgress event with the parameter", async () => {
			const message = "Project Test is generating";
			youiEventsMock.expects("showProgress").withExactArgs(message);
			await yeomanUi.showProgress(message);
		});

		it("called without message parameter ---> call showProgress event with no parameter", async () => {
			youiEventsMock.expects("showProgress").withExactArgs(undefined);
			await yeomanUi.showProgress();
		});
	});

	describe("getGeneratorsPrompt", () => {
		beforeEach(() => {
			yeomanUi["gensMetaPromise"] = Promise.resolve({
				"test1:app": { namespace: "test1:app", packagePath: "test1Path" },
				"test2:app": { namespace: "test2:app", packagePath: "test2Path" },
				"test3:app": { namespace: "test3:app", packagePath: "test3Path" },
				"test4:app": { namespace: "test4:app", packagePath: "test4Path" },
				"test5:app": { namespace: "test5:app", packagePath: "test5Path" }
			});
		});

		it("there are no generators", async () => {
			yeomanUi["gensMetaPromise"] = Promise.resolve();
			const result = await yeomanUi["getGeneratorsPrompt"]();
			const generatorQuestion: any = {
				type: "list",
				guiType: "tiles",
				guiOptions: {
					hint: yeomanUi["uiOptions"].messages.select_generator_question_hint
				},
				name: "generator",
				message: yeomanUi["uiOptions"].messages.channel_name,
				choices: []
			};
			expect(result).to.be.deep.equal({ name: "Select Generator", questions: [generatorQuestion] });
		});

		it("get generators with type project", async () => {
			yeomanUi["gensMetaPromise"] = Promise.resolve({
				"test1:app": { namespace: "test1:app", packagePath: "test1Path" },
				"test2:app": { namespace: "test2:app", packagePath: "test2Path" },
				"test3:app": { namespace: "test3:app", packagePath: "test3Path" },
				"test4:app": { namespace: "test4:app", packagePath: "test4Path" },
				"test5:app": { namespace: "test5:app", packagePath: "test5Path" }
			});

			fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project_test"}}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test4Description"}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test5Description"}`);

			const genFilter: GeneratorFilter = GeneratorFilter.create({ type: "project" });
			yeomanUi["uiOptions"] = { filter: genFilter, messages };
			const result = await yeomanUi["getGeneratorsPrompt"]();

			const question = result.questions[1];
			expect(question.choices).to.have.lengthOf(2);
			const test1Choice = question.choices[0];
			const test2Choice = question.choices[1];
			expect(test1Choice.name).to.be.equal("Test1");
			expect(test1Choice.description).to.be.equal("test1Description");
			expect(test2Choice.name).to.be.equal("Test4");
			expect(test2Choice.description).to.be.equal("test4Description");
		});

		it("get generators with type module", async () => {
			fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project_test"}}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test4Description"}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test5Description"}`);

			const genFilter = GeneratorFilter.create({ type: "module" });
			yeomanUi["uiOptions"] = { filter: genFilter, messages };
			const result = await yeomanUi["getGeneratorsPrompt"]();

			expect(result.questions[0].choices).to.have.lengthOf(1);
			const test1Choice = result.questions[0].choices[0];
			expect(test1Choice.name).to.be.equal("Test3");
			expect(test1Choice.description).to.be.equal(choiceMessage);
		});

		it("get generators all generators", async () => {
			fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project_test"}}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "all"}, "description": "test4Description"}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test5Description"}`);

			yeomanUi["uiOptions"] = { filter: GeneratorFilter.create({ type: [] }), messages };
			const result = await yeomanUi["getGeneratorsPrompt"]();

			expect(result.questions[0].choices).to.have.lengthOf(5);
		});

		it("get generators with accessible package.json", async () => {
			fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).throws(new Error("test1Error"));
			fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).throws(new Error("test2Error"));
			fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test4Description"}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test5Description"}`);

			yeomanUi["uiOptions"] = { filter: GeneratorFilter.create({ type: [] }), messages };
			const result = await yeomanUi["getGeneratorsPrompt"]();

			expect(result.questions[0].choices).to.have.lengthOf(3);
		});

		it("wrong generators filter type is provided", async () => {
			yeomanUi["gensMetaPromise"] = Promise.resolve({
				"test1:app": { namespace: "test1:app", packagePath: "test1Path" }
			});

			fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project123"}, "description": "test4Description"}`);

			yeomanUi["uiOptions"] = { filter: GeneratorFilter.create({ type: "project" }), messages };
			const result = await yeomanUi["getGeneratorsPrompt"]();

			expect(result.questions[1].choices).to.be.empty;
		});

		it("get generators with type project and categories cat1 and cat2", async () => {
			fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": ["project"], "categories": ["cat2"]}, "description": "test1Description"}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project", "categories": ["cat2", "cat1"]}}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": ["module"]}}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project", "categories": ["cat1"]}, "description": "test4Description"}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test5Description"}`);

			const genFilter: GeneratorFilter = GeneratorFilter.create({ type: ["project"], categories: ["cat1", "cat2"] });
			yeomanUi["uiOptions"].filter = genFilter;
			const result = await yeomanUi["getGeneratorsPrompt"]();

			const question = result.questions[1];
			expect(question.choices).to.have.lengthOf(3);
			const test1Choice = question.choices[0];
			const test2Choice = question.choices[1];
			const test3Choice = question.choices[2];
			expect(test1Choice.name).to.be.equal("Test1");
			expect(test2Choice.name).to.be.equal("Test2");
			expect(test3Choice.name).to.be.equal("Test4");
		});

		it("get generators with displayName", async () => {
			yeomanUi["gensMetaPromise"] = Promise.resolve({
				"test1-project:app": { namespace: "test1-project:app", packagePath: "test1Path" },
				"test2-module:app": { namespace: "test2-module:app", packagePath: "test2Path" },
				"test3:app": { namespace: "test3:app", packagePath: "test3Path" }
			});

			fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test3Description", "displayName": "3rd - Test"}`);

			yeomanUi["uiOptions"] = { filter: GeneratorFilter.create({ type: undefined }), messages };
			const result = await yeomanUi["getGeneratorsPrompt"]();

			const choices = result.questions[0].choices;
			expect(choices).to.have.lengthOf(3);
			const test1Choice = choices[0];
			const test2Choice = choices[1];
			const test3Choice = choices[2];
			expect(test1Choice.name).to.be.equal("Test1 Project");
			expect(test2Choice.name).to.be.equal("Test2 Module");
			expect(test3Choice.name).to.be.equal("3rd - Test");
		});

		it("get generators with homepage", async () => {
			yeomanUi["gensMetaPromise"] = Promise.resolve({
				"test1:app": { namespace: "test1:app", packagePath: "test1Path" },
				"test2:app": { namespace: "test2:app", packagePath: "test2Path" },
				"test3:app": { namespace: "test3:app", packagePath: "test3Path" }
			});

			fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description", "homepage": "https://myhomepage.com/ANY/generator-test1-project#readme"}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}, "homepage": "https://myhomepage.com/ANY/generator-test2-module#readme"}`);
			fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test3Description"}`);

			yeomanUi["uiOptions"] = { filter: GeneratorFilter.create(), messages };
			const result = await yeomanUi["getGeneratorsPrompt"]();

			const choices = result.questions[0].choices;
			expect(choices).to.have.lengthOf(3);
			const test1Choice = choices[0];
			const test2Choice = choices[1];
			const test3Choice = choices[2];
			expect(test1Choice.homepage).to.be.equal("https://myhomepage.com/ANY/generator-test1-project#readme");
			expect(test2Choice.homepage).to.be.equal("https://myhomepage.com/ANY/generator-test2-module#readme");
			expect(test3Choice.homepage).to.be.equal("");
		});
	});

	describe("funcReplacer", () => {
		it("with function", () => {
			const res = YeomanUI["funcReplacer"]("key", () => { return; });
			expect(res).to.be.equal("__Function");
		});

		it("without function", () => {
			const res = YeomanUI["funcReplacer"]("key", "value");
			expect(res).to.be.equal("value");
		});
	});

	it("setCwd", () => {
		const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {}, "testpathbefore");
		expect(yeomanUiInstance["getCwd"]()).equal("testpathbefore");
		yeomanUiInstance["setCwd"]("testpathafter");
		expect(yeomanUiInstance["getCwd"]()).equal("testpathafter");

		yeomanUiInstance["setCwd"](undefined);
		expect(yeomanUiInstance["getCwd"]()).equal(YeomanUI["PROJECTS"]);
	});

	it("defaultOutputPath", () => {
		const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {}, undefined);
		const projectsPath = path.join(os.homedir(), 'projects');
		expect(yeomanUiInstance["getCwd"]()).equal(projectsPath);
	});

	it("getErrorInfo", () => {
		const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, null, undefined);
		const errorInfo = "Error Info";
		const res = yeomanUiInstance["getErrorInfo"](errorInfo);
		expect(res.message).to.be.equal(errorInfo);
	});

	describe("answersUtils", () => {
		it("setDefaults", () => {
			const questions = [
				{ name: "q1", default: "a" },
				{ name: "q2", default: () => "b" },
				{ name: "q3" }
			];
			const answers = {
				q1: "x",
				q2: "y",
				q3: "z"
			};
			ReplayUtils["setDefaults"](questions, answers);
			for (const question of questions) {
				switch (question.name) {
					case "a":
						expect((question as any)["answer"]).to.equal("x");
						break;
					case "b":
						expect((question as any)["answer"]).to.equal("y");
						break;
					case "c":
						expect((question as any)["answer"]).to.equal("z");
						break;
				}
			}
		});
	});

	describe("handleErrors", () => {
		it("check event names", () => {
			const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {}, undefined);
			const env: Environment = Environment.createEnv();
			const envMock = sandbox.mock(env);
			const gen = { on: () => "" };
			const genMock = sandbox.mock(gen);
			const processMock = sandbox.mock(process);
			envMock.expects("on").withArgs("error");
			genMock.expects("on").withArgs("error");
			processMock.expects("on").withArgs("uncaughtException");
			yeomanUiInstance["handleErrors"](env, gen, "genName");
			envMock.verify();
			genMock.verify();
			processMock.verify();
		});
	});

	describe("setGenInWriting", () => {
		let genMock: any;
		let rpcMock: any;
		const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {}, undefined);
		const gen: any = { on: () => "" };

		beforeEach(() => {
			genMock = sandbox.mock(gen);
			rpcMock = sandbox.mock(rpc);
			genMock.expects("on").withArgs("method:writing");
			rpcMock.expects("invoke").withExactArgs("setGenInWriting", [false]);
		});

		afterEach(() => {
			genMock.verify();
			rpcMock.verify();
		});

		it("writing method does not exist on generator", () => {
			yeomanUiInstance["setGenInWriting"](gen);
		});

		it("writing method exists on generator", () => {
			gen.writing = () => "";
			yeomanUiInstance["setGenInWriting"](gen);
		});
	});

	describe("exploreGenerators", () => {
		it("vscode module is not available", () => {
			const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {}, undefined);
			yeomanUiInstance["getVscode"] = () => undefined;
			swaTrackerWrapperMock.expects("updateExploreAndInstallGeneratorsLinkClicked");
			yeomanUiInstance["exploreGenerators"]();
		});

		it("vscode module is available", () => {
			const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {}, undefined);
			const testVscode = { commands: { executeCommand: () => "" } };
			yeomanUiInstance["getVscode"] = () => testVscode;
			const commandsMock = sandbox.mock(testVscode.commands);
			commandsMock.expects("executeCommand").withExactArgs("exploreGenerators");
			swaTrackerWrapperMock.expects("updateExploreAndInstallGeneratorsLinkClicked");
			yeomanUiInstance["exploreGenerators"]();
			commandsMock.verify();
		});
	});

	it("onGenInstall", () => {
		const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create(), undefined);
		const gen: any = { on: () => "" };
		const genMock = sandbox.mock(gen);

		genMock.expects("on").withArgs("method:install");
		yeomanUiInstance["onGenInstall"](gen);
		genMock.verify();
	});

	describe("showPrompt", () => {
		it("returns answers", async () => {
			const firstName = "john";
			rpc.invoke = async () => {
				return {
					firstName,
					lastName: "doe"
				};
			};
			const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create(), undefined);
			const questions = [{ name: "q1" }];
			const response = await yeomanUiInstance.showPrompt(questions);
			expect(response.firstName).to.equal(firstName);
		});

		it("with back", async () => {
			const firstName = "john";
			const country = "denmark";

			(rpc.invoke as (methodName: string, params: any[]) => Promise<any>) = async (methodName: string, params: any[]) => {
				const questionName: string = params[0][0].name;
				if (questionName === "q1") {
					return {
						firstName,
						lastName: "doe"
					};
				} else if (questionName === "q2") {
					return {
						country
					};
				}
			};
			const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create(), undefined);
			yeomanUiInstance["runGenerator"] = async (): Promise<any> => { return; };
			let questions = [{ name: "q1" }];
			let response = await yeomanUiInstance.showPrompt(questions);
			expect(response.firstName).to.equal(firstName);

			questions = [{ name: "q2" }];

			response = await yeomanUiInstance.showPrompt(questions);
			expect(response.country).to.equal(country);
			expect(yeomanUiInstance["replayUtils"]["isReplaying"]).to.be.false;

			swaTrackerWrapperMock.expects("updateOneOfPreviousStepsClicked").withArgs("");

			yeomanUiInstance["back"](undefined, 1);
			expect(yeomanUiInstance["replayUtils"]["isReplaying"]).to.be.true;

			questions = [{ name: "q1" }];
			response = await yeomanUiInstance.showPrompt(questions);
			expect(response.firstName).to.equal(firstName);
		});
	});

	describe("onGeneratorSuccess - onGeneratorFailure", () => {
		let doGeneratorDoneSpy: any;

		beforeEach(() => {
			doGeneratorDoneSpy = sandbox.spy(youiEvents, "doGeneratorDone");
		});

		afterEach(() => {
			doGeneratorDoneSpy.restore();
		});

		it("onGeneratorSuccess - one dir was created", () => {
			const beforeGen = { targetFolderPath: "testDestinationRoot", childDirs: ["dirparh1"] };
			const afterGen = { targetFolderPath: "testDestinationRoot", childDirs: ["dirparh1", "dirpath2"] };
			swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("testGenName", true, testLogger);
			yeomanUi["onGeneratorSuccess"]("testGenName", beforeGen, afterGen);
			expect(doGeneratorDoneSpy.calledWith(true, _.get(yeomanUi, "uiOptions.messages.artifact_with_name_generated")("testGenName"), "Create the project and close it for later use", "files", "dirpath2")).to.be.true;
		});

		it("onGeneratorSuccess - two dirs were created", () => {
			const beforeGen = { targetFolderPath: "testDestinationRoot", childDirs: ["dirparh1"] };
			const afterGen = { targetFolderPath: "testDestinationRoot", childDirs: ["dirparh1", "dirpath2", "dirpath3"] };
			swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("testGenName", true, testLogger);
			yeomanUi["onGeneratorSuccess"]("testGenName", beforeGen, afterGen);
			expect(doGeneratorDoneSpy.calledWith(true, _.get(yeomanUi, "uiOptions.messages.artifact_with_name_generated")("testGenName"), "Create the project and close it for later use", "files", null)).to.be.true;
		});

		it("onGeneratorSuccess - zero dirs were created", () => {
			const beforeGen = { targetFolderPath: "testDestinationRoot", childDirs: ["dirparh1"] };
			const afterGen = { targetFolderPath: "testDestinationRoot", childDirs: ["dirparh1"] };
			swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("testGenName", true, testLogger);
			yeomanUi["onGeneratorSuccess"]("testGenName", beforeGen, afterGen);
			expect(doGeneratorDoneSpy.calledWith(true, _.get(yeomanUi, "uiOptions.messages.artifact_with_name_generated")("testGenName"), "Create the project and close it for later use", "files", null)).to.be.true;
		});

		it("onGeneratorSuccess - targetFolderPath was changed by generator", () => {
			const beforeGen = { targetFolderPath: "testDestinationRoot" };
			const afterGen = { targetFolderPath: "testDestinationRoot/generatedProject" };
			swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("testGenName", true, testLogger);
			yeomanUi["onGeneratorSuccess"]("testGenName", beforeGen, afterGen);
			expect(doGeneratorDoneSpy.calledWith(true, _.get(yeomanUi, "uiOptions.messages.artifact_with_name_generated")("testGenName"), "Create the project and close it for later use", "files", "testDestinationRoot/generatedProject")).to.be.true;
		});

		it("onGeneratorFailure", () => {
			swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("testGenName", false, testLogger);
			yeomanUi["onGeneratorFailure"]("testGenName", "testError");
			expect(doGeneratorDoneSpy.calledWith(false, `{"message":"testGenName generator failed - testError"}`, "", "files")).to.be.true;
		});

		it("onGeneratorSuccess - generator type is project", async () => {
			yeomanUi["typesMap"].clear();
			yeomanUi["typesMap"].set("foodq:app", "project");
			const beforeGen = { targetFolderPath: "testDestinationRoot" };
			const afterGen = { targetFolderPath: "testDestinationRoot/generatedProject" };
			swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("foodq:app", true, testLogger);
			yeomanUi["newWorkspace"] = true;
			yeomanUi["onGeneratorSuccess"]("foodq:app", beforeGen, afterGen);
			expect(doGeneratorDoneSpy.calledWith(true, _.get(yeomanUi, "uiOptions.messages.artifact_with_name_generated")("foodq:app"), "Open the project in a new workspace", "project", "testDestinationRoot/generatedProject")).to.be.true;
		});

		it("onGeneratorSuccess - Fiori generator with type project", async () => {
			yeomanUi["typesMap"].clear();
			yeomanUi["typesMap"].set("fiori-generator:app", "project");
			const beforeGen = { targetFolderPath: "testDestinationRoot" };
			const afterGen = { targetFolderPath: "testDestinationRoot/generatedProject" };
			swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("fiori-generator:app", true, testLogger);
			yeomanUi["newWorkspace"] = true;
			yeomanUi["onGeneratorSuccess"]("fiori-generator:app", beforeGen, afterGen);
			expect(doGeneratorDoneSpy.calledWith(true, _.get(yeomanUi, "uiOptions.messages.artifact_with_name_generated")("fiori-generator:app"), "Create the project and close it for later use", "project", "testDestinationRoot/generatedProject")).to.be.true;
		});
	});

	describe("Custom Question Event Handlers", () => {
		it("addCustomQuestionEventHandlers()", async () => {
			const testEventFunction = () => {
				return true;
			};
			const questions = [
				{
					name: "q1",
					guiType: "questionType"
				}
			];
			const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create(), undefined);

			yeomanUiInstance["addCustomQuestionEventHandlers"](questions);
			expect(questions[0]).to.not.have.property("testEvent");

			yeomanUiInstance.registerCustomQuestionEventHandler("questionType", "testEvent", testEventFunction);
			yeomanUiInstance["addCustomQuestionEventHandlers"](questions);
			expect(questions[0]).to.have.property("testEvent");
			expect((questions[0] as any)["testEvent"]).to.equal(testEventFunction);
		});
	});

	describe("evaluateMethod()", () => {
		it("custom question events", async () => {
			const testEventFunction = () => {
				return true;
			};
			const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create(), undefined);
			yeomanUiInstance.registerCustomQuestionEventHandler("questionType", "testEvent", testEventFunction);
			yeomanUiInstance["currentQuestions"] = [{ name: "question1", guiType: "questionType" }];
			const response = await yeomanUiInstance["evaluateMethod"](null, "question1", "testEvent");
			expect(response).to.be.true;
		});

		it("question method is called", async () => {
			const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create(), undefined);
			yeomanUiInstance["currentQuestions"] = [{
				name: "question1", method1: () => {
					return true;
				}
			}];
			const response = await yeomanUiInstance["evaluateMethod"](null, "question1", "method1");
			expect(response).to.be.true;
		});

		it("no questions", async () => {
			const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create(), undefined);
			const response = await yeomanUiInstance["evaluateMethod"](null, "question1", "method1");
			expect(response).to.be.undefined;
		});

		it("method throws exception", async () => {
			const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create(), undefined);
			yeomanUiInstance["gen"] = Object.create({});
			yeomanUiInstance["gen"].options = {};
			yeomanUiInstance["currentQuestions"] = [{
				name: "question1", method1: () => {
					throw new Error("Error");
				}
			}];
			swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("", false);
			try {
				await yeomanUiInstance["evaluateMethod"](null, "question1", "method1");
			} catch (e) {
				expect(e.toString()).to.contain("method1");
			}
		});
	});

	describe("_notifyGeneratorsChange", () => {
		it("there are no generators", async () => {
			const result = await yeomanUi["getGeneratorsPrompt"]();
			const generatorQuestion: any = {
				type: "list",
				guiType: "tiles",
				guiOptions: {
					hint: yeomanUi["uiOptions"].messages.select_generator_question_hint
				},
				name: "generator",
				message: yeomanUi["uiOptions"].messages.channel_name,
				choices: []
			};
			expect(result).to.be.deep.equal({ name: "Select Generator", questions: [generatorQuestion] });
			rpcMock.expects("invoke").withExactArgs("updateGeneratorsPrompt", [result.questions]);
			await yeomanUi._notifyGeneratorsChange({});
		});
	});
});
