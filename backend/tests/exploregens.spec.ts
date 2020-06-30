import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import * as path from "path";
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc, IPromiseCallbacks, IMethod } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as npmFetch from 'npm-registry-fetch';
import { mockVscode } from "./mockUtil";
import messages from "../src/exploreGensMessages";
import Environment = require("yeoman-environment");

const testYoEnv = {
    lookup: () => true,
    getNpmPaths: (): any[] => [],
    getGeneratorsMeta: () => new Error("not implemented")
};
const config = {
    get: () => new Error("not implemented"),
    update: () => new Error("not implemented"),
};
const statusBarMessage = {
    dispose: () => new Error("not implemented")
};
const globalState = {
    get: () => new Error("not implemented"),
    update: () => new Error("not implemented"),
}
const testVscode = {
    workspace: {
        getConfiguration: () => config
    },
    window: {
        setStatusBarMessage: () => {
            return statusBarMessage;
        },
        showErrorMessage: () => Promise.reject("not implemented"),
        showInformationMessage: () => Promise.reject("not implemented")
    },
    WebviewPanel: {
        webview: {
            onDidReceiveMessage: () => true,
            postMessage: () => true
        },
    },
    context: {
        globalState
    }
};

mockVscode(testVscode, "src/exploregens.ts");
import { ExploreGens } from "../src/exploregens";

describe('exploregens unit test', () => {
    let sandbox: any;
    let rpcMock: any;
    let workspaceConfigMock: any;
    let exploreGensMock: any;
    let loggerMock: any;
    let npmFetchMock: any;
    let vscodeWindowMock: any;
    let vscodeWorkspaceMock: any;
    let statusBarMessageMock: any;
    let globalStateMock: any;
    let processMock: any;
    let yoEnvMock: any;
    let testYoEnvMock: any;

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
    const exploregens = new ExploreGens({ globalState }, childLogger as IChildLogger);

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
        npmFetchMock = sandbox.mock(npmFetch);
        vscodeWindowMock = sandbox.mock(testVscode.window);
        vscodeWorkspaceMock = sandbox.mock(testVscode.workspace);
        globalStateMock = sandbox.mock(globalState);
        statusBarMessageMock = sandbox.mock(statusBarMessage);
        processMock = sandbox.mock(process);
        yoEnvMock = sandbox.mock(Environment);
        testYoEnvMock = sandbox.mock(testYoEnv);
    });

    afterEach(() => {
        rpcMock.verify();
        workspaceConfigMock.verify();
        loggerMock.verify();
        exploreGensMock.verify();
        npmFetchMock.verify();
        vscodeWindowMock.verify();
        vscodeWorkspaceMock.verify();
        statusBarMessageMock.verify();
        globalStateMock.verify();
        processMock.verify();
        yoEnvMock.verify();
        testYoEnvMock.verify();
    });

    describe("NPM", () => {
        it("win32 platform", () => {
            const stub = sinon.stub(process, 'platform').value("win32");
            const exploregens = new ExploreGens({globalState}, null);
            expect(exploregens["NPM"]).to.be.equal("npm.cmd");
            stub.restore();
        });

        it("linux platfrom", () => {
            const stub = sinon.stub(process, 'platform').value("linux");
            const exploregens = new ExploreGens({globalState}, null);
            expect(exploregens["NPM"]).to.be.equal("npm");
            stub.restore();
        });
    });

    describe("init", () => {
        it("global installation location", () => {
            rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["getFilteredGenerators"], thisArg: exploregens });
            rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["install"], thisArg: exploregens });
            rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["uninstall"], thisArg: exploregens });
            rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["isInstalled"], thisArg: exploregens });
            rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["getRecommendedQuery"], thisArg: exploregens });

            const customLocation = path.join("home", "user", "projects");
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns(customLocation);
            yoEnvMock.expects("createEnv").returns(testYoEnv);
            testYoEnvMock.expects("lookup").withArgs({npmPaths: [path.join(customLocation, exploregens["NODE_MODULES"])]});
            exploregens.init(rpc);
        });

        it("custom installation location", () => {
            rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["getFilteredGenerators"], thisArg: exploregens });
            rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["install"], thisArg: exploregens });
            rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["uninstall"], thisArg: exploregens });
            rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["isInstalled"], thisArg: exploregens });
            rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["getRecommendedQuery"], thisArg: exploregens });

            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns("");
            yoEnvMock.expects("createEnv").returns(testYoEnv);
            testYoEnvMock.expects("lookup").withArgs({npmPaths: []});
            exploregens.init(rpc);
        });
    });

    describe("install", () => {
        const gen: any = {
            package: {
                name: "gen-test"
            }
        };
        const genName = gen.package.name;

        it("update generator", async () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            loggerMock.expects("debug").withExactArgs(messages.installing(genName));
            loggerMock.expects("debug").withExactArgs(messages.installed(genName));
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", genName));
            exploreGensMock.expects("setInstalledGens");
            vscodeWindowMock.expects("showInformationMessage").withExactArgs(messages.installed(genName));
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(messages.installing(genName)).returns(statusBarMessage);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, true]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, false]);

            const res = await exploregens["install"](gen);
            expect(res).to.be.true;
        });

        it("an error is thrown", async () => {
            const errorMessage = "npm install failed";

            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(messages.installing(genName)).returns(statusBarMessage);
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(messages.failed_to_install(genName) + `: ${errorMessage}`).resolves();
            loggerMock.expects("debug").withExactArgs(messages.installing(genName));
            loggerMock.expects("error").withExactArgs(errorMessage);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, true]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, false]);
            statusBarMessageMock.expects("dispose");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", genName)).throws(errorMessage);
            exploreGensMock.expects("setInstalledGens");

            const res = await exploregens["install"](gen);
            expect(res).to.be.false;
        });
    });

    describe("getFilteredGenerators", async () => {
        it("query and recommended parameters are empty strings", async () => {
            const expectedResult = {
                objects: [{ package: { name: "generator-aa" } }, { package: { name: "generator-bb" } }],
                total: 5
            }
            const url = exploregens["getGensQueryURL"]("", "");
            npmFetchMock.expects("json").withExactArgs(url).resolves(expectedResult);
            exploregens["cachedInstalledGeneratorsPromise"] = Promise.resolve(["generator-bb"]);
            const res = await exploregens["getFilteredGenerators"]();
            expect(res).to.be.deep.equal([expectedResult.objects, expectedResult.total]);
            expect(res[0][0].disabledToHandle).to.be.false;
            expect(res[0][1].disabledToHandle).to.be.false;
            expect(res[0][0].installed).to.be.false;
            expect(res[0][1].installed).to.be.true;
        });

        it("query parameter is some words", async () => {
            const expectedResult = {
                objects: [{ package: { name: "generator-aa" } }],
                total: 1
            }
            const url = exploregens["getGensQueryURL"]("test of query", "");
            npmFetchMock.expects("json").withExactArgs(url).resolves(expectedResult);
            exploregens["gensBeingHandled"] = ["generator-aa"];
            exploregens["cachedInstalledGeneratorsPromise"] = Promise.resolve(["generator-aa"]);
            const res = await exploregens["getFilteredGenerators"]("test of query");
            expect(res[0]).to.be.deep.equal(expectedResult.objects);
            expect(res[1]).to.be.equal(expectedResult.total);
            expect(res[0][0].disabledToHandle).to.be.true;
            expect(res[0][0].installed).to.be.true;
        });

        it("npmFetch.json throws error", async () => {
            const url = exploregens["getGensQueryURL"]("test of query", "");
            const errorMessage = "npmFetch enexpected error.";
            const prefixMessage = messages.failed_to_get(url);

            npmFetchMock.expects("json").withExactArgs(url).throws(errorMessage);
            loggerMock.expects("error").withExactArgs(errorMessage);
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(`${prefixMessage}: ${errorMessage}`).resolves();
            exploregens["cachedInstalledGeneratorsPromise"] = Promise.resolve([]);

            await exploregens["getFilteredGenerators"]("test of query");
        });
    });

    describe("getGeneratorsLocationParams", () => {
        const TESTVALUE = "test location"

        it("location empty", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            const res = exploregens["getGeneratorsLocationParams"]();
            expect(res).to.be.equal("-g");
        });

        it("location undefined", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns();
            const res = exploregens["getGeneratorsLocationParams"]();
            expect(res).to.be.equal("-g");
        });

        it("location is a valid string", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns(TESTVALUE);
            const res = exploregens["getGeneratorsLocationParams"]();
            expect(res).to.be.equal(`--prefix ${TESTVALUE}`);
        });

        it("location is a string with unnecessary spaces", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns(`   ${TESTVALUE}   `);
            const res = exploregens["getGeneratorsLocationParams"]();
            expect(res).to.be.deep.equal(`--prefix ${TESTVALUE}`);
        });
    });

    describe("getRecommendedQuery", () => {
        it("recommended array empty", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["SEARCH_QUERY"]).returns([]);
            const res = exploregens["getRecommendedQuery"]();
            expect(res).to.have.lengthOf(0);
        });

        it("recommended array is undefined", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["SEARCH_QUERY"]).returns();
            const res = exploregens["getRecommendedQuery"]();
            expect(res).to.have.lengthOf(0);
        });

        it("recommended array is a valid strings array", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["SEARCH_QUERY"]).returns(["query1", "query2"]);
            const res = exploregens["getRecommendedQuery"]();
            expect(res).to.be.deep.equal(["query1", "query2"]);
        });

        it("recommended array is a valid strings array with duplicate string", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["SEARCH_QUERY"]).returns(["query1", "query1"]);
            const res = exploregens["getRecommendedQuery"]();
            expect(res).to.be.deep.equal(["query1"]);
        });
    });

    describe("doGeneratorsUpdate", () => {
        it("updateAllInstalledGenerators doesn't called", async () => {
            globalStateMock.expects("get").withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0).returns(Date.now());
            workspaceConfigMock.expects("get").never();
            
            await exploregens["doGeneratorsUpdate"](testVscode.context);
        });

        it("generators auto update is false", async () => {
            globalStateMock.expects("get").withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0).returns(100);
            workspaceConfigMock.expects("get").withExactArgs(exploregens["AUTO_UPDATE"], true).returns(false);
            workspaceConfigMock.expects("get").never();
            
            await exploregens["doGeneratorsUpdate"](testVscode.context);
        });

        it("generators auto update is true and downloadedGenerators returns undefined", async () => {
            globalStateMock.expects("get").withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0).returns(100);
            workspaceConfigMock.expects("get").withExactArgs(exploregens["AUTO_UPDATE"], true).returns(true);
            exploreGensMock.expects("getAllInstalledGenerators").resolves();
            loggerMock.expects("debug").never();

            await exploregens["doGeneratorsUpdate"](testVscode.context);
        });

        it("generators auto update is true and downloadedGenerators returns a generators list", async () => {
            globalStateMock.expects("get").withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0).returns(100);
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            workspaceConfigMock.expects("get").withExactArgs(exploregens["AUTO_UPDATE"], true).returns(true);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(messages.auto_update_started).returns(statusBarMessage);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(messages.auto_update_finished, 10000);
            loggerMock.expects("debug").withExactArgs(messages.auto_update_started);
            loggerMock.expects("debug").withExactArgs(messages.installing("generator-aa"));
            loggerMock.expects("debug").withExactArgs(messages.installing("@sap/generator-bb"));
            loggerMock.expects("debug").withExactArgs(messages.installed("generator-aa"));
            loggerMock.expects("debug").withExactArgs(messages.installed("@sap/generator-bb"));
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", "generator-aa")).resolves();
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", "@sap/generator-bb")).resolves();
            exploreGensMock.expects("getAllInstalledGenerators").resolves(["generator-aa", "@sap/generator-bb"]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", true]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["@sap/generator-bb", true]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", false]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["@sap/generator-bb", false]);

            await exploregens["doGeneratorsUpdate"](testVscode.context);
        });
    });

    describe("onEnvLookup", () => {

    //     it("input string is empty", () => {
    //         expect(exploregens["getGenerators"]("")).to.be.deep.equal([]);
    //     });

    //     it("input string is valid string", () => {
    //         expect(exploregens["getGenerators"]("+-- generator-aa@1.2.16 +-- generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq +-- generator-cc@2.0.4 +-- @sap-test/generator-dd@4.2.4")).to.be.deep.equal(["generator-aa", "generator-bb", "generator-cc", "@sap-test/generator-dd"]);

    //     });

    //     it("input string is valid string but without generators", () => {
    //         expect(exploregens["getGenerators"]("hfksajhsfiweurfjh")).to.be.deep.equal([]);
    //     });
    });

    describe("updateBeingHandledGenerator", () => {
        it("invoke method with isBeingHandled param equal true", () => {
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", true]);
            exploregens["updateBeingHandledGenerator"]("generator-aa", true);
        });

        it("invoke method with isBeingHandled param equel false", () => {
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", false]);
            exploregens["updateBeingHandledGenerator"]("generator-aa", false);
        });
    });

    it("isInstalled", async () => {
        const gen: any = {
            package: {
                name: "generator-aa"
            }
        };

        exploreGensMock.expects("getInstalledGens").resolves(["generator-cc", "generator-test", "generator-aa"]);
        let res: boolean = await exploregens["isInstalled"](gen);
        expect(res).to.be.true;

        exploreGensMock.expects("getInstalledGens").resolves(["generator-cc"]);
        res = await exploregens["isInstalled"](gen);
        expect(res).to.be.false;
    });

    describe("uninstall", () => {
        const gen: any = {
            package: {
                name: "generator-aa"
            }
        };

        it("uninstall succsessfully", async () => {
            const genName = gen.package.name;
            const uninstallingMessage = messages.uninstalling(genName);
            const successMessage = messages.uninstalled(genName);

            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(uninstallingMessage).returns(statusBarMessage);
            vscodeWindowMock.expects("showInformationMessage").withExactArgs(successMessage);
            loggerMock.expects("debug").withExactArgs(uninstallingMessage);
            loggerMock.expects("debug").withExactArgs(successMessage);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmUninstallCommand"]("-g", genName)).resolves();
            exploreGensMock.expects("setInstalledGens");
            statusBarMessageMock.expects("dispose");

            const res = await exploregens["uninstall"](gen);
            expect(res).to.be.false;
        });

        it("uninstall fails on exec method", async () => {
            const genName = gen.package.name;
            const uninstallingMessage = messages.uninstalling(genName);
            const errorMessage = `uninstall failure.`;

            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(uninstallingMessage).returns(statusBarMessage);
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(messages.failed_to_uninstall(genName) + `: ${errorMessage}`).resolves();
            loggerMock.expects("debug").withExactArgs(uninstallingMessage);
            loggerMock.expects("error").withExactArgs(errorMessage);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmUninstallCommand"]("-g", genName)).throws(errorMessage);
            exploreGensMock.expects("setInstalledGens");
            statusBarMessageMock.expects("dispose");

            const res = await exploregens["uninstall"](gen);
            expect(res).to.be.true;
        });
    });

    describe("installGenerator", () => {
        const gen: any = {
            package: {
                name: "generator-aa"
            }
        };
        const genName = gen.package.name;

        it("generator is already installed", async () => {
            const installingMessage = messages.installing(genName);
            const successMessage = messages.installed(genName);

            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(installingMessage);
            vscodeWindowMock.expects("showInformationMessage").withExactArgs(successMessage);
            loggerMock.expects("debug").withExactArgs(installingMessage);
            loggerMock.expects("debug").withExactArgs(successMessage);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, true]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, false]);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", genName)).resolves();

            expect(exploregens["installGenerator"]("-g", genName));
        });

        it("generator doesn't installed", async () => {
            const successMessage = messages.installed(genName);

            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, false]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, true]);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", genName)).resolves();
            loggerMock.expects("debug").withExactArgs(messages.installing(genName));
            loggerMock.expects("debug").withExactArgs(successMessage);

            await exploregens["installGenerator"]("-g", genName, false);
        });

        it("install fails on exec method", async () => {
            const errorMessage = `install failure.`;

            loggerMock.expects("error").withExactArgs(errorMessage);
            loggerMock.expects("debug").withExactArgs(messages.installing(genName));
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, true]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [genName, false]);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", genName)).throws(errorMessage);
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(messages.failed_to_install(genName) + `: ${errorMessage}`).resolves();

            await exploregens["installGenerator"]("-g", genName, false);
        });
    });

    it("getGensQueryURL", () => {
        const res = exploregens["getGensQueryURL"](" test ", "  ");
        expect(res).that.does.not.include(" ");
    });
});
