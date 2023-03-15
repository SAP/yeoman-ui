import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import * as sdk from "@sap/bas-sdk";
import { internal, notifyGeneratorsInstallationProgress } from "../../src/utils/generators-installation-progress";
import type { WebviewPanel } from "vscode";
import { expect } from "chai";
import { vscode } from "../mockUtil";
import messages from "../../src/messages";
import { YeomanUIPanel } from "../../src/panels/YeomanUIPanel";

describe("generators installation progress - unit test", () => {
  let sandbox: SinonSandbox;
  let sdkDevspaceMock: SinonMock;
  let mockYeomanUiPanel: SinonMock;
  let mockWebviewPanel: SinonMock;
  let windowMock: SinonMock;
  let disposeCB: Function;

  const objYeomanUiPanel: YeomanUIPanel = <YeomanUIPanel>(<any>{
    notifyGeneratorsChange: () => Promise.resolve(),
  });
  const objWebviewPanel: Partial<WebviewPanel> = {
    onDidDispose: (cb): any => {
      disposeCB = cb;
    },
  };

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    sdkDevspaceMock = sandbox.mock(sdk.devspace);
    mockYeomanUiPanel = sandbox.mock(objYeomanUiPanel);
    mockWebviewPanel = sandbox.mock(objWebviewPanel);
    windowMock = sandbox.mock(vscode.window);
  });

  afterEach(() => {
    sdkDevspaceMock.verify();
    mockYeomanUiPanel.verify();
    mockWebviewPanel.verify();
    windowMock.verify();

    // --- reset values:
    internal.retries = 0;
    internal.panelDisposed = false;
    disposeCB = undefined;
  });

  it("notifyGeneratorsInstallationProgress - all generators already installed", async () => {
    sdkDevspaceMock.expects("didBASGeneratorsFinishInstallation").once().resolves(true);
    await notifyGeneratorsInstallationProgress(objYeomanUiPanel, <WebviewPanel>objWebviewPanel);
    expect(internal.retries).equals(0);
  });

  it("notifyGeneratorsInstallationProgress - throw error", async () => {
    sdkDevspaceMock.expects("didBASGeneratorsFinishInstallation").once().rejects("failed to read installation file");
    try {
      await notifyGeneratorsInstallationProgress(objYeomanUiPanel, <WebviewPanel>objWebviewPanel);
    } catch (error) {
      expect(error).to.equal("failed to read installation file");
    }
    expect(internal.retries).equals(0);
  });

  it("notifyGeneratorsInstallationProgress - reach max retries", async () => {
    internal.DELAY_MS = 10;
    internal.MAX_RETRY = 3;

    sdkDevspaceMock.expects("didBASGeneratorsFinishInstallation").atMost(4).resolves(false);
    mockYeomanUiPanel.expects("notifyGeneratorsChange").withExactArgs(["installing generators"]).resolves();
    windowMock.expects("showErrorMessage").withExactArgs(messages.timeout_install_generators).resolves();

    await notifyGeneratorsInstallationProgress(objYeomanUiPanel, <WebviewPanel>objWebviewPanel);

    expect(internal.retries).equals(3);
  });

  it("notifyGeneratorsInstallationProgress - successful installing", async () => {
    internal.DELAY_MS = 100;
    internal.MAX_RETRY = 20;

    sdkDevspaceMock
      .expects("didBASGeneratorsFinishInstallation")
      .thrice()
      .onCall(0)
      .resolves(false)
      .onCall(1)
      .resolves(false)
      .onCall(2)
      .resolves(true);
    const notifyGeneratorsChangeStub = sandbox.stub(objYeomanUiPanel, "notifyGeneratorsChange").resolves();

    await notifyGeneratorsInstallationProgress(objYeomanUiPanel, <WebviewPanel>objWebviewPanel);

    expect(notifyGeneratorsChangeStub.callCount).equals(2);
    expect(notifyGeneratorsChangeStub.firstCall.args.length)
      .equals(notifyGeneratorsChangeStub.secondCall.args.length)
      .equals(1);
    expect(notifyGeneratorsChangeStub.firstCall.args[0]).deep.equal(["installing generators"]);
    expect(notifyGeneratorsChangeStub.secondCall.args[0]).deep.equal([]);
    expect(internal.retries).equals(1);

    notifyGeneratorsChangeStub.restore();
  });

  it("notifyGeneratorsInstallationProgress - don't loop when panel disposed", async () => {
    internal.DELAY_MS = 100;
    internal.MAX_RETRY = 20;
    internal.panelDisposed = true;

    sdkDevspaceMock.expects("didBASGeneratorsFinishInstallation").once().resolves(false);
    mockYeomanUiPanel.expects("notifyGeneratorsChange").withExactArgs(["installing generators"]).resolves();

    await notifyGeneratorsInstallationProgress(objYeomanUiPanel, <WebviewPanel>objWebviewPanel);

    expect(internal.retries).equals(0);
    expect(internal.panelDisposed).to.be.false;
  });

  it("notifyGeneratorsInstallationProgress - validate `panelDisposed` updated when panel#onDidDispose", async () => {
    internal.DELAY_MS = 100;
    internal.MAX_RETRY = 20;

    sdkDevspaceMock
      .expects("didBASGeneratorsFinishInstallation")
      .twice()
      .onCall(0)
      .resolves(false)
      .onCall(1)
      .resolves(true);
    mockYeomanUiPanel.expects("notifyGeneratorsChange").twice().resolves();

    await notifyGeneratorsInstallationProgress(objYeomanUiPanel, <WebviewPanel>objWebviewPanel);

    expect(internal.panelDisposed).to.be.false;
    disposeCB();
    expect(internal.panelDisposed).to.be.true;
    expect(internal.retries).equals(0);
  });
});
