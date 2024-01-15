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

  it("call YeomanUIPanel commands - when yeomanUIPanel is in invalid state", async () => {
    const yeomanUIPanelMock = {
      runGenerator: () => "",
      loadWebviewPanel: () => "",
      toggleOutput: () => "",
      notifyGeneratorsChange: () => "",
    };

    const extCommands = new ExtCommands(testContext);
    sandbox.stub(extCommands, "getYeomanUIPanel").callsFake((verifyEmptyState = true) => {
      if (verifyEmptyState) {
        throw new Error("yeomanUIPanel is in invalid state");
      }
      return Promise.resolve(yeomanUIPanelMock);
    });

    const runGeneratorSpy = sandbox.spy(yeomanUIPanelMock, "runGenerator");
    const loadWebviewPanelSpy = sandbox.spy(yeomanUIPanelMock, "loadWebviewPanel");
    const toggleOutputSpy = sandbox.spy(yeomanUIPanelMock, "toggleOutput");
    const notifyGeneratorsChangeSpy = sandbox.spy(yeomanUIPanelMock, "notifyGeneratorsChange");

    await extCommands["yeomanUIPanel_loadYeomanUI_Command"]();
    await extCommands["yeomanUIPanel_toggleOutput_Command"]();
    await extCommands["yeomanUIPanel_notifyGeneratorsChange_Command"]();
    await extCommands["yeomanUIPanel_runGenerator_Command"]();

    expect(runGeneratorSpy.called).to.be.false;
    expect(loadWebviewPanelSpy.called).to.be.false;
    expect(toggleOutputSpy.called).to.be.true;
    expect(notifyGeneratorsChangeSpy.called).to.be.true;
  });

  describe("getYeomanUIPanel", () => {
    const extCommands = new ExtCommands(testContext);

    it("getYeomanUIPanel - open twice, no generator loaded", async () => {
      extCommands["yeomanUIPanel"] = undefined;

      loggerWrapperMock.expects("getClassLogger");

      // yeomanUIPanel is undefined
      const yeomanUIPanel_firstTime = await extCommands["getYeomanUIPanel"]();
      // yeomanUIPanel should be already defined
      const yeomanUIPanel_secondTime = await extCommands["getYeomanUIPanel"]();

      expect(yeomanUIPanel_firstTime).to.be.equal(yeomanUIPanel_secondTime);
    });

    it("getYeomanUIPanel - there is generator running, answer 'Yes'", async () => {
      const mockYeomanui = { yeomanui: { generatorName: "test" } };
      extCommands["yeomanUIPanel"] = mockYeomanui;
      windowMock.expects("showWarningMessage").resolves("Yes");
      expect(await extCommands["getYeomanUIPanel"]()).be.equal(mockYeomanui);
    });

    it("getYeomanUIPanel - there is generator running, answer 'No'", async () => {
      const mockYeomanui = { yeomanui: { generatorName: "test" } };
      extCommands["yeomanUIPanel"] = mockYeomanui;
      windowMock.expects("showWarningMessage").resolves("No");
      try {
        await extCommands["getYeomanUIPanel"]();
      } catch (e) {
        expect(e instanceof Error).to.be.true;
      }
    });

    it("getYeomanUIPanel - there is generator running, canceled", async () => {
      const mockYeomanui = { yeomanui: { generatorName: "test" } };
      extCommands["yeomanUIPanel"] = mockYeomanui;
      windowMock.expects("showWarningMessage").resolves(undefined);
      try {
        await extCommands["getYeomanUIPanel"]();
      } catch (e) {
        expect(e instanceof Error).to.be.true;
      }
    });

    it("getYeomanUIPanel - skip verifing empty state", async () => {
      const mockYeomanui = { yeomanui: { generatorName: "test" } };
      extCommands["yeomanUIPanel"] = mockYeomanui;
      windowMock.expects("showWarningMessage").never();
      expect(await extCommands["getYeomanUIPanel"](false)).be.equal(mockYeomanui);
    });

    it("isInEmptyState - yeomanUIPanel is undefined", async () => {
      extCommands["yeomanUIPanel"] = undefined;
      expect(await extCommands["isInEmptyState"]()).to.be.true;
    });
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
