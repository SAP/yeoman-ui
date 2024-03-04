import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import * as extension from "../src/extension";
import { ExtCommands } from "../src/extCommands";
import * as loggerWrapper from "../src/logger/logger-wrapper";
import { AnalyticsWrapper } from "../src/usage-report/usage-analytics-wrapper";
import * as shellJsWorkarounds from "../src/utils/shellJsWorkarounds";
import { vscode } from "./mockUtil";
import { ExtensionContext } from "vscode";

describe("extension unit test", () => {
  let sandbox: SinonSandbox;
  let extCommandsMock: SinonMock;
  let loggerWrapperMock: SinonMock;
  let windowMock: SinonMock;
  let trackerWrapperMock: SinonMock;
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
    trackerWrapperMock = sandbox.mock(AnalyticsWrapper);
    extCommandsMock = sandbox.mock(ExtCommands);
    windowMock = sandbox.mock(vscode.window);
  });

  afterEach(() => {
    loggerWrapperMock.verify();
    trackerWrapperMock.verify();
    extCommandsMock.verify();
    windowMock.verify();
  });

  describe("activate", () => {
    it("commands registration", () => {
      loggerWrapperMock.expects("createExtensionLoggerAndSubscribeToLogSettingsChanges");
      loggerWrapperMock.expects("getLogger");
      trackerWrapperMock.expects("createTracker");

      const applySpy = sandbox.spy(shellJsWorkarounds, "apply");
      windowMock.expects("registerWebviewPanelSerializer").withArgs("yeomanui");
      windowMock.expects("registerWebviewPanelSerializer").withArgs("exploreGens");

      extension.activate(testContext);

      expect(applySpy.calledOnce).to.be.true;
      applySpy.restore();
    });

    it("logger failure on extenion activation", () => {
      const consoleMock = sandbox.mock(console);
      loggerWrapperMock
        .expects("createExtensionLoggerAndSubscribeToLogSettingsChanges")
        .throws(new Error("activation error"));
      consoleMock.expects("error").withExactArgs("Extension activation failed.", "activation error");
      extension.activate(testContext);
    });
  });

  it("deactivate", () => {
    extension.deactivate();
  });
});
