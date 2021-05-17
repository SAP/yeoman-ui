import { vscode } from "./mockUtil";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
const datauri = require("datauri"); // eslint-disable-line @typescript-eslint/no-var-requires
import * as fsextra from "fs-extra";
import { expect } from "chai";
import * as _ from "lodash";
import * as path from "path";
import { YeomanUI } from "../src/yeomanui";
import { ReplayUtils } from "../src/replayUtils";
import { YouiEvents } from "../src/youi-events";
import { IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { GeneratorFilter } from "../src/filter";
import { homedir } from "os";
import messages from "../src/messages";
import { SWA } from "../src/swa-tracker/swa-tracker-wrapper";
import { AppWizard, MessageType } from "@sap-devx/yeoman-ui-types";
import { Env } from "../src/utils/env";
import Environment = require("yeoman-environment");

describe("yeomanui unit test", () => {
  let sandbox: SinonSandbox;
  let appWizardMock: SinonMock;
  let fsExtraMock: SinonMock;
  let datauriMock: SinonMock;
  let loggerMock: SinonMock;
  let swaTrackerWrapperMock: SinonMock;
  let rpcMock: SinonMock;
  let youiEventsMock: SinonMock;
  let envUtilsMock: SinonMock;
  let workspaceMock: SinonMock;
  let commandsMock: SinonMock;
  let wsConfigMock: SinonMock;
  const UTF8 = "utf8";
  const PACKAGE_JSON = "package.json";

  const choiceMessage =
    "Some quick example text of the generator description. This is a long text so that the example will look good.";
  class TestAppWizard extends AppWizard {
    public showError(): void {
      return;
    }
    public showWarning(): void {
      return;
    }
    public showInformation(): void {
      return;
    }
    public showProgress(): void {
      return;
    }
  }
  const appWizard: AppWizard = new TestAppWizard();
  class TestEvents implements YouiEvents {
    public doGeneratorDone(): void {
      return;
    }
    public doGeneratorInstall(): void {
      return;
    }
    public showProgress(): void {
      return;
    }
    public getAppWizard(): AppWizard {
      return;
    }
    public executeCommand(): Thenable<any> {
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
    debug: () => true,
    error: () => true,
    fatal: () => true,
    warn: () => true,
    info: () => true,
    trace: () => true,
    getChildLogger: () => {
      return testLogger;
    },
  };

  const rpc = new TestRpc();
  const outputChannel: any = {
    appendLine: () => "",
    show: () => "",
  };
  const youiEvents = new TestEvents();
  const yeomanUi: YeomanUI = new YeomanUI(
    rpc,
    youiEvents,
    outputChannel,
    testLogger,
    { filter: GeneratorFilter.create(), messages },
    undefined
  );

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    envUtilsMock = sandbox.mock(Env);
    appWizardMock = sandbox.mock(appWizard);
    fsExtraMock = sandbox.mock(fsextra);
    datauriMock = sandbox.mock(datauri);
    rpcMock = sandbox.mock(rpc);
    loggerMock = sandbox.mock(testLogger);
    swaTrackerWrapperMock = sandbox.mock(SWA);
    youiEventsMock = sandbox.mock(youiEvents);
    workspaceMock = sandbox.mock(vscode.workspace);
    commandsMock = sandbox.mock(vscode.commands);
    wsConfigMock = sandbox.mock(vscode.workspace.getConfiguration());
  });

  afterEach(() => {
    workspaceMock.verify();
    commandsMock.verify();
    wsConfigMock.verify();
    appWizardMock.verify();
    fsExtraMock.verify();
    datauriMock.verify();
    rpcMock.verify();
    loggerMock.verify();
    swaTrackerWrapperMock.verify();
    youiEventsMock.verify();
    envUtilsMock.verify();
  });

  it("getChildDirectories", async () => {
    const res = await yeomanUi["getChildDirectories"](homedir());
    expect(res.targetFolderPath).is.not.empty;
    expect(res.childDirs).is.not.empty;

    const errorMessage = "readdir failure";
    fsExtraMock.expects("readdir").throws(new Error(errorMessage));
    const resFail = await yeomanUi["getChildDirectories"](homedir());
    expect(resFail.childDirs).is.empty;
  });

  describe("receiveIsWebviewReady", () => {
    const gensMeta = [
      {
        generatorPath: "test1Path/app/index.js",
        namespace: "test1-project:app",
        packagePath: "test1Path",
      },
      {
        generatorPath: "test2Path/app/index.js",
        namespace: "test2-module:app",
        packagePath: "test2Path",
      },
      {
        generatorPath: "test3Path/app/index.js",
        namespace: "test3:app",
        packagePath: "test3Path",
      },
      {
        generatorPath: "test4Path/app/index.js",
        namespace: "test4:app",
        packagePath: "test4Path",
      },
      {
        generatorPath: "test5Path/app/index.js",
        namespace: "test5:app",
        packagePath: "test5Path",
      },
    ];

    it("flow is successfull", async () => {
      envUtilsMock.expects("getGeneratorsMeta").returns(gensMeta);
      envUtilsMock
        .expects("createEnvAndGen")
        .withArgs("test1-project:app")
        .returns({
          env: {
            on: () => "",
            runGenerator: () => "",
          },
          gen: {
            destinationRoot: () => "",
            on: () => "",
          },
        });

      wsConfigMock.expects("get").withExactArgs(yeomanUi["TARGET_FOLDER_CONFIG_PROP"]);
      rpcMock.expects("invoke").withArgs("showPrompt").resolves({ generator: "test1-project:app" });
      rpcMock.expects("invoke").withExactArgs("setGenInWriting", [false]).resolves();
      swaTrackerWrapperMock.expects("updateGeneratorStarted").withArgs("test1-project:app");
      await yeomanUi["receiveIsWebviewReady"]();
    });

    it("an error is thrown", async () => {
      envUtilsMock.expects("getGeneratorsMeta").throws("gens metadata error");
      loggerMock.expects("error");
      youiEventsMock.expects("doGeneratorDone").never();
      await yeomanUi["receiveIsWebviewReady"]();
    });

    it("single generator", async () => {
      yeomanUi["uiOptions"].generator = "test4:app";
      swaTrackerWrapperMock.expects("updateGeneratorStarted").withArgs("test4:app");
      envUtilsMock
        .expects("createEnvAndGen")
        .withArgs("test4:app")
        .returns({
          env: {
            on: () => "",
            runGenerator: () => "",
          },
          gen: {
            destinationRoot: () => "",
            on: () => "",
          },
        });
      wsConfigMock.expects("get").withExactArgs(yeomanUi["TARGET_FOLDER_CONFIG_PROP"]);
      rpcMock.expects("invoke").withExactArgs("setGenInWriting", [false]).resolves();
      await yeomanUi["receiveIsWebviewReady"]();
    });
  });

  it("showPrompt without questions", async () => {
    const answers = await yeomanUi.showPrompt([]);
    expect(answers).to.be.empty;
  });

  describe("executeCommand", () => {
    it("called with command id & args", () => {
      const commandId = "vscode.open";
      const commandArgs = [{ fsPath: "https://en.wikipedia.org" }];
      youiEventsMock.expects("executeCommand").withExactArgs(commandId, commandArgs);
      yeomanUi["executeCommand"](commandId, commandArgs);
    });
  });

  describe("showProgress", () => {
    it("called with message parameter ---> call showProgress event with the parameter", () => {
      const message = "Project Test is generating";
      youiEventsMock.expects("showProgress").withExactArgs(message);
      yeomanUi.showProgress(message);
    });

    it("called without message parameter ---> call showProgress event with no parameter", () => {
      youiEventsMock.expects("showProgress").withExactArgs(undefined);
      yeomanUi.showProgress();
    });
  });

  it("getState", async () => {
    const result = await yeomanUi["getState"]();
    expect(result.messages).to.be.deep.equal(messages);
  });

  it("_notifyGeneratorsChange", async () => {
    envUtilsMock.expects("getGeneratorsMeta");
    rpcMock.expects("invoke").withArgs("updateGeneratorsPrompt");
    _.set(vscode, "workspace.workspaceFolders[0].uri.fsPath", undefined);
    await yeomanUi._notifyGeneratorsChange();
  });

  describe("_notifyGeneratorsInstall", () => {
    it("called without args parameter or args = undefined", async () => {
      rpcMock.expects("invoke").withExactArgs("isGeneratorsPrompt").never();
      await yeomanUi._notifyGeneratorsInstall(undefined, false);
      expect(yeomanUi["uiOptions"].installGens).to.be.undefined;
    });
    it("called with empty args array (install ended) and the prompt is generators", async () => {
      const args: any = [];
      rpcMock.expects("invoke").withExactArgs("isGeneratorsPrompt").resolves(true);
      youiEventsMock.expects("getAppWizard").returns(appWizard);
      appWizardMock
        .expects("showInformation")
        .withExactArgs(yeomanUi["uiOptions"].messages.all_generators_have_been_installed, MessageType.prompt);
      appWizardMock.expects("showWarning").never();
      await yeomanUi._notifyGeneratorsInstall(args, false);
      expect(yeomanUi["uiOptions"].installGens).to.be.undefined;
    });
    it("called with args array containing generators (install started) and the prompt is generators", async () => {
      const args = [
        {
          name: "@sap/generator-mine",
          versionRange: "2.0.1",
        },
        {
          name: "generator-java-thing",
          versionRange: "*",
        },
        {
          name: "@sap/generator-my-second",
          versionRange: "^2.0.1",
        },
      ];
      rpcMock.expects("invoke").withExactArgs("isGeneratorsPrompt").resolves(true);
      youiEventsMock.expects("getAppWizard").returns(appWizard);
      appWizardMock
        .expects("showWarning")
        .withExactArgs(yeomanUi["uiOptions"].messages.generators_are_being_installed, MessageType.prompt);
      appWizardMock.expects("showInformation").never();
      await yeomanUi._notifyGeneratorsInstall(args, false);
      expect(yeomanUi["uiOptions"].installGens).to.be.deep.equal(args);
    });
    it("called with args array containing generators (install started) and force update (webview ready)", async () => {
      const args = [
        {
          name: "@sap/generator-mine",
          versionRange: "2.0.1",
        },
        {
          name: "generator-java-thing",
          versionRange: "*",
        },
        {
          name: "@sap/generator-my-second",
          versionRange: "^2.0.1",
        },
      ];
      rpcMock.expects("invoke").withExactArgs("isGeneratorsPrompt").resolves(false);
      youiEventsMock.expects("getAppWizard").returns(appWizard);
      appWizardMock
        .expects("showWarning")
        .withExactArgs(yeomanUi["uiOptions"].messages.generators_are_being_installed, MessageType.prompt);
      appWizardMock.expects("showInformation").never();
      await yeomanUi._notifyGeneratorsInstall(args, true);
      expect(yeomanUi["uiOptions"].installGens).to.be.deep.equal(args);
    });
    it("called with args array containing generators (install started) and the prompt is not generators", async () => {
      const args = [
        {
          name: "@sap/generator-mine",
          versionRange: "2.0.1",
        },
        {
          name: "generator-java-thing",
          versionRange: "*",
        },
        {
          name: "@sap/generator-my-second",
          versionRange: "^2.0.1",
        },
      ];
      rpcMock.expects("invoke").withExactArgs("isGeneratorsPrompt").resolves(false);
      youiEventsMock.expects("getAppWizard").never();
      appWizardMock.expects("showInformation").never();
      await yeomanUi._notifyGeneratorsInstall(args, false);
      expect(yeomanUi["uiOptions"].installGens).to.be.deep.equal(args);
    });
  });

  describe("showGeneratorsInstallingMessage", () => {
    it("called with empty args array (install ended)", () => {
      youiEventsMock.expects("getAppWizard").returns(appWizard);
      appWizardMock
        .expects("showInformation")
        .withExactArgs(yeomanUi["uiOptions"].messages.all_generators_have_been_installed, MessageType.prompt);
      appWizardMock.expects("showWarning").never();
      yeomanUi["showGeneratorsInstallingMessage"]([]);
    });
    it("called with args array containing generators (install started)", () => {
      youiEventsMock.expects("getAppWizard").returns(appWizard);
      appWizardMock
        .expects("showWarning")
        .withExactArgs(yeomanUi["uiOptions"].messages.generators_are_being_installed, MessageType.prompt);
      appWizardMock.expects("showInformation").never();
      yeomanUi["showGeneratorsInstallingMessage"]([{}]);
    });
  });

  describe("getGeneratorsPrompt", () => {
    const gensMeta = [
      {
        generatorPath: "test1Path/app/index.js",
        namespace: "test1-project:app",
        packagePath: "test1Path",
      },
      {
        generatorPath: "test2Path/app/index.js",
        namespace: "test2-module:app",
        packagePath: "test2Path",
      },
      {
        generatorPath: "test3Path/app/index.js",
        namespace: "test3:app",
        packagePath: "test3Path",
      },
      {
        generatorPath: "test4Path/app/index.js",
        namespace: "test4:app",
        packagePath: "test4Path",
      },
      {
        generatorPath: "test5Path/app/index.js",
        namespace: "test5:app",
        packagePath: "test5Path",
      },
    ];

    it("there are no generators", async () => {
      envUtilsMock.expects("getGeneratorsMeta").returns(gensMeta);
      const result = await yeomanUi["getGeneratorsPrompt"]();
      const generatorQuestion: any = {
        type: "list",
        guiType: "tiles",
        guiOptions: {
          hint: yeomanUi["uiOptions"].messages.select_generator_question_hint,
        },
        name: "generator",
        message: yeomanUi["uiOptions"].messages.channel_name,
        choices: [],
      };
      expect(result).to.be.deep.equal({
        name: "Select Generator",
        questions: [generatorQuestion],
      });
    });

    it("get generators with type project", async () => {
      envUtilsMock.expects("getGeneratorsMeta").returns(gensMeta);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project_test"}}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "module"}}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project"}, "description": "test4Description"}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8)
        .resolves(`{"description": "test5Description"}`);
      wsConfigMock.expects("get").withExactArgs(yeomanUi["TARGET_FOLDER_CONFIG_PROP"]);
      const genFilter: GeneratorFilter = GeneratorFilter.create({
        type: "project",
      });
      yeomanUi["uiOptions"] = { filter: genFilter, messages };
      const result: any = await yeomanUi["getGeneratorsPrompt"]();

      const question = result.questions.find((question: { type: string }) => question.type === "list");
      expect(question.choices).to.have.lengthOf(2);
      const test1Choice = question.choices[0];
      const test2Choice = question.choices[1];
      expect(test1Choice.name).to.be.equal("Test1 Project");
      expect(test1Choice.description).to.be.equal("test1Description");
      expect(test2Choice.name).to.be.equal("Test4");
      expect(test2Choice.description).to.be.equal("test4Description");
    });

    it("get generators with type module", async () => {
      envUtilsMock.expects("getGeneratorsMeta").returns(gensMeta);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project_test"}}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "module"}}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project"}, "description": "test4Description"}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8)
        .resolves(`{"description": "test5Description"}`);
      const genFilter = GeneratorFilter.create({ type: "module" });
      yeomanUi["uiOptions"] = { filter: genFilter, messages };
      const result = await yeomanUi["getGeneratorsPrompt"]();

      expect(result.questions[0].choices).to.have.lengthOf(1);
      const test1Choice = result.questions[0].choices[0];
      expect(test1Choice.name).to.be.equal("Test3");
      expect(test1Choice.description).to.be.equal(choiceMessage);
    });

    it("get generators all generators", async () => {
      envUtilsMock.expects("getGeneratorsMeta").returns(gensMeta);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project_test"}}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "module"}}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "all"}, "description": "test4Description"}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8)
        .resolves(`{"description": "test5Description"}`);
      yeomanUi["uiOptions"] = {
        filter: GeneratorFilter.create({ type: [] }),
        messages,
      };
      const result = await yeomanUi["getGeneratorsPrompt"]();

      expect(result.questions[0].choices).to.have.lengthOf(5);
    });

    it("get generators with accessible package.json", async () => {
      envUtilsMock.expects("getGeneratorsMeta").returns(gensMeta);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8)
        .throws(new Error("test1Error"));
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8)
        .throws(new Error("test2Error"));
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "module"}}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project"}, "description": "test4Description"}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8)
        .resolves(`{"description": "test5Description"}`);
      yeomanUi["uiOptions"] = {
        filter: GeneratorFilter.create({ type: [] }),
        messages,
      };
      const result = await yeomanUi["getGeneratorsPrompt"]();

      expect(result.questions[0].choices).to.have.lengthOf(3);
    });

    it("wrong generators filter type is provided", async () => {
      envUtilsMock.expects("getGeneratorsMeta").returns([
        {
          generatorPath: "test1Path/app/index.js",
          namespace: "test1:app",
          packagePath: "test1Path",
        },
      ]);

      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project123"}, "description": "test4Description"}`);
      wsConfigMock.expects("get").withExactArgs(yeomanUi["TARGET_FOLDER_CONFIG_PROP"]);
      yeomanUi["uiOptions"] = {
        filter: GeneratorFilter.create({ type: "project" }),
        messages,
      };
      const result = await yeomanUi["getGeneratorsPrompt"]();

      const question = result.questions.find((question: { type: string }) => question.type === "list");
      expect(question.choices).to.be.empty;
    });

    it("get generators with type project and categories cat1 and cat2", async () => {
      envUtilsMock.expects("getGeneratorsMeta").returns(gensMeta);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8)
        .resolves(
          `{"generator-filter": {"type": ["project"], "categories": ["cat2"]}, "description": "test1Description"}`
        );
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project", "categories": ["cat2", "cat1"]}}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": ["module"]}}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8)
        .resolves(
          `{"generator-filter": {"type": "project", "categories": ["cat1"]}, "description": "test4Description"}`
        );
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8)
        .resolves(`{"description": "test5Description"}`);

      const genFilter: GeneratorFilter = GeneratorFilter.create({
        type: ["project"],
        categories: ["cat1", "cat2"],
      });
      yeomanUi["uiOptions"].filter = genFilter;
      wsConfigMock.expects("get").withExactArgs(yeomanUi["TARGET_FOLDER_CONFIG_PROP"]);
      const result = await yeomanUi["getGeneratorsPrompt"]();

      const question = result.questions.find((question: { type: string }) => question.type === "list");
      expect(question.choices).to.have.lengthOf(3);
      const test1Choice = question.choices[0];
      const test2Choice = question.choices[1];
      const test3Choice = question.choices[2];
      expect(test1Choice.name).to.be.equal("Test1 Project");
      expect(test2Choice.name).to.be.equal("Test2 Module");
      expect(test3Choice.name).to.be.equal("Test4");
    });

    it("get generators with displayName", async () => {
      envUtilsMock.expects("getGeneratorsMeta").returns(gensMeta.slice(0, 3));

      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "module"}}`);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8)
        .resolves(`{"description": "test3Description", "displayName": "3rd - Test"}`);
      yeomanUi["uiOptions"] = {
        filter: GeneratorFilter.create({ type: undefined }),
        messages,
      };
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
      envUtilsMock.expects("getGeneratorsMeta").returns(gensMeta.slice(0, 3));

      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8)
        .resolves(
          `{"generator-filter": {"type": "project"}, "description": "test1Description", "homepage": "https://myhomepage.com/ANY/generator-test1-project#readme"}`
        );
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8)
        .resolves(
          `{"generator-filter": {"type": "module"}, "homepage": "https://myhomepage.com/ANY/generator-test2-module#readme"}`
        );
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8)
        .resolves(`{"description": "test3Description"}`);
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

    it("generator with type project and YeomanUI.PROJECTS != currentPath", async () => {
      envUtilsMock.expects("getGeneratorsMeta").returns(gensMeta.slice(0, 1));
      _.set(vscode, "workspace.workspaceFolders", [
        { uri: { fsPath: "rootFolderPath" } },
        { uri: { fsPath: "testRoot" } },
      ]);

      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "project"}, "description": "test4Description"}`);

      yeomanUi["uiOptions"] = {
        filter: GeneratorFilter.create({ type: "project" }),
        messages,
      };
      wsConfigMock.expects("get").withExactArgs(yeomanUi["TARGET_FOLDER_CONFIG_PROP"]);
      wsConfigMock.expects("get").withExactArgs(yeomanUi["SELECTED_WORKSPACE_CONFIG_PROP"]);
      await yeomanUi["getGeneratorsPrompt"]();
      expect(yeomanUi["forceNewWorkspace"]).to.be.equals(false);
    });

    it("generator with type tools-suite", async () => {
      envUtilsMock.expects("getGeneratorsMeta").returns(gensMeta.slice(0, 1));
      _.set(vscode, "workspace.workspaceFolders", [
        { uri: { fsPath: "rootFolderPath" } },
        { uri: { fsPath: "testRoot" } },
      ]);
      wsConfigMock.expects("get").withExactArgs(yeomanUi["TARGET_FOLDER_CONFIG_PROP"]);
      wsConfigMock.expects("get").withExactArgs(yeomanUi["SELECTED_WORKSPACE_CONFIG_PROP"]);
      fsExtraMock
        .expects("readFile")
        .withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8)
        .resolves(`{"generator-filter": {"type": "tools-suite"}, "description": "test4Description"}`);

      yeomanUi["uiOptions"] = {
        filter: GeneratorFilter.create({ type: "project" }),
        messages,
      };
      await yeomanUi["getGeneratorsPrompt"]();
      expect(yeomanUi["forceNewWorkspace"]).to.be.equals(false);
      expect(yeomanUi["generaorsToIgnoreArray"]).to.be.contains("test1-project:app");
    });
  });

  describe("funcReplacer", () => {
    it("with function", () => {
      const res = YeomanUI["funcReplacer"]("key", () => {
        return;
      });
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
    const projectsPath = path.join(homedir(), "projects");
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
      const questions = [{ name: "q1", default: "a" }, { name: "q2", default: () => "b" }, { name: "q3" }];
      const answers = {
        q1: "x",
        q2: "y",
        q3: "z",
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

  it("handleErrors", () => {
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

  it("exploreGenerators", () => {
    const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {}, undefined);
    swaTrackerWrapperMock.expects("updateExploreAndInstallGeneratorsLinkClicked");
    commandsMock.expects("executeCommand").withExactArgs("exploreGenerators").resolves();
    yeomanUiInstance["exploreGenerators"]();
  });

  it("onGenInstall", () => {
    const yeomanUiInstance: YeomanUI = new YeomanUI(
      rpc,
      youiEvents,
      outputChannel,
      testLogger,
      GeneratorFilter.create(),
      undefined
    );
    const gen: any = { on: () => "" };
    const genMock = sandbox.mock(gen);

    genMock.expects("on").withArgs("method:install");
    yeomanUiInstance["onGenInstall"](gen);
    genMock.verify();
  });

  describe("showPrompt", () => {
    it("returns answers", async () => {
      const firstName = "john";
      rpc.invoke = (): Promise<unknown> => {
        return Promise.resolve({
          firstName,
          lastName: "doe",
        });
      };
      const yeomanUiInstance: YeomanUI = new YeomanUI(
        rpc,
        youiEvents,
        outputChannel,
        testLogger,
        GeneratorFilter.create(),
        undefined
      );
      const questions = [{ name: "q1" }];
      const response = await yeomanUiInstance.showPrompt(questions);
      expect(response.firstName).to.equal(firstName);
    });

    it("with back", async () => {
      const firstName = "john";
      const country = "denmark";

      (rpc.invoke as (methodName: string, params: any[]) => Promise<any>) = (
        methodName: string,
        params: any[]
      ): Promise<unknown> => {
        const questionName: string = params[0][0].name;
        if (questionName === "q1") {
          return Promise.resolve({
            firstName,
            lastName: "doe",
          });
        } else if (questionName === "q2") {
          return Promise.resolve({
            country,
          });
        }
      };
      const yeomanUiInstance: YeomanUI = new YeomanUI(
        rpc,
        youiEvents,
        outputChannel,
        testLogger,
        GeneratorFilter.create(),
        undefined
      );
      yeomanUiInstance["runGenerator"] = (): Promise<any> => {
        return Promise.resolve();
      };
      let questions = [{ name: "q1" }];
      let response = await yeomanUiInstance.showPrompt(questions);
      expect(response.firstName).to.equal(firstName);

      questions = [{ name: "q2" }];

      response = await yeomanUiInstance.showPrompt(questions);
      expect(response.country).to.equal(country);
      expect(yeomanUiInstance["replayUtils"]["isReplaying"]).to.be.false;

      swaTrackerWrapperMock.expects("updateOneOfPreviousStepsClicked").withArgs("");

      await yeomanUiInstance["back"](undefined, 1);
      expect(yeomanUiInstance["replayUtils"]["isReplaying"]).to.be.true;

      questions = [{ name: "q1" }];
      response = await yeomanUiInstance.showPrompt(questions);
      expect(response.firstName).to.equal(firstName);
    });
  });

  describe("onGeneratorSuccess - onGeneratorFailure", () => {
    let doGeneratorDoneSpy: any;
    const create_and_close = "Create the project and close it for future use";
    const open_in_new_ws = "Open the project in a new workspace";

    beforeEach(() => {
      doGeneratorDoneSpy = sandbox.spy(youiEvents, "doGeneratorDone");
    });

    afterEach(() => {
      doGeneratorDoneSpy.restore();
    });

    it("onGeneratorSuccess - one dir was created", () => {
      const beforeGen = {
        targetFolderPath: "testDestinationRoot",
        childDirs: ["dirparh1"],
      };
      const afterGen = {
        targetFolderPath: "testDestinationRoot",
        childDirs: ["dirparh1", "dirpath2"],
      };
      swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("testGenName", true, testLogger);
      yeomanUi["onGeneratorSuccess"]("testGenName", beforeGen, afterGen);
      expect(
        doGeneratorDoneSpy.calledWith(
          true,
          _.get(yeomanUi, "uiOptions.messages.artifact_with_name_generated")("testGenName"),
          create_and_close,
          "files",
          "dirpath2"
        )
      ).to.be.true;
    });

    it("onGeneratorSuccess - two dirs were created", () => {
      const beforeGen = {
        targetFolderPath: "testDestinationRoot",
        childDirs: ["dirparh1"],
      };
      const afterGen = {
        targetFolderPath: "testDestinationRoot",
        childDirs: ["dirparh1", "dirpath2", "dirpath3"],
      };
      swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("testGenName", true, testLogger);
      yeomanUi["onGeneratorSuccess"]("testGenName", beforeGen, afterGen);
      expect(
        doGeneratorDoneSpy.calledWith(
          true,
          _.get(yeomanUi, "uiOptions.messages.artifact_with_name_generated")("testGenName"),
          create_and_close,
          "files",
          null
        )
      ).to.be.true;
    });

    it("onGeneratorSuccess - zero dirs were created", () => {
      const beforeGen = {
        targetFolderPath: "testDestinationRoot",
        childDirs: ["dirparh1"],
      };
      const afterGen = {
        targetFolderPath: "testDestinationRoot",
        childDirs: ["dirparh1"],
      };
      swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("testGenName", true, testLogger);
      yeomanUi["onGeneratorSuccess"]("testGenName", beforeGen, afterGen);
      expect(
        doGeneratorDoneSpy.calledWith(
          true,
          _.get(yeomanUi, "uiOptions.messages.artifact_with_name_generated")("testGenName"),
          create_and_close,
          "files",
          null
        )
      ).to.be.true;
    });

    it("onGeneratorSuccess - targetFolderPath was changed by generator", () => {
      const beforeGen = { targetFolderPath: "testDestinationRoot" };
      const afterGen = {
        targetFolderPath: "testDestinationRoot/generatedProject",
      };
      swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("testGenName", true, testLogger);
      yeomanUi["onGeneratorSuccess"]("testGenName", beforeGen, afterGen);
      expect(
        doGeneratorDoneSpy.calledWith(
          true,
          _.get(yeomanUi, "uiOptions.messages.artifact_with_name_generated")("testGenName"),
          create_and_close,
          "files",
          "testDestinationRoot/generatedProject"
        )
      ).to.be.true;
    });

    it("onGeneratorFailure", () => {
      swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("testGenName", false, testLogger);
      yeomanUi["onGeneratorFailure"]("testGenName", "testError");
      expect(
        doGeneratorDoneSpy.calledWith(false, `{"message":"testGenName generator failed - testError"}`, "", "files")
      ).to.be.true;
    });

    it("onGeneratorSuccess - generator type is project", () => {
      yeomanUi["typesMap"].clear();
      yeomanUi["typesMap"].set("foodq:app", "project");
      const beforeGen = { targetFolderPath: "testDestinationRoot" };
      const afterGen = {
        targetFolderPath: "testDestinationRoot/generatedProject",
      };
      swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("foodq:app", true, testLogger);
      yeomanUi["forceNewWorkspace"] = true;
      yeomanUi["onGeneratorSuccess"]("foodq:app", beforeGen, afterGen);
      expect(
        doGeneratorDoneSpy.calledWith(
          true,
          _.get(yeomanUi, "uiOptions.messages.artifact_with_name_generated")("foodq:app"),
          open_in_new_ws,
          "project",
          "testDestinationRoot/generatedProject"
        )
      ).to.be.true;
    });

    it("onGeneratorSuccess - Fiori generator with type project and type tools-suite", () => {
      yeomanUi["typesMap"].clear();
      yeomanUi["typesMap"].set("fiori-generator:app", "project");
      yeomanUi["generaorsToIgnoreArray"].push("fiori-generator:app");
      const beforeGen = { targetFolderPath: "testDestinationRoot" };
      const afterGen = {
        targetFolderPath: "testDestinationRoot/generatedProject",
      };
      swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("fiori-generator:app", true, testLogger);
      yeomanUi["forceNewWorkspace"] = true;
      yeomanUi["onGeneratorSuccess"]("fiori-generator:app", beforeGen, afterGen);
      expect(
        doGeneratorDoneSpy.calledWith(
          true,
          _.get(yeomanUi, "uiOptions.messages.artifact_with_name_generated")("fiori-generator:app"),
          create_and_close,
          "project",
          "testDestinationRoot/generatedProject"
        )
      ).to.be.true;
    });
  });

  describe("Custom Question Event Handlers", () => {
    it("addCustomQuestionEventHandlers()", () => {
      const testEventFunction = () => {
        return true;
      };
      const questions = [
        {
          name: "q1",
          guiType: "questionType",
        },
      ];
      const yeomanUiInstance: YeomanUI = new YeomanUI(
        rpc,
        youiEvents,
        outputChannel,
        testLogger,
        GeneratorFilter.create(),
        undefined
      );

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
      const yeomanUiInstance: YeomanUI = new YeomanUI(
        rpc,
        youiEvents,
        outputChannel,
        testLogger,
        GeneratorFilter.create(),
        undefined
      );
      yeomanUiInstance.registerCustomQuestionEventHandler("questionType", "testEvent", testEventFunction);
      yeomanUiInstance["currentQuestions"] = [{ name: "question1", guiType: "questionType" }];
      const response = await yeomanUiInstance["evaluateMethod"](null, "question1", "testEvent");
      expect(response).to.be.true;
    });

    it("question method is called", async () => {
      const yeomanUiInstance: YeomanUI = new YeomanUI(
        rpc,
        youiEvents,
        outputChannel,
        testLogger,
        GeneratorFilter.create(),
        undefined
      );
      yeomanUiInstance["currentQuestions"] = [
        {
          name: "question1",
          method1: () => {
            return true;
          },
        },
      ];
      const response = await yeomanUiInstance["evaluateMethod"](null, "question1", "method1");
      expect(response).to.be.true;
    });

    it("no questions", async () => {
      const yeomanUiInstance: YeomanUI = new YeomanUI(
        rpc,
        youiEvents,
        outputChannel,
        testLogger,
        GeneratorFilter.create(),
        undefined
      );
      const response = await yeomanUiInstance["evaluateMethod"](null, "question1", "method1");
      expect(response).to.be.undefined;
    });

    it("method throws exception", async () => {
      const yeomanUiInstance: YeomanUI = new YeomanUI(
        rpc,
        youiEvents,
        outputChannel,
        testLogger,
        GeneratorFilter.create(),
        undefined
      );
      yeomanUiInstance["gen"] = Object.create({});
      yeomanUiInstance["gen"].options = {};
      yeomanUiInstance["currentQuestions"] = [
        {
          name: "question1",
          method1: () => {
            throw new Error("Error");
          },
        },
      ];
      swaTrackerWrapperMock.expects("updateGeneratorEnded").withArgs("", false);
      try {
        await yeomanUiInstance["evaluateMethod"](null, "question1", "method1");
      } catch (e) {
        expect(e.toString()).to.contain("method1");
      }
    });

    it("currentQuestions is undefined", async () => {
      const yeomanUiInstance: YeomanUI = new YeomanUI(
        rpc,
        youiEvents,
        outputChannel,
        testLogger,
        GeneratorFilter.create(),
        undefined
      );
      yeomanUiInstance["gen"] = Object.create({});
      yeomanUiInstance["gen"].options = {};
      yeomanUiInstance["currentQuestions"] = undefined;
      try {
        await yeomanUiInstance["evaluateMethod"](null, "question1", "method1");
      } catch (e) {
        expect(e.toString()).to.contain("method1");
      }
    });
  });
});
