import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import * as extension from "../src/extension";
import { ExtCommands } from "../src/extCommands";
import * as loggerWrapper from "../src/logger/logger-wrapper";
import { SWA } from "../src/swa-tracker/swa-tracker-wrapper";
import * as shellJsWorkarounds from "../src/utils/shellJsWorkarounds";

describe("extension unit test", () => {
  let sandbox: SinonSandbox;
  let extCommandsMock: SinonMock;
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
    extCommandsMock = sandbox.mock(ExtCommands);
  });

  afterEach(() => {
    loggerWrapperMock.verify();
    swaTrackerWrapperMock.verify();
    extCommandsMock.verify();
  });

  describe("activate", () => {
    it("commands registration", () => {
      loggerWrapperMock.expects("createExtensionLoggerAndSubscribeToLogSettingsChanges");
      loggerWrapperMock.expects("getLogger");
      swaTrackerWrapperMock.expects("createSWATracker");

      const applySpy = sandbox.spy(shellJsWorkarounds, "apply");
      extCommandsMock.expects("registerAndSubscribeCommands").withExactArgs(testContext);

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
      extension.activate(null);
    });
  });
});
