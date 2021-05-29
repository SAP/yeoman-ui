import { vscode } from "./mockUtil";
import * as _ from "lodash";
import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import messages from "../src/exploreGensMessages";
import { NpmCommand } from "../src/utils/npm";
import { Env } from "../src/utils/env";
import { IChildLogger } from "@vscode-logging/logger";
import { ExploreGens, GenState } from "../src/exploregens";

describe("exploregens unit test", () => {
  const sandbox: SinonSandbox = createSandbox();
  let rpcMock: SinonMock;
  let loggerMock: SinonMock;
  let globalStateMock: SinonMock;
  let envUtilsMock: SinonMock;
  let npmUtilsMock: SinonMock;
  let windowMock: SinonMock;
  let commandsMock: SinonMock;
  let workspaceConfigMock: SinonMock;

  class TestRpc implements Partial<IRpc> {
    public registerMethod(): void {
      return;
    }
    public invoke(): Promise<any> {
      return Promise.resolve();
    }
  }
  const rpc = new TestRpc();
  const childLogger = {
    debug: () => true,
    error: () => true,
    fatal: () => true,
    warn: () => true,
    info: () => true,
    trace: () => true,
    getChildLogger: () => {
      return {} as IChildLogger;
    },
  };
  let exploregens: ExploreGens;

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    rpcMock = sandbox.mock(rpc);
    loggerMock = sandbox.mock(childLogger);
    workspaceConfigMock = sandbox.mock(vscode.workspace.getConfiguration());
    globalStateMock = sandbox.mock(vscode.context.globalState);
    envUtilsMock = sandbox.mock(Env);
    npmUtilsMock = sandbox.mock(NpmCommand);
    windowMock = sandbox.mock(vscode.window);
    commandsMock = sandbox.mock(vscode.commands);
    globalStateMock.expects("get").returns(Date.now());
    envUtilsMock.expects("getGeneratorNamesByPath").atMost(1).resolves();
    exploregens = new ExploreGens(
      childLogger as IChildLogger,
      false,
      _.get(vscode, "context")
    );
    exploregens["initRpc"](rpc);
  });

  afterEach(() => {
    rpcMock.verify();
    loggerMock.verify();
    globalStateMock.verify();
    envUtilsMock.verify();
    npmUtilsMock.verify();
    workspaceConfigMock.verify();
    windowMock.verify();
    commandsMock.verify();
  });

  it("acceptLegalNote", async () => {
    globalStateMock
      .expects("update")
      .withExactArgs(exploregens["GLOBAL_ACCEPT_LEGAL_NOTE"], true)
      .resolves();
    const res = await exploregens["acceptLegalNote"]();
    expect(res).to.be.true;
  });

  describe("isLegalNoteAccepted", () => {
    it("is in BAS, legal note is accepted", async () => {
      exploregens["isInBAS"] = true;
      globalStateMock
        .expects("get")
        .withExactArgs(exploregens["GLOBAL_ACCEPT_LEGAL_NOTE"], false)
        .returns(true);
      const res = await exploregens["isLegalNoteAccepted"]();
      expect(res).to.be.true;
    });

    it("is in BAS, legal note is not accepted", async () => {
      exploregens["isInBAS"] = true;
      globalStateMock
        .expects("get")
        .withExactArgs(exploregens["GLOBAL_ACCEPT_LEGAL_NOTE"], false)
        .returns(false);
      expect(exploregens["getIsInBAS"]()).to.be.true;
      const res = await exploregens["isLegalNoteAccepted"]();
      expect(res).to.be.false;
    });

    it("is not in BAS", async () => {
      exploregens["isInBAS"] = false;
      globalStateMock.expects("get").never();
      const res = await exploregens["isLegalNoteAccepted"]();
      expect(res).to.be.true;
    });
  });

  it("init", () => {
    rpcMock.expects("registerMethod").withExactArgs({
      func: exploregens["getFilteredGenerators"],
      thisArg: exploregens,
    });
    rpcMock
      .expects("registerMethod")
      .withExactArgs({ func: exploregens["install"], thisArg: exploregens });
    rpcMock
      .expects("registerMethod")
      .withExactArgs({ func: exploregens["uninstall"], thisArg: exploregens });
    rpcMock.expects("registerMethod").withExactArgs({
      func: exploregens["isInstalled"],
      thisArg: exploregens,
    });
    rpcMock
      .expects("registerMethod")
      .withExactArgs({ func: exploregens["getIsInBAS"], thisArg: exploregens });
    rpcMock.expects("registerMethod").withExactArgs({
      func: exploregens["getRecommendedQuery"],
      thisArg: exploregens,
    });
    rpcMock.expects("registerMethod").withExactArgs({
      func: exploregens["isLegalNoteAccepted"],
      thisArg: exploregens,
    });
    rpcMock.expects("registerMethod").withExactArgs({
      func: exploregens["acceptLegalNote"],
      thisArg: exploregens,
    });
    envUtilsMock.expects("getGeneratorNamesByPath").resolves();

    exploregens["init"](rpc);
  });

  describe("install", () => {
    const gen: any = {
      package: {
        name: "gen-test",
      },
    };
    const genName = gen.package.name;

    it("successfully installed", async () => {
      loggerMock.expects("debug").withExactArgs(messages.installing(genName));
      loggerMock.expects("debug").withExactArgs(messages.installed(genName));
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          genName,
          GenState.installing,
        ]);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          genName,
          GenState.installed,
        ]);
      npmUtilsMock.expects("checkAccessAndSetGeneratorsPath").resolves();
      npmUtilsMock.expects("install").resolves();

      commandsMock
        .expects("executeCommand")
        .withExactArgs("yeomanUI._notifyGeneratorsChange")
        .resolves();
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.installed(genName))
        .resolves();
      windowMock
        .expects("setStatusBarMessage")
        .withExactArgs(messages.installing(genName))
        .returns({ dispose: () => "" });
      await exploregens["install"](gen);
    });

    it("an error is thrown", async () => {
      const errorMessage = "npm install failed";

      loggerMock.expects("debug").withExactArgs(messages.installing(genName));
      loggerMock.expects("error").withExactArgs(errorMessage);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          genName,
          GenState.installing,
        ]);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          genName,
          GenState.notInstalled,
        ]);
      npmUtilsMock.expects("checkAccessAndSetGeneratorsPath").resolves();
      npmUtilsMock.expects("install").throws(errorMessage);

      windowMock
        .expects("showErrorMessage")
        .withExactArgs(
          messages.failed_to_install(genName) + `: ${errorMessage}`
        )
        .resolves();
      windowMock
        .expects("setStatusBarMessage")
        .withExactArgs(messages.installing(genName))
        .returns({ dispose: () => "" });

      await exploregens["install"](gen);
    });
  });

  describe.only("getFilteredGenerators", () => {
    it("query and recommended parameters are empty strings", async () => {
      const expectedResult = {
        objects: [
          { package: { name: "generator-aa" } },
          { package: { name: "generator-bb" } },
        ],
        total: 5,
      };
      exploregens["cachedInstalledGenerators"] = ["generator-bb"];
      const res = await exploregens["getFilteredGenerators"]();
      expect(res).to.be.deep.equal([
        expectedResult.objects,
        expectedResult.total,
      ]);
      expect(res[0][0].disabledToHandle).to.be.false;
      expect(res[0][1].disabledToHandle).to.be.false;
      expect(res[0][0].state).to.be.equal(GenState.notInstalled);
      expect(res[0][1].state).to.be.equal(GenState.installed);
    });

    it("a generator is updating", async () => {
      const expectedResult = {
        objects: [{ package: { name: "generator-aa" } }],
        total: 1,
      };
      exploregens["gensBeingHandled"] = [
        { name: "generator-aa", state: GenState.updating },
      ];
      exploregens["cachedInstalledGenerators"] = ["generator-aa"];
      const res = await exploregens["getFilteredGenerators"]("test of query");
      expect(res[0]).to.be.deep.equal(expectedResult.objects);
      expect(res[1]).to.be.equal(expectedResult.total);
      expect(res[0][0].disabledToHandle).to.be.true;
      expect(res[0][0].state).to.be.equal(GenState.updating);
    });

    it("npmFetch.json throws error", async () => {
      const errorMessage = "npmFetch enexpected error.";
      loggerMock.expects("error").withExactArgs(errorMessage);
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(
          "Could not get generators with the queryUrl gensQueryUrl: npmFetch enexpected error."
        )
        .resolves();

      await exploregens["getFilteredGenerators"]("test of query");
    });
  });

  describe("doGeneratorsUpdate", () => {
    it("updateAllInstalledGenerators doesn't called", async () => {
      globalStateMock
        .expects("get")
        .withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0)
        .returns(Date.now());
      await exploregens["doGeneratorsUpdate"]();
    });

    it("generators auto update is false", async () => {
      globalStateMock
        .expects("get")
        .withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0)
        .returns(100);
      workspaceConfigMock
        .expects("get")
        .withExactArgs(exploregens["AUTO_UPDATE"], true)
        .returns(false);
      globalStateMock
        .expects("update")
        .withArgs(exploregens["LAST_AUTO_UPDATE_DATE"]);
      await exploregens["doGeneratorsUpdate"]();
    });

    it("generators auto update is true and getAllInstalledGenerators returns undefined", async () => {
      globalStateMock
        .expects("get")
        .withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0)
        .returns(100);
      loggerMock.expects("debug").never();
      globalStateMock
        .expects("update")
        .withArgs(exploregens["LAST_AUTO_UPDATE_DATE"]);
      workspaceConfigMock
        .expects("get")
        .withExactArgs(exploregens["AUTO_UPDATE"], true)
        .returns(true);
      NpmCommand["isInBAS"] = true;
      await exploregens["doGeneratorsUpdate"]();
    });

    it("generators auto update is true and getAllInstalledGenerators returns a generators list", async () => {
      globalStateMock
        .expects("get")
        .withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0)
        .returns(100);
      workspaceConfigMock
        .expects("get")
        .withExactArgs(exploregens["AUTO_UPDATE"], true)
        .returns(true);
      NpmCommand["isInBAS"] = true;
      loggerMock.expects("debug").withExactArgs(messages.auto_update_started);
      loggerMock
        .expects("debug")
        .withExactArgs(messages.updating("generator-aa"));
      loggerMock
        .expects("debug")
        .withExactArgs(messages.updating("@sap/generator-bb"));
      loggerMock
        .expects("debug")
        .withExactArgs(messages.updated("generator-aa"));
      loggerMock
        .expects("debug")
        .withExactArgs(messages.updated("@sap/generator-bb"));
      npmUtilsMock.expects("install").twice().resolves();
      envUtilsMock
        .expects("getGeneratorNamesByPath")
        .twice()
        .returns(["generator-aa", "@sap/generator-bb"]);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          "generator-aa",
          GenState.updating,
        ]);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          "@sap/generator-bb",
          GenState.updating,
        ]);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          "generator-aa",
          GenState.installed,
        ]);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          "@sap/generator-bb",
          GenState.installed,
        ]);
      globalStateMock
        .expects("update")
        .withArgs(exploregens["LAST_AUTO_UPDATE_DATE"]);
      windowMock
        .expects("setStatusBarMessage")
        .withExactArgs(messages.auto_update_started)
        .returns({ dispose: () => "" });
      windowMock
        .expects("setStatusBarMessage")
        .withExactArgs(messages.auto_update_finished, 10000)
        .returns({ dispose: () => "" });

      await exploregens["doGeneratorsUpdate"]();
    });

    it("generators auto update is true and getAllInstalledGenerators returns a generators list, update fails", async () => {
      const errorMessage = `update failure.`;
      globalStateMock
        .expects("get")
        .withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0)
        .returns(100);
      workspaceConfigMock
        .expects("get")
        .withExactArgs(exploregens["AUTO_UPDATE"], true)
        .returns(true);
      NpmCommand["isInBAS"] = true;
      loggerMock.expects("debug").withExactArgs(messages.auto_update_started);
      loggerMock
        .expects("debug")
        .withExactArgs(messages.updating("generator-aa"));
      envUtilsMock
        .expects("getGeneratorNamesByPath")
        .twice()
        .returns(["generator-aa"]);
      npmUtilsMock
        .expects("install")
        .withExactArgs("generator-aa")
        .throws(errorMessage);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          "generator-aa",
          GenState.updating,
        ]);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          "generator-aa",
          GenState.notInstalled,
        ]);
      globalStateMock
        .expects("update")
        .withArgs(exploregens["LAST_AUTO_UPDATE_DATE"]);
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(
          `Update Failure: ${messages.failed_to_update_gens(["generator-aa"])}`
        )
        .resolves();
      windowMock
        .expects("setStatusBarMessage")
        .withExactArgs(messages.auto_update_started)
        .returns({ dispose: () => "" });
      windowMock
        .expects("setStatusBarMessage")
        .withExactArgs(messages.auto_update_finished, 10000)
        .returns({ dispose: () => "" });

      await exploregens["doGeneratorsUpdate"]();
    });
  });

  describe("getAllInstalledGenerators", () => {
    it("there are no installed generators", () => {
      envUtilsMock.expects("getGeneratorNamesByPath");
      const gens: string[] = exploregens["getAllInstalledGenerators"]();
      expect(gens).to.be.undefined;
    });

    it("there are installed generators", () => {
      envUtilsMock
        .expects("getGeneratorNamesByPath")
        .returns(["aa:app", "bb:app", "@sap/cc:test"]);
      const gens: string[] = exploregens["getAllInstalledGenerators"]();
      expect(gens).to.have.lengthOf(3);
      expect(gens).includes("bb:app");
      expect(gens).includes("aa:app");
      expect(gens).includes("@sap/cc:test");
    });
  });

  it("updateBeingHandledGenerator", () => {
    rpcMock
      .expects("invoke")
      .withExactArgs("updateBeingHandledGenerator", [
        "generator-aa",
        GenState.installed,
      ]);
    exploregens["updateBeingHandledGenerator"](
      "generator-aa",
      GenState.installed
    );
  });

  it("isInstalled", () => {
    const gen: any = {
      package: {
        name: "generator-aa",
      },
    };

    envUtilsMock
      .expects("getGeneratorNamesByPath")
      .returns(["generator-cc", "generator-test", "generator-aa"]);
    exploregens["setInstalledGens"]();
    let res: boolean = exploregens["isInstalled"](gen);
    expect(res).to.be.true;

    envUtilsMock.expects("getGeneratorNamesByPath").returns(["generator-cc"]);
    exploregens["setInstalledGens"]();
    res = exploregens["isInstalled"](gen);
    expect(res).to.be.false;
  });

  describe("uninstall", () => {
    const gen: any = {
      package: {
        name: "generator-aa",
      },
    };

    it("uninstall succsessfully", async () => {
      const genName = gen.package.name;
      const uninstallingMessage = messages.uninstalling(genName);
      const successMessage = messages.uninstalled(genName);

      loggerMock.expects("debug").withExactArgs(uninstallingMessage);
      loggerMock.expects("debug").withExactArgs(successMessage);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          genName,
          GenState.uninstalling,
        ]);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          genName,
          GenState.notInstalled,
        ]);
      npmUtilsMock.expects("uninstall").resolves();

      windowMock
        .expects("showInformationMessage")
        .withExactArgs(successMessage)
        .resolves();
      windowMock
        .expects("setStatusBarMessage")
        .withExactArgs(uninstallingMessage)
        .returns({ dispose: () => "" });
      commandsMock
        .expects("executeCommand")
        .withExactArgs("yeomanUI._notifyGeneratorsChange")
        .resolves();

      await exploregens["uninstall"](gen);
    });

    it("uninstall fails on exec method", async () => {
      const genName = gen.package.name;
      const uninstallingMessage = messages.uninstalling(genName);
      const errorMessage = `uninstall failure.`;

      loggerMock.expects("debug").withExactArgs(uninstallingMessage);
      loggerMock.expects("error").withExactArgs(errorMessage);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          genName,
          GenState.uninstalling,
        ]);
      rpcMock
        .expects("invoke")
        .withExactArgs("updateBeingHandledGenerator", [
          genName,
          GenState.installed,
        ]);
      npmUtilsMock.expects("uninstall").throws(errorMessage);

      windowMock
        .expects("setStatusBarMessage")
        .withExactArgs(uninstallingMessage)
        .returns({ dispose: () => "" });
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(
          messages.failed_to_uninstall(genName) + `: ${errorMessage}`
        )
        .resolves();

      await exploregens["uninstall"](gen);
    });
  });
});
