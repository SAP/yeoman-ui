import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc, IPromiseCallbacks, IMethod } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as npmFetch from 'npm-registry-fetch';
import { mockVscode } from "./mockUtil";

const config = {
    get: () => new Error("not implemented"),
    update: () => new Error("not implemented"),
};
const statusBarMessage = {
    dispose: () => true
};
const globalState = {
    get: (str: string, num: any) => new Error("not implemented"),
    update: (str: string, num: any) => new Error("not implemented"),
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
    }
};
mockVscode(testVscode, "src/extension.ts");
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
    const exploregens = new ExploreGens({globalState}, childLogger as IChildLogger);
    exploregens["initRpc"](rpc);

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
    });

    it("initRpc", () => {
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["getFilteredGenerators"], thisArg: exploregens });
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["install"], thisArg: exploregens });
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["uninstall"], thisArg: exploregens });
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["isInstalled"], thisArg: exploregens });
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["getRecommendedQuery"], thisArg: exploregens });

        exploregens["initRpc"](rpc);
    });

    describe("install", () => {
        const gen: any = {
            package: {
                name: "gen-test"
            }
        };

        it("update already downloaded generator", async () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({stdout: "+-- generator-aa@1.2.16 +-- generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq +-- generator-cc@2.0.4"});
            exploregens["cachedInstalledGeneratorsPromise"] = exploregens["getAllInstalledGenerators"]();

            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns("");
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(`Installing the latest version of ${gen.package.name} ...`).returns(statusBarMessage);
            loggerMock.expects("debug").withExactArgs(`Installing the latest version of ${gen.package.name} ...`);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", gen.package.name));
            loggerMock.expects("debug").withExactArgs(`${gen.package.name} successfully installed.`);
            vscodeWindowMock.expects("showInformationMessage").withExactArgs(`${gen.package.name} successfully installed.`);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, true]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, false]);
            
            await exploregens["install"](gen);
        });

        it("download new generator", async () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({});
            exploregens["cachedInstalledGeneratorsPromise"] = exploregens["getAllInstalledGenerators"]();
            
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns("");
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(`Installing the latest version of ${gen.package.name} ...`).returns(statusBarMessage);
            loggerMock.expects("debug").withExactArgs(`Installing the latest version of ${gen.package.name} ...`);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, true]);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", gen.package.name));
            loggerMock.expects("debug").withExactArgs(`${gen.package.name} successfully installed.`);
            vscodeWindowMock.expects("showInformationMessage").withExactArgs(`${gen.package.name} successfully installed.`);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, false]);
            
            await exploregens["install"](gen);
        });

        it("an error is thrown", async () => {
            const errorStr = "npm install failed";
            exploreGensMock.expects("exec").throws(new Error(errorStr));
            loggerMock.expects("error").withExactArgs(`Error: ${errorStr}`);
            await exploregens["install"](gen);
        });
    });

    describe("getFilteredGenerators", async () => {
        it("query and recommended parameters are empty strings", async () => {
            const expectedResult = {
                objects: [{package: {name: "obj1"}}, {package: {name: "obj2"}}],
                total: 5
            }
            const url = exploregens["getGensQueryURL"]("", "");
            npmFetchMock.expects("json").withExactArgs(url).resolves(expectedResult);
            const res = await exploregens["getFilteredGenerators"]();
            expect(res).to.be.deep.equal([expectedResult.objects, expectedResult.total]);
        });

        it("query parameter is some words", async () => {
            const expectedResult = {
                objects: [{package: {name: "obj1"}}],
                total: 1
            }
            const url = exploregens["getGensQueryURL"]("test of query", "");
            npmFetchMock.expects("json").withExactArgs(url).resolves(expectedResult);
            const res = await exploregens["getFilteredGenerators"]("test of query");
            expect(res).to.be.deep.equal([expectedResult.objects, expectedResult.total]);
        });

        it("npmFetch.json throws error", async () => {
            const expectedResult = {
                objects: [{package: {name: "obj1"}}],
                total: 1
            }
            const url = exploregens["getGensQueryURL"]("test of query", "");
            const errorMessage = "npmFetch enexpected error.";
            npmFetchMock.expects("json").withExactArgs(url).throws(errorMessage);

            loggerMock.expects("error").withExactArgs(errorMessage);

            const prefixMessage = `Failed to get generators with the queryUrl ${url}`;
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(`${prefixMessage}: ${errorMessage}`).resolves();
            await exploregens["getFilteredGenerators"]("test of query");
        });
    });

    describe("getGeneratorsLocationParams", () => {
        const TESTVALUE = "test location"

        it("location empty", () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns("");
            expect(exploregens["getGeneratorsLocationParams"]()).to.be.deep.equal("-g");
        });

        it("location undefined", () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns(undefined);
            expect(exploregens["getGeneratorsLocationParams"]()).to.be.deep.equal("-g");
        });

        it("location is a valid string", () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns(TESTVALUE);
            expect(exploregens["getGeneratorsLocationParams"]()).to.be.deep.equal(`--prefix ${TESTVALUE}`);
        });

        it("location is a string with unnecessary spaces", () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns(`   ${TESTVALUE}   `);
            expect(exploregens["getGeneratorsLocationParams"]()).to.be.deep.equal(`--prefix ${TESTVALUE}`);
        });
    });

    describe("getRecommendedQuery", () => {
        it("recommended array empty", () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.searchQuery").returns([]);
            expect(exploregens["getRecommendedQuery"]()).to.be.deep.equal([]);
        });

        it("recommended array is undefined", () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.searchQuery").returns(undefined);
            expect(exploregens["getRecommendedQuery"]()).to.be.deep.equal([]);
        });

        it("recommended array is a valid strings array", () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.searchQuery").returns(["query1", "query2"]);
            expect(exploregens["getRecommendedQuery"]()).to.be.deep.equal(["query1", "query2"]);
        });

        it("recommended array is a valid strings array with duplicate string", () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.searchQuery").returns(["query1", "query1"]);
            expect(exploregens["getRecommendedQuery"]()).to.be.deep.equal(["query1"]);
        });
    });

    describe("updateAllInstalledGenerators", () => {
        it("generators auto update is false", async () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.autoUpdate", true).returns(false);
            workspaceConfigMock.expects("get").never();
            await exploregens["updateAllInstalledGenerators"]();
        });

        it("generators auto update is true and downloadedGenerators returns undefined", async () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.autoUpdate", true).returns(true);
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns(undefined);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves("");
            loggerMock.expects("debug").never();

            await exploregens["updateAllInstalledGenerators"]();
        });

        it("generators auto update is true and downloadedGenerators returns a generators list", async () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").twice().returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({stdout: "+-- generator-aa@1.2.16 +-- @sap/generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq"});
            
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.autoUpdate", true).returns(true);
            const updatingMessage = "Auto updating of installed generators...";
            loggerMock.expects("debug").withExactArgs(updatingMessage);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(updatingMessage).returns(statusBarMessage);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs("Finished auto updating of installed generators.", 10000);
            
            loggerMock.expects("debug").withExactArgs("Installing the latest version of generator-aa ...");
            loggerMock.expects("debug").withExactArgs("Installing the latest version of @sap/generator-bb ...");

            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", true]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["@sap/generator-bb", true]);
           
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", "generator-aa")).resolves();
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", "@sap/generator-bb")).resolves();
            
            loggerMock.expects("debug").withExactArgs("generator-aa successfully installed.");
            loggerMock.expects("debug").withExactArgs("@sap/generator-bb successfully installed.");

            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", false]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["@sap/generator-bb", false]);

            await exploregens["updateAllInstalledGenerators"]();
        });

        it("installGenerator fails on exec method", async () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").twice().returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({stdout: "+-- generator-aa@1.2.16"});
            
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.autoUpdate", true).returns(true);
            const updatingMessage = "Auto updating of installed generators...";
            loggerMock.expects("debug").withExactArgs(updatingMessage);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(updatingMessage).returns(statusBarMessage);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs("Finished auto updating of installed generators.", 10000);
            loggerMock.expects("debug").withExactArgs("Installing the latest version of generator-aa ...");
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", true]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", false]);

            const errorMessage = `util.promisify failure.`;
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", "generator-aa")).throws(errorMessage);
            loggerMock.expects("error").withExactArgs(errorMessage);
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(`Failed to install generator-aa: ${errorMessage}`).resolves();

            await exploregens["updateAllInstalledGenerators"]();
        });
    });

    describe("getGenerators", () => {

        it("input string is empty", () => {
            expect(exploregens["getGenerators"]("")).to.be.deep.equal([]);
        });

        it("input string is valid string", () => {
            expect(exploregens["getGenerators"]("+-- generator-aa@1.2.16 +-- generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq +-- generator-cc@2.0.4 +-- @sap-test/generator-dd@4.2.4")).to.be.deep.equal(["generator-aa", "generator-bb","generator-cc", "@sap-test/generator-dd"]);

        });

        it("input string is valid string but without generators", () => {
            expect(exploregens["getGenerators"]("hfksajhsfiweurfjh")).to.be.deep.equal([]);
        });
    });

    describe("updateBeingHandledGenerator", () => {

        it("invoke method with isBeingHandled param equel true", () => {
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", true]);
            expect(exploregens["updateBeingHandledGenerator"]("generator-aa", true));
        });

        it("invoke method with isBeingHandled param equel false", () => {
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", false]);
            expect(exploregens["updateBeingHandledGenerator"]("generator-aa", false));
        });
    });

    describe("isInstalled", () => {
        const gen: any = {
            package: {
                name: "generator-aa"
            }
        };

        it("cache is empty", async () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({});
            exploregens["cachedInstalledGeneratorsPromise"] = exploregens["getAllInstalledGenerators"]();
            const res: boolean = await exploregens["isInstalled"](gen);
            expect(res).to.be.false;
        });

        it("generator-aa generator should be in the cache", async () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({stdout: "+-- generator-aa@1.2.16 +-- generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq +-- generator-cc@2.0.4"});
            exploregens["cachedInstalledGeneratorsPromise"] = exploregens["getAllInstalledGenerators"]();
            const res: boolean = await exploregens["isInstalled"](gen);
            expect(res).to.be.true;
        });

        it("generator-aa generator is not in the cache", async () => {
            workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({stdout: "+-- generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq +-- generator-cc@2.0.4"});
            exploregens["cachedInstalledGeneratorsPromise"] = exploregens["getAllInstalledGenerators"]();
            const res: boolean = await exploregens["isInstalled"](gen);
            expect(res).to.be.false;
        });
    });

    describe("uninstallGenerator", () => {
        const gen: any = {
            package: {
                name: "generator-aa"
            }
        };

        it("uninstall succsessfully", async () => {
            const uninstallingMessage = `Uninstalling ${gen.package.name} ...`;
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(uninstallingMessage);
            loggerMock.expects("debug").withExactArgs(uninstallingMessage);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmUninstallCommand"]("-g", gen.package.name)).resolves();
            const successMessage = `${gen.package.name} successfully uninstalled.`;
            loggerMock.expects("debug").withExactArgs(successMessage);
            vscodeWindowMock.expects("showInformationMessage").withExactArgs(successMessage);

            expect(exploregens["uninstallGenerator"]("-g", gen.package.name));
        });

        it("uninstall fails on exec method", async () => {
            const uninstallingMessage = `Uninstalling ${gen.package.name} ...`;
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(uninstallingMessage);
            loggerMock.expects("debug").withExactArgs(uninstallingMessage);

            const errorMessage = `uninstall failure.`;
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmUninstallCommand"]("-g", gen.package.name)).throws(errorMessage);
            loggerMock.expects("error").withExactArgs(errorMessage);
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(`Failed to uninstall ${gen.package.name}: ${errorMessage}`).resolves();

            expect(exploregens["uninstallGenerator"]("-g", gen.package.name));
        });
    });    
});
