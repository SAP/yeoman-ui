import { vscode } from "./mockUtil";
import { get } from "lodash";
import * as loggerWrapper from "../src/logger/logger-wrapper";
import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import { ExtCommands } from "../src/extCommands";

describe("extension commands unit test", () => {
  let sandbox: SinonSandbox;
  let windowMock: SinonMock;
  let loggerWrapperMock: SinonMock;

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
    windowMock = sandbox.mock(vscode.window);
    loggerWrapperMock = sandbox.mock(loggerWrapper);
  });

  afterEach(() => {
    windowMock.verify();
    loggerWrapperMock.verify();
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

  it("call ExploreGensPanel commands", async () => {
    const exploreGensPanelMock = {
      loadWebviewPanel: () => "",
    };

    ExtCommands["exploreGensPanel"] = exploreGensPanelMock;

    const loadWebviewPanelSpy = sandbox.spy(exploreGensPanelMock, "loadWebviewPanel");

    await ExtCommands["exploreGenerators_Command"]();

    expect(loadWebviewPanelSpy.called).to.be.true;
  });

  it("call YeomanUIPanel commands", async () => {
    const yeomanUIPanelMock = {
      runGenerator: () => "",
      loadWebviewPanel: () => "",
      toggleOutput: () => "",
      notifyGeneratorsChange: () => "",
    };

    ExtCommands["yeomanUIPanel"] = yeomanUIPanelMock;

    const runGeneratorSpy = sandbox.spy(yeomanUIPanelMock, "runGenerator");
    const loadWebviewPanelSpy = sandbox.spy(yeomanUIPanelMock, "loadWebviewPanel");
    const toggleOutputSpy = sandbox.spy(yeomanUIPanelMock, "toggleOutput");
    const notifyGeneratorsChangeSpy = sandbox.spy(yeomanUIPanelMock, "notifyGeneratorsChange");

    await ExtCommands["yeomanUIPanel_loadYeomanUI_Command"]();
    await ExtCommands["yeomanUIPanel_toggleOutput_Command"]();
    await ExtCommands["yeomanUIPanel_notifyGeneratorsChange_Command"]();
    await ExtCommands["yeomanUIPanel_runGenerator_Command"]();

    expect(runGeneratorSpy.called).to.be.true;
    expect(loadWebviewPanelSpy.called).to.be.true;
    expect(toggleOutputSpy.called).to.be.true;
    expect(notifyGeneratorsChangeSpy.called).to.be.true;
  });

  it("getYeomanUIPanel", async () => {
    ExtCommands["context"] = testContext;
    ExtCommands["yeomanUIPanel"] = undefined;

    loggerWrapperMock.expects("getClassLogger");
    windowMock.expects("registerWebviewPanelSerializer").withArgs("yeomanui");

    // yeomanUIPanel is undefined
    const yeomanUIPanel_firstTime = await ExtCommands["getYeomanUIPanel"]();
    // yeomanUIPanel should be already defined
    const yeomanUIPanel_secondTime = await ExtCommands["getYeomanUIPanel"]();

    expect(yeomanUIPanel_firstTime).to.be.equal(yeomanUIPanel_secondTime);
  });

  it("getExploreGensPanel", async () => {
    ExtCommands["context"] = testContext;
    ExtCommands["exploreGensPanel"] = undefined;

    loggerWrapperMock.expects("getClassLogger");
    windowMock.expects("registerWebviewPanelSerializer").withArgs("exploreGens");

    // exploreGensPanel is undefined
    const exploreGensPanel_firstTime = await ExtCommands["getExploreGensPanel"]();
    // exploreGensPanel should be already defined
    const exploreGensPanel_secondTime = await ExtCommands["getExploreGensPanel"]();

    expect(exploreGensPanel_firstTime).to.be.equal(exploreGensPanel_secondTime);
  });
});
