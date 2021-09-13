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

    new ExtCommands(testContext).registerAndSubscribeCommands();

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
    const extCommands = new ExtCommands(testContext);
    extCommands["exploreGensPanel"] = exploreGensPanelMock;

    const loadWebviewPanelSpy = sandbox.spy(exploreGensPanelMock, "loadWebviewPanel");

    await extCommands["exploreGenerators_Command"]();

    expect(loadWebviewPanelSpy.called).to.be.true;
  });

  it("call YeomanUIPanel commands", async () => {
    const yeomanUIPanelMock = {
      runGenerator: () => "",
      loadWebviewPanel: () => "",
      toggleOutput: () => "",
      notifyGeneratorsChange: () => "",
    };

    const extCommands = new ExtCommands(testContext);
    extCommands["yeomanUIPanel"] = yeomanUIPanelMock;

    const runGeneratorSpy = sandbox.spy(yeomanUIPanelMock, "runGenerator");
    const loadWebviewPanelSpy = sandbox.spy(yeomanUIPanelMock, "loadWebviewPanel");
    const toggleOutputSpy = sandbox.spy(yeomanUIPanelMock, "toggleOutput");
    const notifyGeneratorsChangeSpy = sandbox.spy(yeomanUIPanelMock, "notifyGeneratorsChange");

    await extCommands["yeomanUIPanel_loadYeomanUI_Command"]();
    await extCommands["yeomanUIPanel_toggleOutput_Command"]();
    await extCommands["yeomanUIPanel_notifyGeneratorsChange_Command"]();
    await extCommands["yeomanUIPanel_runGenerator_Command"]();

    expect(runGeneratorSpy.called).to.be.true;
    expect(loadWebviewPanelSpy.called).to.be.true;
    expect(toggleOutputSpy.called).to.be.true;
    expect(notifyGeneratorsChangeSpy.called).to.be.true;
  });

  it("getYeomanUIPanel", async () => {
    const extCommands = new ExtCommands(testContext);
    extCommands["yeomanUIPanel"] = undefined;

    loggerWrapperMock.expects("getClassLogger");
    // windowMock.expects("registerWebviewPanelSerializer").withArgs("yeomanui");

    // yeomanUIPanel is undefined
    const yeomanUIPanel_firstTime = await extCommands["getYeomanUIPanel"]();
    // yeomanUIPanel should be already defined
    const yeomanUIPanel_secondTime = await extCommands["getYeomanUIPanel"]();

    expect(yeomanUIPanel_firstTime).to.be.equal(yeomanUIPanel_secondTime);
  });

  it("getExploreGensPanel", async () => {
    const extCommands = new ExtCommands(testContext);
    extCommands["exploreGensPanel"] = undefined;

    loggerWrapperMock.expects("getClassLogger");
    // windowMock.expects("registerWebviewPanelSerializer").withArgs("exploreGens");

    // exploreGensPanel is undefined
    const exploreGensPanel_firstTime = await extCommands["getExploreGensPanel"]();
    // exploreGensPanel should be already defined
    const exploreGensPanel_secondTime = await extCommands["getExploreGensPanel"]();

    expect(exploreGensPanel_firstTime).to.be.equal(exploreGensPanel_secondTime);
  });
});
