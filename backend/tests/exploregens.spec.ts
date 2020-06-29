import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc, IPromiseCallbacks, IMethod } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as npmFetch from 'npm-registry-fetch';
import { mockVscode } from "./mockUtil";
import messages from "../src/exploreGensMessages";

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

    it("init", async () => {
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["getFilteredGenerators"], thisArg: exploregens });
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["install"], thisArg: exploregens });
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["uninstall"], thisArg: exploregens });
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["isInstalled"], thisArg: exploregens });
        rpcMock.expects("registerMethod").withExactArgs({ func: exploregens["getRecommendedQuery"], thisArg: exploregens });

        workspaceConfigMock.expects("get").withExactArgs("Explore Generators.installationLocation").returns("/home/user/projects");
        exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("--prefix /home/user/projects")).rejects({ stdout: "+-- generator-aa@1.2.16 +-- generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq +-- @sap/generator-cc@2.0.4" });
        exploregens.init(rpc);
        const installedGenerators = await exploregens["cachedInstalledGeneratorsPromise"];
        expect(installedGenerators).includes("generator-aa");
        expect(installedGenerators).includes("generator-bb");
        expect(installedGenerators).includes("@sap/generator-cc");
    });

    describe("install", () => {
        const gen: any = {
            package: {
                name: "gen-test"
            }
        };

        it("update already downloaded generator", async () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({ stdout: "+-- generator-aa@1.2.16 +-- generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq +-- generator-cc@2.0.4" });
            exploregens["cachedInstalledGeneratorsPromise"] = exploregens["getAllInstalledGenerators"]();

            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(messages.installing(gen.package.name)).returns(statusBarMessage);
            loggerMock.expects("debug").withExactArgs(messages.installing(gen.package.name));
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", gen.package.name));
            loggerMock.expects("debug").withExactArgs(messages.installed(gen.package.name));
            vscodeWindowMock.expects("showInformationMessage").withExactArgs(messages.installed(gen.package.name));
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, true]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, false]);

            await exploregens["install"](gen);
        });

        it("download new generator", async () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({});
            exploregens["cachedInstalledGeneratorsPromise"] = exploregens["getAllInstalledGenerators"]();

            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(messages.installing(gen.package.name)).returns(statusBarMessage);
            loggerMock.expects("debug").withExactArgs(messages.installing(gen.package.name));
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, true]);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", gen.package.name));
            loggerMock.expects("debug").withExactArgs(messages.installed(gen.package.name));
            vscodeWindowMock.expects("showInformationMessage").withExactArgs(messages.installed(gen.package.name));
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, false]);

            await exploregens["install"](gen);
        });

        it("an error is thrown", async () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({ stdout: "+-- generator-aa@1.2.16 +-- generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq +-- generator-cc@2.0.4" });
            exploregens["cachedInstalledGeneratorsPromise"] = exploregens["getAllInstalledGenerators"]();

            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(messages.installing(gen.package.name)).returns(statusBarMessage);
            loggerMock.expects("debug").withExactArgs(messages.installing(gen.package.name));
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, true]);
            const errorMessage = "npm install failed";
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", gen.package.name)).throws(errorMessage);
            loggerMock.expects("error").withExactArgs(errorMessage);
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(messages.failed_to_install(gen.package.name) + `: ${errorMessage}`).resolves();
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, false]);
            statusBarMessageMock.expects("dispose");

            await exploregens["install"](gen);
        });
    });

    describe("getFilteredGenerators", async () => {
        it("query and recommended parameters are empty strings", async () => {
            const expectedResult = {
                objects: [{ package: { name: "obj1" } }, { package: { name: "obj2" } }],
                total: 5
            }
            const url = exploregens["getGensQueryURL"]("", "");
            npmFetchMock.expects("json").withExactArgs(url).resolves(expectedResult);
            const res = await exploregens["getFilteredGenerators"]();
            expect(res).to.be.deep.equal([expectedResult.objects, expectedResult.total]);
            expect(res[0][0].disabledToHandle).to.be.false;
            expect(res[0][1].disabledToHandle).to.be.false;
        });

        it("query parameter is some words", async () => {
            const expectedResult = {
                objects: [{ package: { name: "generator-aa" } }],
                total: 1
            }
            const url = exploregens["getGensQueryURL"]("test of query", "");
            npmFetchMock.expects("json").withExactArgs(url).resolves(expectedResult);
            exploregens["gensBeingHandled"] = ["generator-aa"];
            const res = await exploregens["getFilteredGenerators"]("test of query");
            expect(res[0]).to.be.deep.equal(expectedResult.objects);
            expect(res[1]).to.be.equal(expectedResult.total);
            expect(res[0][0].disabledToHandle).to.be.true;
        });

        it("npmFetch.json throws error", async () => {
            const expectedResult = {
                objects: [{ package: { name: "obj1" } }],
                total: 1
            }
            const url = exploregens["getGensQueryURL"]("test of query", "");
            const errorMessage = "npmFetch enexpected error.";
            npmFetchMock.expects("json").withExactArgs(url).throws(errorMessage);

            loggerMock.expects("error").withExactArgs(errorMessage);

            const prefixMessage = messages.failed_to_get(url);
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(`${prefixMessage}: ${errorMessage}`).resolves();
            await exploregens["getFilteredGenerators"]("test of query");
        });
    });

    describe("getGeneratorsLocationParams", () => {
        const TESTVALUE = "test location"

        it("location empty", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            expect(exploregens["getGeneratorsLocationParams"]()).to.be.deep.equal("-g");
        });

        it("location undefined", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns(undefined);
            expect(exploregens["getGeneratorsLocationParams"]()).to.be.deep.equal("-g");
        });

        it("location is a valid string", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns(TESTVALUE);
            expect(exploregens["getGeneratorsLocationParams"]()).to.be.deep.equal(`--prefix ${TESTVALUE}`);
        });

        it("location is a string with unnecessary spaces", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns(`   ${TESTVALUE}   `);
            expect(exploregens["getGeneratorsLocationParams"]()).to.be.deep.equal(`--prefix ${TESTVALUE}`);
        });
    });

    describe("getRecommendedQuery", () => {
        it("recommended array empty", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["SEARCH_QUERY"]).returns([]);
            expect(exploregens["getRecommendedQuery"]()).to.be.deep.equal([]);
        });

        it("recommended array is undefined", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["SEARCH_QUERY"]).returns(undefined);
            expect(exploregens["getRecommendedQuery"]()).to.be.deep.equal([]);
        });

        it("recommended array is a valid strings array", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["SEARCH_QUERY"]).returns(["query1", "query2"]);
            expect(exploregens["getRecommendedQuery"]()).to.be.deep.equal(["query1", "query2"]);
        });

        it("recommended array is a valid strings array with duplicate string", () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["SEARCH_QUERY"]).returns(["query1", "query1"]);
            expect(exploregens["getRecommendedQuery"]()).to.be.deep.equal(["query1"]);
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
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns(undefined);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves("");
            loggerMock.expects("debug").never();

            await exploregens["doGeneratorsUpdate"](testVscode.context);
        });

        it("generators auto update is true and downloadedGenerators returns a generators list", async () => {
            globalStateMock.expects("get").withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0).returns(100);

            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).twice().returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({ stdout: "+-- generator-aa@1.2.16 +-- @sap/generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq" });

            workspaceConfigMock.expects("get").withExactArgs(exploregens["AUTO_UPDATE"], true).returns(true);
            loggerMock.expects("debug").withExactArgs(messages.auto_update_started);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(messages.auto_update_started).returns(statusBarMessage);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(messages.auto_update_finished, 10000);

            loggerMock.expects("debug").withExactArgs(messages.installing("generator-aa"));
            loggerMock.expects("debug").withExactArgs(messages.installing("@sap/generator-bb"));

            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", true]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["@sap/generator-bb", true]);

            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", "generator-aa")).resolves();
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", "@sap/generator-bb")).resolves();

            loggerMock.expects("debug").withExactArgs(messages.installed("generator-aa"));
            loggerMock.expects("debug").withExactArgs(messages.installed("@sap/generator-bb"));

            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", false]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["@sap/generator-bb", false]);

            await exploregens["doGeneratorsUpdate"](testVscode.context);
        });

        it("installGenerator fails on exec method", async () => {
            globalStateMock.expects("get").withExactArgs(exploregens["LAST_AUTO_UPDATE_DATE"], 0).returns(100);

            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).twice().returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({ stdout: "+-- generator-aa@1.2.16" });

            workspaceConfigMock.expects("get").withExactArgs(exploregens["AUTO_UPDATE"], true).returns(true);
            loggerMock.expects("debug").withExactArgs(messages.auto_update_started);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(messages.auto_update_started).returns(statusBarMessage);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(messages.auto_update_finished, 10000);
            loggerMock.expects("debug").withExactArgs(messages.installing("generator-aa"));
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", true]);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", ["generator-aa", false]);

            const errorMessage = `util.promisify failure.`;
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", "generator-aa")).throws(errorMessage);
            loggerMock.expects("error").withExactArgs(errorMessage);
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(messages.failed_to_install("generator-aa") + `: ${errorMessage}`).resolves();

            await exploregens["doGeneratorsUpdate"](testVscode.context);
        });
    });

    describe("getGenerators", () => {

        it("input string is empty", () => {
            expect(exploregens["getGenerators"]("")).to.be.deep.equal([]);
        });

        it("input string is valid string", () => {
            expect(exploregens["getGenerators"]("+-- generator-aa@1.2.16 +-- generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq +-- generator-cc@2.0.4 +-- @sap-test/generator-dd@4.2.4")).to.be.deep.equal(["generator-aa", "generator-bb", "generator-cc", "@sap-test/generator-dd"]);

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
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({});
            exploregens["cachedInstalledGeneratorsPromise"] = exploregens["getAllInstalledGenerators"]();
            const res: boolean = await exploregens["isInstalled"](gen);
            expect(res).to.be.false;
        });

        it("generator-aa generator should be in the cache", async () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({ stdout: "+-- generator-aa@1.2.16 +-- generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq +-- generator-cc@2.0.4" });
            exploregens["cachedInstalledGeneratorsPromise"] = exploregens["getAllInstalledGenerators"]();
            const res: boolean = await exploregens["isInstalled"](gen);
            expect(res).to.be.true;
        });

        it("generator-aa generator is not in the cache", async () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({ stdout: "+-- generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq +-- generator-cc@2.0.4" });
            exploregens["cachedInstalledGeneratorsPromise"] = exploregens["getAllInstalledGenerators"]();
            const res: boolean = await exploregens["isInstalled"](gen);
            expect(res).to.be.false;
        });
    });

    describe("uninstall", () => {
        const gen: any = {
            package: {
                name: "generator-aa"
            }
        };

        it("uninstall succsessfully", async () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");

            const uninstallingMessage = messages.uninstalling(gen.package.name);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(uninstallingMessage).returns(statusBarMessage);
            loggerMock.expects("debug").withExactArgs(uninstallingMessage);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmUninstallCommand"]("-g", gen.package.name)).resolves();
            const successMessage = messages.uninstalled(gen.package.name);
            loggerMock.expects("debug").withExactArgs(successMessage);
            vscodeWindowMock.expects("showInformationMessage").withExactArgs(successMessage);
            statusBarMessageMock.expects("dispose");

            await expect(exploregens["uninstall"](gen));
        });

        it("uninstall fails on exec method", async () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");

            const uninstallingMessage = messages.uninstalling(gen.package.name);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(uninstallingMessage).returns(statusBarMessage);;
            loggerMock.expects("debug").withExactArgs(uninstallingMessage);

            const errorMessage = `uninstall failure.`;
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmUninstallCommand"]("-g", gen.package.name)).throws(errorMessage);
            loggerMock.expects("error").withExactArgs(errorMessage);
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(messages.failed_to_uninstall(gen.package.name) + `: ${errorMessage}`).resolves();
            statusBarMessageMock.expects("dispose");

            await expect(exploregens["uninstall"](gen));
        });
    });

    describe("installGenerator", () => {
        const gen: any = {
            package: {
                name: "generator-aa"
            }
        };

        it("generator is already installed", async () => {
            const installingMessage = messages.installing(gen.package.name);
            vscodeWindowMock.expects("setStatusBarMessage").withExactArgs(installingMessage);
            loggerMock.expects("debug").withExactArgs(installingMessage);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, true]);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", gen.package.name)).resolves();
            const successMessage = messages.installed(gen.package.name);
            loggerMock.expects("debug").withExactArgs(successMessage);
            vscodeWindowMock.expects("showInformationMessage").withExactArgs(successMessage);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, false]);

            expect(exploregens["installGenerator"]("-g", gen.package.name));
        });

        it("generator doesn't installed", async () => {
            loggerMock.expects("debug").withExactArgs(messages.installing(gen.package.name));
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, true]);
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", gen.package.name)).resolves();
            const successMessage = messages.installed(gen.package.name);
            loggerMock.expects("debug").withExactArgs(successMessage);
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, false]);

            expect(exploregens["installGenerator"]("-g", gen.package.name, false));
        });

        it("install fails on exec method", async () => {
            loggerMock.expects("debug").withExactArgs(messages.installing(gen.package.name));
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, true]);
            const errorMessage = `install failure.`;
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmInstallCommand"]("-g", gen.package.name)).throws(errorMessage);
            loggerMock.expects("error").withExactArgs(errorMessage);
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(messages.failed_to_install(gen.package.name) + `: ${errorMessage}`).resolves();
            rpcMock.expects("invoke").withExactArgs("updateBeingHandledGenerator", [gen.package.name, false]);

            expect(exploregens["installGenerator"]("-g", gen.package.name, false));
        });
    });

    describe("getGensQueryURL", () => {
        const api_endpoint = "http://registry.npmjs.com/-/v1/search?text=";

        it("query and recommended are empty", () => {
            const res = `${api_endpoint}%20%20keywords:yeoman-generator%20&size=25&ranking=popularity`
            expect(exploregens["getGensQueryURL"]("", "")).to.be.deep.equal(res);
        });

        it("query and recommended are valid string", () => {
            const res = `${api_endpoint}sap%20keywords:microsoft%20keywords:yeoman-generator%20&size=25&ranking=popularity`
            expect(exploregens["getGensQueryURL"]("sap", "keywords:microsoft")).to.be.deep.equal(res);
        });
    });

    describe("showAndLogError", () => {
        const api_endpoint = "http://registry.npmjs.com/-/v1/search?text=";

        it("query and recommended are empty", () => {
            loggerMock.expects("error").withExactArgs("error message");
            vscodeWindowMock.expects("showErrorMessage").withExactArgs(`in showAndLogError: error message`).resolves();

            expect(exploregens["showAndLogError"]("in showAndLogError", "error message"));
        });
    });

    describe("getAllInstalledGenerators", () => {
        const gen: any = {
            package: {
                name: "generator-aa"
            }
        };

        it("No generators installed", async () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({});

            const res = await exploregens["getAllInstalledGenerators"]();
            expect(res).to.have.lengthOf(0);
        });

        it("There are generators installed", async () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).resolves({ stdout: "+-- @sap/generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq +-- generator-cc@2.0.4" });

            const res = await exploregens["getAllInstalledGenerators"]();
            expect(res).contains("@sap/generator-bb", "generator-cc");
        });

        it("fails on exec method", async () => {
            workspaceConfigMock.expects("get").withExactArgs(exploregens["INSTALLATION_LOCATION"]).returns("");
            exploreGensMock.expects("exec").withExactArgs(exploregens["getNpmListCommand"]("-g")).rejects({ stdout: "+-- @sap/generator-bb@0.0.1 -> C:\wing\yeoman-ui\generator-foodq" });

            const res = await exploregens["getAllInstalledGenerators"]();
            expect(res).includes("@sap/generator-bb");
        });
    });
});
