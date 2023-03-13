import { vscode } from "./mockUtil";
import { get } from "lodash";
import * as loggerWrapper from "../src/logger/logger-wrapper";
import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import { ExtCommands } from "../src/extCommands";
import { YeomanUIPanel } from "../src/panels/YeomanUIPanel";

describe("extension commands unit test", () => {
  let sandbox: SinonSandbox;
  let windowMock: SinonMock;
  let loggerWrapperMock: SinonMock;

  const testContext: any = {
    subscriptions: [],
    extensionPath: "testExtensionpath",
  };

  const yeomanUIPanelMock = <YeomanUIPanel>(<unknown>{
    runGenerator: () => "",
    loadWebviewPanel: () => "",
    toggleOutput: () => "",
    notifyGeneratorsChange: () => "",
  });

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    windowMock = sandbox.mock(vscode.window);
    loggerWrapperMock = sandbox.mock(loggerWrapper);
    // sandbox.mock(vscode.EventEmitter);
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
    const extCommands = new ExtCommands(testContext);
    const extCommandsMock = sandbox.mock(extCommands);
    // used for 'notifyGeneratorsChange' test
    extCommands["yeomanUIPanels"] = [yeomanUIPanelMock, yeomanUIPanelMock];
    extCommandsMock.expects("getYeomanUIPanel").twice().resolves(yeomanUIPanelMock);
    extCommandsMock.expects("getActiveYeomanUIPanel").once().returns(yeomanUIPanelMock);

    const runGeneratorSpy = sandbox.spy(yeomanUIPanelMock, "runGenerator");
    const loadWebviewPanelSpy = sandbox.spy(yeomanUIPanelMock, "loadWebviewPanel");
    const toggleOutputSpy = sandbox.spy(yeomanUIPanelMock, "toggleOutput");
    const notifyGeneratorsChangeSpy = sandbox.spy(yeomanUIPanelMock, "notifyGeneratorsChange");

    await extCommands["yeomanUIPanel_runGenerator_Command"]();
    await extCommands["yeomanUIPanel_loadYeomanUI_Command"]();
    extCommands["yeomanUIPanel_toggleOutput_Command"]();
    extCommands["yeomanUIPanel_notifyGeneratorsChange_Command"]();

    expect(runGeneratorSpy.called).to.be.true;
    expect(loadWebviewPanelSpy.called).to.be.true;
    expect(toggleOutputSpy.called).to.be.true;
    expect(notifyGeneratorsChangeSpy.calledTwice).to.be.true;

    extCommandsMock.verify();
  });

  it.only("getYeomanUIPanel", async () => {
    const extCommands = new ExtCommands(testContext);
    extCommands["yeomanUIPanels"] = [];
    // const ttt = createStubInstance(vscode.EventEmitter);
    // ttt.expects('event').returns(class YeomanUIPanel { });
    loggerWrapperMock.expects("getClassLogger");

    const yeomanUIPanel = await extCommands.getYeomanUIPanel();

    expect(yeomanUIPanel).to.be.instanceOf(YeomanUIPanel);
    expect(extCommands["yeomanUIPanels"]).to.be.lengthOf(1);
    expect(yeomanUIPanel).to.be.equal(extCommands["yeomanUIPanels"][0]);
  });

  it("getActiveYeomanUIPanel", () => {
    const activeVisiblePanel = <YeomanUIPanel>(<unknown>{
      ...yeomanUIPanelMock,
      webViewPanel: { active: true, visible: true },
    });

    const extCommands = new ExtCommands(testContext);
    extCommands["yeomanUIPanels"] = [activeVisiblePanel];

    const panel = extCommands["getActiveYeomanUIPanel"]();

    expect(activeVisiblePanel).to.be.equal(panel);
  });

  it("getActiveYeomanUIPanel - should return undefined when invisible", () => {
    const invisiblePanel = <YeomanUIPanel>(<unknown>{
      ...yeomanUIPanelMock,
      webViewPanel: { active: true, visible: false },
    });

    const extCommands = new ExtCommands(testContext);
    extCommands["yeomanUIPanels"] = [invisiblePanel];

    const activeYeomanUIPanel = extCommands["getActiveYeomanUIPanel"]();

    expect(activeYeomanUIPanel).to.be.undefined;
  });

  it("getActiveYeomanUIPanel -  should return undefined when no webViewPanel", () => {
    const extCommands = new ExtCommands(testContext);
    extCommands["yeomanUIPanels"] = [yeomanUIPanelMock];

    const activeYeomanUIPanel = extCommands["getActiveYeomanUIPanel"]();

    expect(activeYeomanUIPanel).to.be.undefined;
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
