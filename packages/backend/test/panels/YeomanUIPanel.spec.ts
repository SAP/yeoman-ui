import { vscode } from "../mockUtil";
import * as loggerWrapper from "../../src/logger/logger-wrapper";
import { createSandbox, SinonSandbox, SinonMock, SinonStub } from "sinon";
import * as _ from "lodash";
import * as YeomanUIPanel from "../../src/panels/YeomanUIPanel";
import { Env } from "../../src/utils/env";
import { NpmCommand } from "../../src/utils/npm";

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
  });

  afterEach(() => {
    loggerWrapperMock.verify();
    envUtilsMock.verify();
    npmUtilsMock.verify();
    windowMock.verify();
    commandsMock.verify();
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
      envUtilsMock.expects("getAllGeneratorNamespaces").twice().resolves(["gen1:test", "test:app", "code:app"]);
      windowMock.expects("showQuickPick").resolves("test:app");
      void panel.runGenerator();
    });
  });

  describe("loadWebviewPanel", () => {
    describe("in VSCODE", () => {
      beforeEach(() => {
        panel["isInBAS"] = false;
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
        panel["isInBAS"] = true;
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
  });
});
