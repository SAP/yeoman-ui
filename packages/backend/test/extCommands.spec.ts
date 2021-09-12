import { vscode } from "./mockUtil";
import { get } from "lodash";
import * as loggerWrapper from "../src/logger/logger-wrapper";
import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import { ExtCommands } from "../src/extCommands";
import * as flowPromise from "../src/utils/promise";
import * as fs from "fs";

describe("extension commands unit test", () => {
  let sandbox: SinonSandbox;
  let commandsMock: SinonMock;
  let windowMock: SinonMock;
  let workspaceMock: SinonMock;
  let loggerWrapperMock: SinonMock;
  let fsMock: SinonMock;
  let flowPromiseMock: SinonMock;

  const testContext: any = {
    subscriptions: [],
    extensionPath: "testExtensionpath",
  };

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    workspaceMock = sandbox.mock(vscode.workspace);
    commandsMock = sandbox.mock(vscode.commands);
    windowMock = sandbox.mock(vscode.window);
    loggerWrapperMock = sandbox.mock(loggerWrapper);
    fsMock = sandbox.mock(fs);
    flowPromiseMock = sandbox.mock(flowPromise);
  });

  afterEach(() => {
    commandsMock.verify();
    windowMock.verify();
    loggerWrapperMock.verify();
    workspaceMock.verify();
    fsMock.verify();
    flowPromiseMock.verify();
  });

  it("registerAndSubscribeCommands", () => {
    const oRegisteredCommands: any = vscode.commands.getCommands();

    ExtCommands.registerAndSubscribeCommands(testContext);

    expect(get(oRegisteredCommands, "loadYeomanUI")).to.be.not.undefined;
    expect(get(oRegisteredCommands, "yeomanUI.toggleOutput")).to.be.not.undefined;
    expect(get(oRegisteredCommands, "exploreGenerators")).to.be.not.undefined;
    expect(get(oRegisteredCommands, "yeomanUI._notifyGeneratorsChange")).to.be.not.undefined;
    expect(get(oRegisteredCommands, "runGenerator")).to.be.not.undefined;
  });

  it("yeomanUIPanel_runGeneratorCommand", async () => {
    ExtCommands["context"] = testContext;

    loggerWrapperMock.expects("getClassLogger");
    windowMock.expects("registerWebviewPanelSerializer").withArgs("yeomanui");
    windowMock.expects("showQuickPick");
    workspaceMock.expects("getConfiguration").returns({ get: () => "", set: () => "" });

    const res = await ExtCommands["yeomanUIPanel_runGeneratorCommand"]();

    expect(res).to.be.undefined;
  });

  it("call loadWebviewPanel, toggleOutput and notifyGeneratorsChange commands", async () => {
    ExtCommands["context"] = testContext;
    ExtCommands["yeomanUIPanel"] = undefined;

    // mocked methods called by YeomanUIPanel.loadWebviewPanel
    loggerWrapperMock.expects("getClassLogger").twice();
    loggerWrapperMock.expects("getWebviewRpcLibraryLogger");
    windowMock.expects("registerWebviewPanelSerializer").withArgs("yeomanui");
    windowMock.expects("createWebviewPanel").returns({
      dispose: () => "",
      onDidDispose: () => "",
      onDidChangeViewState: () => "",
      webview: { onDidReceiveMessage: () => "" },
    });
    windowMock.expects("createOutputChannel").returns({ show: () => "" });
    fsMock.expects("readFileSync");
    commandsMock.expects("executeCommand").withArgs("setContext").resolves();
    flowPromiseMock.expects("createFlowPromise").returns({ undefined });

    // yeomanUIPanel is undefined
    await ExtCommands["yeomanUIPanel_loadYeomanUI_Command"]();

    await ExtCommands["yeomanUIPanel_toggleOutput_Command"]();

    await ExtCommands["yeomanUIPanel_notifyGeneratorsChange_Command"]();
  });

  it.skip("exploreGenerators_Command", async () => {
    ExtCommands["context"] = testContext;
    ExtCommands["exploreGensPanel"] = undefined;

    // mocked methods called by ExploreGensPanel.loadWebviewPanel
    loggerWrapperMock.expects("getClassLogger").twice();
    windowMock.expects("registerWebviewPanelSerializer").withArgs("exploreGens");
    windowMock.expects("createWebviewPanel").returns({
      onDidDispose: () => "",
      onDidChangeViewState: () => "",
      webview: { onDidReceiveMessage: () => "" },
    });
    loggerWrapperMock.expects("getWebviewRpcLibraryLogger");
    fsMock.expects("openSync").returns(null);
    fsMock.expects("readFileSync").returns("");

    //windowMock.expects("createOutputChannel").returns({});
    //
    // commandsMock.expects("executeCommand").withArgs("setContext").resolves();
    // flowPromiseMock.expects("createFlowPromise").returns({undefined});

    // exploreGensPanel is undefined
    await ExtCommands["exploreGenerators_Command"]();
  });
});
