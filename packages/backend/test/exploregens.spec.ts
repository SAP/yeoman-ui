import { vscode } from "./mockUtil";
import * as _ from "lodash";
import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import messages from "../src/exploreGensMessages";
import { NpmCommand, PackagesData } from "../src/utils/npm";
import { Env, GeneratorData } from "../src/utils/env";
import { IChildLogger } from "@vscode-logging/logger";
import { ExploreGens, GenState } from "../src/exploregens";
import { resolve } from "path";

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
    exploregens = new ExploreGens(childLogger as IChildLogger, false, _.get(vscode, "context"));
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
    globalStateMock.expects("update").withExactArgs(exploregens["GLOBAL_ACCEPT_LEGAL_NOTE"], true).resolves();
    const res = await exploregens["acceptLegalNote"]();
    expect(res).to.be.true;
  });

  it("setGenFilter", async () => {
    const genFullName = "generator-code";
    rpcMock.expects("invoke").withExactArgs("setGenQuery", [genFullName]).resolves();
    await exploregens["setGenFilter"](genFullName);
  });

  it("getRecommendedQuery", () => {
    workspaceConfigMock.expects("get").withExactArgs(exploregens["SEARCH_QUERY"]).returns(["test_value", "test_value"]);
    const res = exploregens["getRecommendedQuery"]();
    expect(res).to.have.lengthOf(1);
  });

  describe("isLegalNoteAccepted", () => {
    it("is in BAS, legal note is accepted", async () => {
      exploregens["isInBAS"] = true;
      globalStateMock.expects("get").withExactArgs(exploregens["GLOBAL_ACCEPT_LEGAL_NOTE"], false).returns(true);
      const res = await exploregens["isLegalNoteAccepted"]();
      expect(res).to.be.true;
    });

    it("is in BAS, legal note is not accepted", async () => {
      exploregens["isInBAS"] = true;
      globalStateMock.expects("get").withExactArgs(exploregens["GLOBAL_ACCEPT_LEGAL_NOTE"], false).returns(false);
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
    rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["update"], thisArg: exploregens });
    rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["install"], thisArg: exploregens });
    rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["uninstall"], thisArg: exploregens });
    rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["getIsInBAS"], thisArg: exploregens });
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
    envUtilsMock.expects("getGeneratorsData").resolves();

    exploregens["init"](rpc);
  });

  describe("update", () => {
    const gen: any = {
      package: {
        name: "gen-test",
      },
    };
    const genName = gen.package.name;

    it("successfully updated", async () => {
      loggerMock.expects("debug").withExactArgs(messages.updating(genName));
      loggerMock.expects("debug").withExactArgs(messages.updated(genName));
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, GenState.updating]);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, GenState.installed]);
      npmUtilsMock.expects("install").resolves();
      windowMock
        .expects("setStatusBarMessage")
        .withArgs(messages.updating(genName))
        .returns({
          dispose: () => {
            return;
          },
        });
      await exploregens["update"](gen);
    });

    it("an error is thrown", async () => {
      const errorMessage = "npm install failed";

      loggerMock.expects("debug").withExactArgs(messages.updating(genName));
      loggerMock.expects("error").withExactArgs(errorMessage);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, GenState.updating]);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, GenState.notInstalled]);
      npmUtilsMock.expects("install").throws(errorMessage);
      windowMock.expects("showErrorMessage").withExactArgs(messages.failed_to_update(genName)).resolves();
      windowMock
        .expects("setStatusBarMessage")
        .withArgs(messages.updating(genName))
        .returns({
          dispose: () => {
            return;
          },
        });

      await exploregens["update"](gen);
    });
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
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, GenState.installing]);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, GenState.installed]);
      npmUtilsMock.expects("checkAccessAndSetGeneratorsPath").resolves();
      npmUtilsMock.expects("install").resolves();

      commandsMock.expects("executeCommand").withExactArgs("yeomanUI._notifyGeneratorsChange").resolves();
      windowMock.expects("showInformationMessage").withExactArgs(messages.installed(genName)).resolves();
      windowMock
        .expects("setStatusBarMessage")
        .withArgs(messages.installing(genName))
        .returns({
          dispose: () => {
            return;
          },
        });
      await exploregens["install"](gen);
    });

    it("an error is thrown", async () => {
      const errorMessage = "npm install failed";
      loggerMock.expects("debug").withExactArgs(messages.installing(genName));
      loggerMock.expects("error").withExactArgs(errorMessage);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, GenState.installing]);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, GenState.notInstalled]);
      npmUtilsMock.expects("checkAccessAndSetGeneratorsPath").resolves();
      npmUtilsMock.expects("install").throws(errorMessage);
      windowMock.expects("showErrorMessage").withExactArgs(messages.failed_to_install(genName)).resolves();
      windowMock
        .expects("setStatusBarMessage")
        .withArgs(messages.installing(genName))
        .returns({
          dispose: () => {
            return;
          },
        });

      await exploregens["install"](gen);
    });
  });

  describe("getFilteredGenerators", () => {
    it("query and recommended parameters are empty strings", async () => {
      const packagesData: PackagesData = {
        packages: [{ package: { name: "generator-aa" } }, { package: { name: "generator-bb", version: "1.2.0" } }],
        total: 5,
      };
      npmUtilsMock.expects("getPackagesData").resolves(packagesData);
      envUtilsMock.expects("getGeneratorsData").resolves([
        {
          generatorMeta: {},
          generatorPackageJson: { name: "generator-bb", version: "1.0.0" },
        },
      ]);
      exploregens["setInstalledGens"]();
      const res: PackagesData = await exploregens["getFilteredGenerators"]();
      expect(res).to.be.deep.equal(packagesData);
      expect(res.packages[0].disabledToHandle).to.be.false;
      expect(res.packages[1].disabledToHandle).to.be.false;
      expect(res.packages[0].state).to.be.equal(GenState.notInstalled);
      expect(res.packages[1].state).to.be.equal(GenState.outdated);
    });

    it("a generator is updating", async () => {
      const packagesData: PackagesData = {
        packages: [{ package: { name: "generator-aa" } }],
        total: 1,
      };
      npmUtilsMock.expects("getPackagesData").resolves(packagesData);
      exploregens["gensBeingHandled"] = [{ name: "generator-aa", state: GenState.updating }];
      envUtilsMock.expects("getGeneratorsData").resolves([
        {
          generatorMeta: {},
          generatorPackageJson: { name: "generator-aa" },
        },
      ]);
      exploregens["setInstalledGens"]();
      const res: PackagesData = await exploregens["getFilteredGenerators"]("test of query");
      expect(res).to.be.deep.equal(packagesData);
      expect(res.packages[0].disabledToHandle).to.be.true;
      expect(res.packages[0].state).to.be.equal(GenState.updating);
    });
  });

  describe("doGeneratorsUpdate", () => {
    it("updateAllInstalledGenerators doesn't called", async () => {
      globalStateMock.expects("get").withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0).returns(Date.now());
      await exploregens["doGeneratorsUpdate"]();
    });

    it("generators auto update is false", async () => {
      globalStateMock.expects("get").withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0).returns(100);
      workspaceConfigMock.expects("get").withExactArgs(exploregens["AUTO_UPDATE"], true).returns(false);
      globalStateMock.expects("update").withArgs(exploregens["LAST_AUTO_UPDATE_DATE"]);
      await exploregens["doGeneratorsUpdate"]();
    });

    it("generators auto update is true and getGeneratorNamesWithOutdatedVersion returns empty array", async () => {
      globalStateMock.expects("get").withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0).returns(100);
      loggerMock.expects("debug").never();
      globalStateMock.expects("update").withArgs(exploregens["LAST_AUTO_UPDATE_DATE"]);
      workspaceConfigMock.expects("get").withExactArgs(exploregens["AUTO_UPDATE"], true).returns(true);
      NpmCommand["isInBAS"] = true;
      envUtilsMock.expects("getGeneratorNamesWithOutdatedVersion").resolves([]);
      await exploregens["doGeneratorsUpdate"]();
    });

    it("generators auto update is true and getGeneratorNamesWithOutdatedVersion returns a generators list", async () => {
      globalStateMock.expects("get").withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0).returns(100);
      workspaceConfigMock.expects("get").withExactArgs(exploregens["AUTO_UPDATE"], true).returns(true);
      NpmCommand["isInBAS"] = true;
      loggerMock.expects("debug").withExactArgs(messages.auto_update_started);
      loggerMock.expects("debug").withExactArgs(messages.updating("generator-aa"));
      loggerMock.expects("debug").withExactArgs(messages.updating("@sap/generator-bb"));
      loggerMock.expects("debug").withExactArgs(messages.updated("generator-aa"));
      loggerMock.expects("debug").withExactArgs(messages.updated("@sap/generator-bb"));
      npmUtilsMock.expects("install").twice().resolves();
      envUtilsMock.expects("getGeneratorNamesWithOutdatedVersion").resolves(["generator-aa", "@sap/generator-bb"]);
      envUtilsMock.expects("getGeneratorsData").thrice().resolves([{}, {}]);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", GenState.updating]);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["@sap/generator-bb", GenState.updating]);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", GenState.installed]);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["@sap/generator-bb", GenState.installed]);
      globalStateMock.expects("update").withArgs(exploregens["LAST_AUTO_UPDATE_DATE"]);
      windowMock
        .expects("setStatusBarMessage")
        .withArgs(messages.auto_update_started)
        .returns({
          dispose: () => {
            return;
          },
        });
      windowMock
        .expects("setStatusBarMessage")
        .withExactArgs(messages.auto_update_finished, 10000)
        .returns({
          dispose: () => {
            return;
          },
        });

      await exploregens["doGeneratorsUpdate"]();
    });

    it("generators auto update is true and getGeneratorNamesWithOutdatedVersion returns a generators list, update fails", async () => {
      const errorMessage = `update failure.`;
      globalStateMock.expects("get").withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0).returns(100);
      workspaceConfigMock.expects("get").withExactArgs(exploregens["AUTO_UPDATE"], true).returns(true);
      NpmCommand["isInBAS"] = true;
      loggerMock.expects("debug").withExactArgs(messages.auto_update_started);
      loggerMock.expects("debug").withExactArgs(messages.updating("generator-aa"));
      envUtilsMock.expects("getGeneratorNamesWithOutdatedVersion").resolves(["generator-aa"]);
      envUtilsMock.expects("getGeneratorsData").twice().resolves([{}]);
      npmUtilsMock.expects("install").withExactArgs("generator-aa").throws(errorMessage);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", GenState.updating]);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", GenState.notInstalled]);
      globalStateMock.expects("update").withArgs(exploregens["LAST_AUTO_UPDATE_DATE"]);
      windowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.failed_to_update_gens(["generator-aa"]))
        .resolves();
      windowMock
        .expects("setStatusBarMessage")
        .withArgs(messages.auto_update_started)
        .returns({
          dispose: () => {
            return;
          },
        });
      windowMock
        .expects("setStatusBarMessage")
        .withArgs(messages.auto_update_finished, 10000)
        .returns({
          dispose: () => {
            return;
          },
        });

      await exploregens["doGeneratorsUpdate"]();
    });

    it("generators auto update is true and getGeneratorNamesWithOutdatedVersion throws an error", async () => {
      globalStateMock.expects("get").withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0).returns(100);
      globalStateMock.expects("update").withArgs(exploregens["LAST_AUTO_UPDATE_DATE"]);
      workspaceConfigMock.expects("get").withExactArgs(exploregens["AUTO_UPDATE"], true).returns(true);
      NpmCommand["isInBAS"] = false;
      const expectedErrorMessage = "Error: Action cancelled";
      loggerMock.expects("error").withExactArgs(expectedErrorMessage);
      npmUtilsMock.expects("checkAccessAndSetGeneratorsPath").throws(new Error("Action cancelled"));
      windowMock.expects("showErrorMessage").withExactArgs(messages.failed_to_update_gens()).resolves();
      await exploregens["doGeneratorsUpdate"]();
    });
  });

  describe("getInstalledGens", () => {
    it("there are no installed generators", async () => {
      envUtilsMock.expects("getGeneratorsData").resolves([]);
      exploregens["setInstalledGens"]();
      const gens: GeneratorData[] = await exploregens["getInstalledGens"]();
      expect(gens).to.have.lengthOf(0);
    });

    it("there are installed generators", async () => {
      envUtilsMock.expects("getGeneratorsData").resolves([{}, {}, {}]);
      exploregens["setInstalledGens"]();
      const gens: GeneratorData[] = await exploregens["getInstalledGens"]();
      expect(gens).to.have.lengthOf(3);
    });
  });

  it("updateBeingHandledGenerator", () => {
    rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", GenState.installed]);
    exploregens["updateBeingHandledGenerator"]("generator-aa", GenState.installed);
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
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, GenState.uninstalling]);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, GenState.notInstalled]);
      npmUtilsMock.expects("uninstall").resolves();

      windowMock.expects("showInformationMessage").withExactArgs(successMessage).resolves();
      windowMock
        .expects("setStatusBarMessage")
        .withArgs(uninstallingMessage)
        .returns({
          dispose: () => {
            return;
          },
        });
      commandsMock.expects("executeCommand").withExactArgs("yeomanUI._notifyGeneratorsChange").resolves();

      await exploregens["uninstall"](gen);
    });

    it("uninstall fails on exec method", async () => {
      const genName = gen.package.name;
      const uninstallingMessage = messages.uninstalling(genName);
      const errorMessage = `uninstall failure.`;

      loggerMock.expects("debug").withExactArgs(uninstallingMessage);
      loggerMock.expects("error").withExactArgs(errorMessage);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, GenState.uninstalling]);
      rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, GenState.installed]);
      npmUtilsMock.expects("uninstall").throws(errorMessage);

      windowMock
        .expects("setStatusBarMessage")
        .withArgs(uninstallingMessage)
        .returns({
          dispose: () => {
            return;
          },
        });
      windowMock.expects("showErrorMessage").withExactArgs(messages.failed_to_uninstall(genName)).resolves();

      await exploregens["uninstall"](gen);
    });
  });
});
