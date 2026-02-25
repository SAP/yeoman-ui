import { vscode } from "../mockUtil";
import * as loggerWrapper from "../../src/logger/logger-wrapper";
import { createSandbox, SinonSandbox, SinonMock, SinonStub } from "sinon";
import * as YeomanUIPanel from "../../src/panels/YeomanUIPanel";
import { Env } from "../../src/utils/env";
import { Constants } from "../../src/utils/constants";
import { NpmCommand } from "../../src/utils/npm";
import { YeomanUI } from "../../src/yeomanui";
import { set } from "lodash";
import { expect } from "chai";
import { join } from "path";
import { homedir } from "os";
import messages from "../../src/messages";
import { AnalyticsWrapper } from "../../src/usage-report/usage-analytics-wrapper";

describe("YeomanUIPanel unit test", () => {
  let sandbox: SinonSandbox;
  let envUtilsMock: SinonMock;
  let npmUtilsMock: SinonMock;
  let windowMock: SinonMock;
  let commandsMock: SinonMock;
  let loggerWrapperMock: SinonMock;
  let panel: YeomanUIPanel.YeomanUIPanel;
  let setWebviewPanelStub: SinonStub;
  let createWebviewPanelStub: SinonStub;
  let trackerWrapperMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    loggerWrapperMock = sandbox.mock(loggerWrapper);
    envUtilsMock = sandbox.mock(Env);
    npmUtilsMock = sandbox.mock(NpmCommand);
    windowMock = sandbox.mock(vscode.window);
    commandsMock = sandbox.mock(vscode.commands);
    loggerWrapperMock.expects("getClassLogger").withExactArgs("AbstractWebviewPanel");
    panel = new YeomanUIPanel.YeomanUIPanel(vscode.context);
    setWebviewPanelStub = sandbox.stub(panel, "setWebviewPanel");
    createWebviewPanelStub = sandbox.stub(panel, "createWebviewPanel");
    trackerWrapperMock = sandbox.mock(AnalyticsWrapper);
  });

  afterEach(() => {
    loggerWrapperMock.verify();
    envUtilsMock.verify();
    npmUtilsMock.verify();
    windowMock.verify();
    commandsMock.verify();
    trackerWrapperMock.verify();
    setWebviewPanelStub.restore();
    createWebviewPanelStub.restore();
  });

  describe("runGenerator", () => {
    it("generator is not choosen", async () => {
      envUtilsMock.expects("getAllGeneratorNamespaces").resolves(["gen1:test", "test:app", "code:app"]);
      windowMock.expects("showQuickPick").resolves();
      await panel.runGenerator();
    });

    it("generator is choosen", () => {
      npmUtilsMock.expects("getNodeProcessVersions").resolves({ node: "20.6.0" });
      envUtilsMock.expects("getAllGeneratorNamespaces").twice().resolves(["gen1:test", "test:app", "code:app"]);
      windowMock.expects("showQuickPick").resolves("test:app");
      void panel.runGenerator();
    });
  });

  describe("loadWebviewPanel", () => {
    describe("in VSCODE", () => {
      beforeEach(() => {
        npmUtilsMock.expects("getNodeProcessVersions").resolves({ node: "20.6.0" });
        Constants["IS_IN_BAS"] = false;
      });

      it("generator is not provided, in VSCODE", () => {
        envUtilsMock.expects("getAllGeneratorNamespaces").never();
        void panel.loadWebviewPanel();
      });

      it("existing generator is provided, in VSCODE", () => {
        envUtilsMock.expects("getAllGeneratorNamespaces").resolves(["gen1:test", "test:app", "code:app"]);
        npmUtilsMock.expects("checkAccessAndSetGeneratorsPath").never();
        void panel.loadWebviewPanel({ generator: "test:app" });
      });

      it("existing generator is provided with viewColumn parameter, in VSCODE", () => {
        envUtilsMock.expects("getAllGeneratorNamespaces").resolves(["gen1:test", "test:app", "code:app"]);
        npmUtilsMock.expects("checkAccessAndSetGeneratorsPath").never();
        void panel.loadWebviewPanel({ generator: "test:app", viewColumn: vscode.ViewColumn.Two });
      });

      it("provided generator does not exist, in VSCODE", () => {
        envUtilsMock.expects("getAllGeneratorNamespaces").resolves(["gen1:test", "code:app"]);
        npmUtilsMock.expects("checkAccessAndSetGeneratorsPath").resolves();
        commandsMock
          .expects("executeCommand")
          .withExactArgs("exploreGenerators", {
            package: { name: "generator-test" },
          })
          .resolves();
        void panel.loadWebviewPanel({ generator: "test:app" });
      });
    });

    describe("in BAS", () => {
      beforeEach(() => {
        Constants["IS_IN_BAS"] = true;
      });

      it("generator is not provided", () => {
        envUtilsMock.expects("getAllGeneratorNamespaces").never();
        void panel.loadWebviewPanel();
      });

      it("existing generator is provided", () => {
        envUtilsMock.expects("getAllGeneratorNamespaces").resolves(["gen1:test", "test:app", "code:app"]);
        npmUtilsMock.expects("checkAccessAndSetGeneratorsPath").never();
        void panel.loadWebviewPanel({ generator: "test:app" });
      });

      it("existing generator is provided with viewColumn parameter, in VSCODE", () => {
        envUtilsMock.expects("getAllGeneratorNamespaces").resolves(["gen1:test", "test:app", "code:app"]);
        npmUtilsMock.expects("checkAccessAndSetGeneratorsPath").never();
        void panel.loadWebviewPanel({ generator: "test:app", viewColumn: vscode.ViewColumn.Two });
      });

      it("provided generator does not exist", () => {
        envUtilsMock.expects("getAllGeneratorNamespaces").resolves(["gen1:test", "code:app"]);
        npmUtilsMock.expects("checkAccessAndSetGeneratorsPath").never();
        void panel.loadWebviewPanel({ generator: "test:app" });
      });
    });

    describe("no NodeJS installation is found in VSCode", () => {
      beforeEach(() => {
        npmUtilsMock.expects("getNodeProcessVersions").resolves({});
        Constants["IS_IN_BAS"] = false;
      });

      it("should show an error message", () => {
        windowMock.expects("showErrorMessage").withExactArgs(messages.nodejs_install_not_found);
        void panel.loadWebviewPanel();
      });
    });
  });

  describe("toggleOutput", () => {
    let mockOutput: SinonMock;
    beforeEach(() => {
      mockOutput = sandbox.mock(panel["output"]);
    });

    afterEach(() => {
      mockOutput.verify();
    });

    it("toggleOutput - output exists", () => {
      mockOutput.expects("show").returns(undefined);
      panel.toggleOutput();
    });
  });

  describe("notifyGeneratorsChange", () => {
    let mockYeomanui: SinonMock;
    const objYeomanui: Partial<YeomanUI> = {
      _notifyGeneratorsChange: () => Promise.resolve(),
      _notifyGeneratorsInstall: () => Promise.resolve(),
    };

    beforeEach(() => {
      mockYeomanui = sandbox.mock(objYeomanui);
    });

    afterEach(() => {
      mockYeomanui.verify();
    });

    it("notifyGeneratorsChange - no args received", () => {
      set(panel, "yeomanui", objYeomanui);
      mockYeomanui.expects("_notifyGeneratorsChange");
      panel.notifyGeneratorsChange();
    });

    it("notifyGeneratorsChange - args provided", () => {
      set(panel, "yeomanui", objYeomanui);
      const args = ["gen"];
      mockYeomanui.expects("_notifyGeneratorsInstall").withExactArgs(args);
      mockYeomanui.expects("_notifyGeneratorsChange").never();
      panel.notifyGeneratorsChange(args);
    });

    it("notifyGeneratorsChange - empty args provided", () => {
      set(panel, "yeomanui", objYeomanui);
      const args: any[] = [];
      mockYeomanui.expects("_notifyGeneratorsInstall").withExactArgs(args);
      mockYeomanui.expects("_notifyGeneratorsChange");
      envUtilsMock.expects("loadNpmPath").withExactArgs(true);
      panel.notifyGeneratorsChange(args);
      expect(panel["installGens"]).to.be.undefined;
    });

    it("notifyGeneratorsChange - yeomanui object does not exist on the panel", () => {
      set(panel, "yeomanui", undefined);
      panel.notifyGeneratorsChange();
      expect(panel["installGens"]).to.be.undefined;
    });
  });

  describe("showOpenDialog", () => {
    const selected = vscode.Uri.file("selected");
    const required = "some/path/file";

    it("showOpenFileDialog", async () => {
      const spyShowOpen = sandbox.stub(panel, <any>"showOpenDialog").returns(selected.fsPath);
      expect(await panel["showOpenFileDialog"](required)).be.equal(selected.fsPath);
      spyShowOpen.calledWithExactly(required, true);
    });

    it("showOpenFolderDialog", async () => {
      const spyShowOpen = sandbox.stub(panel, <any>"showOpenDialog").returns(selected.fsPath);
      expect(await panel["showOpenFolderDialog"](required)).be.equal(selected.fsPath);
      spyShowOpen.calledWithExactly(required, false);
    });

    it("showOpenDialog - empty path provided, ws folder exists", async () => {
      const canSelectFiles = true;
      const objWs = [{ uri: { fsPath: "rootFolderPath", scheme: "file" } }];
      sandbox.stub(vscode.workspace, "workspaceFolders").value(objWs);
      windowMock
        .expects("showOpenDialog")
        .withExactArgs({ canSelectFiles, canSelectFolders: !canSelectFiles, defaultUri: objWs[0].uri })
        .resolves([selected]);
      expect(await panel["showOpenDialog"]("", canSelectFiles)).to.equal(selected.fsPath);
    });

    it("showOpenDialog - empty path provided, ws folder not exists", async () => {
      const canSelectFiles = false;
      const objWs = [{}];
      sandbox.stub(vscode.workspace, "workspaceFolders").value(objWs);
      windowMock
        .expects("showOpenDialog")
        .withExactArgs({
          canSelectFiles,
          canSelectFolders: !canSelectFiles,
          defaultUri: vscode.Uri.file(join(homedir())),
        })
        .resolves([selected]);
      expect(await panel["showOpenDialog"](undefined, canSelectFiles)).to.equal(selected.fsPath);
    });

    it("showOpenDialog - path provided", async () => {
      const canSelectFiles = false;
      windowMock
        .expects("showOpenDialog")
        .withExactArgs({ canSelectFiles, canSelectFolders: !canSelectFiles, defaultUri: vscode.Uri.file(required) })
        .resolves([selected]);
      expect(await panel["showOpenDialog"](required, canSelectFiles)).to.equal(selected.fsPath);
    });

    it("showOpenDialog - path provided, showOpen throws error", async () => {
      const canSelectFiles = true;
      windowMock
        .expects("showOpenDialog")
        .withExactArgs({ canSelectFiles, canSelectFolders: !canSelectFiles, defaultUri: vscode.Uri.file(required) })
        .throws(new Error("unexpected"));
      expect(await panel["showOpenDialog"](required, canSelectFiles)).to.equal(required);
    });
  });

  describe("dispose", () => {
    const objYeomanui: any = {
      generatorName: "generator-name",
      promptCount: 1,
      gen: {
        prompts: {
          items: [
            {
              name: "step1",
            },
            {
              name: "step2",
            },
          ],
        },
      },
    };

    const webviewPanel = {
      dispose: () => {},
    };

    beforeEach(() => {
      set(panel, "yeomanui", objYeomanui);
      set(panel, "webViewPanel", webviewPanel);
      set(panel, "disposables", []);
      set(panel, "cleanFlowPromise", () => {});

      commandsMock.expects("executeCommand").withExactArgs("setContext", "yeomanUI.Focused", false).resolves();
    });

    it("dispose - calling usage analytics when panel is manually closed.", () => {
      trackerWrapperMock
        .expects("updateGeneratorClosedManually")
        .withArgs("generator-name", "step1", 1, 2)
        .once()
        .resolves();
      panel["dispose"]();
    });

    it("dispose - not calling usage analytics when generation ended and user clicked finish.", () => {
      set(webviewPanel, Constants.GENERATOR_COMPLETED, true);
      trackerWrapperMock.expects("updateGeneratorClosedManually").never().resolves();
      panel["dispose"]();
    });
  });
});
