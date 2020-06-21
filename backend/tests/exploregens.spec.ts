import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import { ExploreGens } from "../src/exploregens";
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc, IPromiseCallbacks, IMethod } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as npmFetch from 'npm-registry-fetch';


describe('exploregens unit test', () => {
    let sandbox: any;
    let rpcMock: any;
    let workspaceConfigMock: any;
    let exploreGensMock: any;
    let loggerMock: any;
    let npmMock: any;

    class TestRpc implements IRpc {
        public timeout: number;
        public promiseCallbacks: Map<number, IPromiseCallbacks>;
        public methods: Map<string, IMethod>;
        public sendRequest(): void {
            return;
        }
        public sendResponse(): void {
            return;
        }
        public setResponseTimeout(): void {
            return;
        }
        public registerMethod(): void {
            return;
        }
        public unregisterMethod(): void {
            return;
        }
        public listLocalMethods(): string[] {
            return [];
        }
        public handleResponse(): void {
            return;
        }
        public listRemoteMethods(): Promise<string[]> {
            return Promise.resolve([]);
        }
        public invoke(): Promise<any> {
            return Promise.resolve();
        }
        public handleRequest(): Promise<void> {
            return Promise.resolve();
        }
    }
    const rpc = new TestRpc();
    const childLogger = { debug: () => true, error: () => true, fatal: () => true, warn: () => true, info: () => true, trace: () => true, getChildLogger: () => { return {} as IChildLogger; } };
    const config = {
        get: () => true,
        update: () => true,
    };
    const exploregens = new ExploreGens(childLogger as IChildLogger);

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        rpcMock = sandbox.mock(rpc);
        workspaceConfigMock = sandbox.mock(config);
        loggerMock = sandbox.mock(childLogger);
        exploreGensMock = sandbox.mock(exploregens);
        npmMock = sandbox.mock(npmFetch);
    });

    afterEach(() => {
        rpcMock.verify();
        workspaceConfigMock.verify();
        loggerMock.verify();
        exploreGensMock.verify();
        npmMock.verify();
    });

    it("initRpc", () => {
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["getFilteredGenerators"], thisArg: exploregens });
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["doDownload"], thisArg: exploregens });
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["getRecommendedQuery"], thisArg: exploregens });
        exploreGensMock.expects("updateAllInstalledGenerators");

        exploregens["initRpc"](rpc);
    });

    describe("doDownload", () => {
        const gen: any = {
            package: {
                name: "gen-test"
            }
        };

        it("update already downloaded generator", async () => {
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.generatorsLocation").returns("");
            loggerMock.expects("debug").withExactArgs(`Installing the latest version of ${gen.package.name} ...`);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallParams"]("-g", gen.package.name));
            loggerMock.expects("debug").withExactArgs(`${gen.package.name} successfully installed.`);
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.downloadedGenerators").returns([gen.package.name, "gen-test2"]);
            workspaceConfigMock.expects("update").withExactArgs("Yeoman UI.downloadedGenerators", [gen.package.name, "gen-test2"], true);

            await exploregens["doDownload"](gen);
        });

        it("download new generator", async () => {
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.generatorsLocation").returns("");
            loggerMock.expects("debug").withExactArgs(`Installing the latest version of ${gen.package.name} ...`);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallParams"]("-g", gen.package.name));
            loggerMock.expects("debug").withExactArgs(`${gen.package.name} successfully installed.`);
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.downloadedGenerators").returns(undefined);
            workspaceConfigMock.expects("update").withExactArgs("Yeoman UI.downloadedGenerators", [gen.package.name], true);

            await exploregens["doDownload"](gen);
        });

        it("an error is thrown", async () => {
            const errorStr = "npm install failed";
            exploreGensMock.expects("exec").throws(new Error(errorStr));
            loggerMock.expects("error").withExactArgs(errorStr);
            await exploregens["doDownload"](gen);
        });
    });

    describe("getFilteredGenerators", async () => {
        it("query and recommended parameters are empty strings", async () => {
            const expectedResult = {
                objects: ["obj1", "obj2"],
                total: 5
            }
            const url = exploregens["getGensQueryURL"]("", "");
            npmMock.expects("json").withExactArgs(url).resolves(expectedResult);
            const res = await exploregens["getFilteredGenerators"]();
            expect(res).to.be.deep.equal([expectedResult.objects, expectedResult.total]);
        });

        it("query parameter is some words", async () => {
            const expectedResult = {
                objects: ["obj1"],
                total: 1
            }
            const url = exploregens["getGensQueryURL"]("test of query", "");
            npmMock.expects("json").withExactArgs(url).resolves(expectedResult);
            const res = await exploregens["getFilteredGenerators"]("test of query");
            expect(res).to.be.deep.equal([expectedResult.objects, expectedResult.total]);
        });
    });

    describe("getGeneratorsLocationParams", () => {
        const TESTVALUE = "test location"

        it("location empty", () => {
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.generatorsLocation").returns("");
            expect(exploregens["getGeneratorsLocationParams"]()).to.be.deep.equal("-g");
        });

        it("location undefined", () => {
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.generatorsLocation").returns(undefined);
            expect(exploregens["getGeneratorsLocationParams"]()).to.be.deep.equal("-g");
        });

        it("location is a valid string", () => {
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.generatorsLocation").returns(TESTVALUE);
            expect(exploregens["getGeneratorsLocationParams"]()).to.be.deep.equal(`--prefix ${TESTVALUE}`);
        });

        it("location is a string with unnecessary spaces", () => {
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.generatorsLocation").returns(`   ${TESTVALUE}   `);
            expect(exploregens["getGeneratorsLocationParams"]()).to.be.deep.equal(`--prefix ${TESTVALUE}`);
        });
    });

    describe("getRecommendedQuery", () => {
        it("recommended array empty", () => {
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.recommendedQuery").returns([]);
            expect(exploregens["getRecommendedQuery"]()).to.be.deep.equal([]);
        });

        it("recommended array is undefined", () => {
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.recommendedQuery").returns(undefined);
            expect(exploregens["getRecommendedQuery"]()).to.be.deep.equal([]);
        });

        it("recommended array is a valid strings array", () => {
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.recommendedQuery").returns(["query1", "query2"]);
            expect(exploregens["getRecommendedQuery"]()).to.be.deep.equal(["query1", "query2"]);
        });

        it("recommended array is a valid strings array with duplicate string", () => {
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.recommendedQuery").returns(["query1", "query1"]);
            expect(exploregens["getRecommendedQuery"]()).to.be.deep.equal(["query1"]);
        });
    });

    describe("updateAllInstalledGenerators", () => {
        it("generator auto update is false", () => {
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.autoUpdateGenerators").returns(false);
            workspaceConfigMock.expects("get").never();

            exploregens["updateAllInstalledGenerators"]();
        });

        it("generator auto update is true and downloadedGenerators returns undefined", () => {
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.autoUpdateGenerators").returns(true);
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.downloadedGenerators").returns(undefined);
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.generatorsLocation").returns("");
            loggerMock.expects("debug").never();

            exploregens["updateAllInstalledGenerators"]();
        });

        it("generator auto update is true and downloadedGenerators returns a generator list", () => {
            const gensarry = ["generators-aa", "generators-bb"];
            
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.autoUpdateGenerators").returns(true);
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.downloadedGenerators").returns(gensarry);
            workspaceConfigMock.expects("get").withExactArgs("Yeoman UI.generatorsLocation").returns("");

            loggerMock.expects("debug").withExactArgs("Auto updating all downloaded generators...");
            loggerMock.expects("debug").withExactArgs("Installing the latest version of generators-aa ...");
            loggerMock.expects("debug").withExactArgs("Installing the latest version of generators-bb ...");
            loggerMock.expects("debug").withExactArgs("generators-aa successfully installed.");
            loggerMock.expects("debug").withExactArgs("generators-bb successfully installed.");

            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallParams"]("-g", "generators-aa"));
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallParams"]("-g", "generators-bb"));

            exploregens["updateAllInstalledGenerators"]();
        });
    });
});
