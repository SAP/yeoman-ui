import { vscode } from "./mockUtil";

import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import * as _ from "lodash";
import * as extension from "../src/extension";
import * as loggerWrapper from "../src/logger/logger-wrapper";
import { SWA } from "../src/swa-tracker/swa-tracker-wrapper";
import * as shellJsWorkarounds from "../src/utils/shellJsWorkarounds";

describe.skip("extension unit test", () => {
  let sandbox: SinonSandbox;
  let commandsMock: SinonMock;
  let windowMock: SinonMock;
  let loggerWrapperMock: SinonMock;
  let swaTrackerWrapperMock: SinonMock;
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
    loggerWrapperMock = sandbox.mock(loggerWrapper);
    swaTrackerWrapperMock = sandbox.mock(SWA);
    commandsMock = sandbox.mock(vscode.commands);
    windowMock = sandbox.mock(vscode.window);
  });

  afterEach(() => {
    loggerWrapperMock.verify();
    swaTrackerWrapperMock.verify();
    commandsMock.verify();
    windowMock.verify();
  });

  describe("activate", () => {
    it("commands registration", () => {
      loggerWrapperMock.expects("createExtensionLoggerAndSubscribeToLogSettingsChanges");
      loggerWrapperMock.expects("getLogger");
      //loggerWrapperMock.expects("getClassLogger").twice();
      swaTrackerWrapperMock.expects("createSWATracker");
      // windowMock.expects("registerWebviewPanelSerializer").withArgs("yeomanui");
      // windowMock.expects("registerWebviewPanelSerializer").withArgs("exploreGens");

      const applySpy = sandbox.spy(shellJsWorkarounds, "apply");

      extension.activate(testContext);

      expect(applySpy.calledOnce).to.be.true;
      applySpy.restore();

      const oRegisteredCommands = vscode.commands.getCommands();
      expect(_.get(oRegisteredCommands, "loadYeomanUI")).to.be.not.undefined;
      expect(_.get(oRegisteredCommands, "yeomanUI.toggleOutput")).to.be.not.undefined;
      expect(_.get(oRegisteredCommands, "exploreGenerators")).to.be.not.undefined;
      expect(_.get(oRegisteredCommands, "yeomanUI._notifyGeneratorsChange")).to.be.not.undefined;
    });

    it("logger failure on extenion activation", () => {
      const consoleMock = sandbox.mock(console);
      loggerWrapperMock
        .expects("createExtensionLoggerAndSubscribeToLogSettingsChanges")
        .throws(new Error("activation error"));
      consoleMock.expects("error").withExactArgs("Extension activation failed.", "activation error");
      extension.activate(null);
    });
  });
});
