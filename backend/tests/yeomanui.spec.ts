import * as mocha from "mocha";
import * as sinon from "sinon";
const datauri = require("datauri");
import * as fsextra from "fs-extra";
import { expect } from "chai";
import * as _ from "lodash";
import * as path from "path";
import {YeomanUI, IGeneratorQuestion} from "../src/yeomanui";
import * as yeomanEnv from "yeoman-environment";
import { YouiLog } from "../src/youi-log";
import { YouiEvents } from '../src/youi-events';
import { IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { GeneratorType, GeneratorFilter } from "../src/filter";
import { IChildLogger } from "@vscode-logging/logger";
import * as os from "os";

describe('yeomanui unit test', () => {
    let sandbox: any;
    let yeomanEnvMock: any;
    let fsExtraMock: any;
    let datauriMock: any;
    const UTF8: string = "utf8";
    const PACKAGE_JSON: string = "package.json";

    const choiceMessage = 
        "Some quick example text of the generator description. This is a long text so that the example will look good.";
    class TestEvents implements YouiEvents {
        public doGeneratorDone(success: boolean, message: string, targetPath?: string): void {
            return;
        }
        public doGeneratorInstall(): void {
            return;
        }
    }
    class TestRpc implements IRpc {
        public  timeout: number;
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
    class TestLog implements YouiLog {
        public log(): void {
            return;
        }            
        public writeln(): void {
            return;
        } 
        public create(): void {
            return;
        }  
        public force(): void {
            return;
        } 
        public conflict(): void {
            return;
        }  
        public identical(): void {
            return;
        }  
        public skip(): void {
            return;
        } 
        public showOutput(): boolean {
            return false;
        }  
    }

    const testLogger = {debug: () => {}, error: () => {}, fatal: () => {}, warn: () => {}, info: () => {}, trace: () => {}, getChildLogger: () => ({} as IChildLogger)};

    const rpc = new TestRpc();
    const logger = new TestLog();
    const youiEvents = new TestEvents();
    const yeomanUi: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        yeomanEnvMock = sandbox.mock(yeomanEnv);
        fsExtraMock = sandbox.mock(fsextra);
        datauriMock = sandbox.mock(datauri);
    });

    afterEach(() => {
        yeomanEnvMock.verify();
        fsExtraMock.verify();
        datauriMock.verify();
    });

    describe("showPrompt", () => {
        it("prompt without questions", async () => {
            const answers = await yeomanUi.showPrompt([]);
            // tslint:disable-next-line: no-unused-expression
            expect(answers).to.be.empty;
        });
    });

    describe("getGenerators", () => {
        let envMock: any;

        const environment = {
            lookup: async (cb: any) => {
                return cb.call();
            },
            getGeneratorsMeta: (): any => {
                return {};
            },
            getGeneratorNames: (): string[] => {
                return [];
            }
        };

        beforeEach(() => {
            envMock = sandbox.mock(environment);
            yeomanEnvMock.expects("createEnv").returns(environment);
        });

        afterEach(() => {
            envMock.verify();
        });

        it("there are no generators", async () => {
            const result = await yeomanUi.getGenerators();
            const generatorQuestion: IGeneratorQuestion = {
                type: "generators",
                name: "name",
                message: "",
                choices: []
              };
            expect(result).to.be.deep.equal({ name: "Select Generator", questions: [generatorQuestion] });
        });

        it("get generators with type project", async () => {
            envMock.expects("getGeneratorsMeta").returns({
                "test1:app": {
                    packagePath: "test1Path"
                },
                "test2:app": {
                    packagePath: "test2Path"
                },
                "test3:app": {
                    packagePath: "test3Path"
                },
                "test4:app": {
                    packagePath: "test4Path"
                },
                "test5:app": {
                    packagePath: "test5Path"
                }
            });
            envMock.expects("getGeneratorNames").returns(["test1", "test2", "test3", "test4", "test5"]);

            fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project_test"}}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test4Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test5Description"}`);

            const genFilter: GeneratorFilter = GeneratorFilter.create({type: GeneratorType.project});
            yeomanUi.setGenFilter(genFilter);
            const result = await yeomanUi.getGenerators();

            expect(result.questions[0].choices).to.have.lengthOf(2);
            const test1Choice = result.questions[0].choices[0];
            const test2Choice = result.questions[0].choices[1];
            expect(test1Choice.name).to.be.equal("test1");
            expect(test1Choice.message).to.be.equal("test1Description");
            expect(test2Choice.name).to.be.equal("test4");
            expect(test2Choice.message).to.be.equal("test4Description");
        });

        it("get generators with type module", async () => {
            envMock.expects("getGeneratorsMeta").returns({
                "test1:app": {
                    packagePath: "test1Path"
                },
                "test2:app": {
                    packagePath: "test2Path"
                },
                "test3:app": {
                    packagePath: "test3Path"
                },
                "test4:app": {
                    packagePath: "test4Path"
                },
                "test5:app": {
                    packagePath: "test5Path"
                }
            });
            envMock.expects("getGeneratorNames").returns(["test1", "test2", "test3", "test4", "test5"]);

            fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project_test"}}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test4Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test5Description"}`);

            const genFilter = GeneratorFilter.create({type: GeneratorType.module});
            yeomanUi.setGenFilter(genFilter);
            const result = await yeomanUi.getGenerators();

            expect(result.questions[0].choices).to.have.lengthOf(1);
            const test1Choice = result.questions[0].choices[0];
            expect(test1Choice.name).to.be.equal("test3");
            expect(test1Choice.message).to.be.equal(choiceMessage);
        });

        it("get generators all generators", async () => {
            envMock.expects("getGeneratorsMeta").returns({
                "test1:app": {
                    packagePath: "test1Path"
                },
                "test2:app": {
                    packagePath: "test2Path"
                },
                "test3:app": {
                    packagePath: "test3Path"
                },
                "test4:app": {
                    packagePath: "test4Path"
                },
                "test5:app": {
                    packagePath: "test5Path"
                },
                "test6:app": {
                    packagePath: "test6Path"
                }
            });
            envMock.expects("getGeneratorNames").returns(["test1", "test2", "test3", "test4", "test5", "test6"]);

            fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project_test"}}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test4Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test5Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test6Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "all"}}`);

            yeomanUi.setGenFilter(GeneratorFilter.create());
            const result = await yeomanUi.getGenerators();

            expect(result.questions[0].choices).to.have.lengthOf(6);
        });

        it("get generators with accessible package.json", async () => {
            envMock.expects("getGeneratorsMeta").returns({
                "test1:app": {
                    packagePath: "test1Path"
                },
                "test2:app": {
                    packagePath: "test2Path"
                },
                "test3:app": {
                    packagePath: "test3Path"
                },
                "test4:app": {
                    packagePath: "test4Path"
                },
                "test5:app": {
                    packagePath: "test5Path"
                }
            });
            envMock.expects("getGeneratorNames").returns(["test1", "test2", "test3", "test4", "test5"]);

            fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).throws(new Error("test1Error"));
            fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).throws(new Error("test2Error"));
            fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test4Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test5Description"}`);

            const result = await yeomanUi.getGenerators();

            expect(result.questions[0].choices).to.have.lengthOf(3);
        });

        it("wrong generators filter type is provided", async () => {
            envMock.expects("getGeneratorsMeta").returns({
                "test1:app": {
                    packagePath: "test1Path"
                }
            });
            envMock.expects("getGeneratorNames").returns(["test1"]);

            fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project123"}, "description": "test4Description"}`);

            yeomanUi.setGenFilter(GeneratorFilter.create({type: GeneratorType.project}));
            const result = await yeomanUi.getGenerators();

            // tslint:disable-next-line: no-unused-expression
            expect(result.questions[0].choices).to.be.empty;
        });

        it("get generators with type project and categories cat1 and cat2", async () => {
            envMock.expects("getGeneratorsMeta").returns({
                "test1:app": {
                    packagePath: "test1Path"
                },
                "test2:app": {
                    packagePath: "test2Path"
                },
                "test3:app": {
                    packagePath: "test3Path"
                },
                "test4:app": {
                    packagePath: "test4Path"
                },
                "test5:app": {
                    packagePath: "test5Path"
                }
            });
            envMock.expects("getGeneratorNames").returns(["test1", "test2", "test3", "test4", "test5"]);

            fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project", "categories": ["cat2"]}, "description": "test1Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project", "categories": ["cat2", "cat1"]}}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project", "categories": ["cat1"]}, "description": "test4Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test5Description"}`);

            const genFilter: GeneratorFilter = GeneratorFilter.create({type: GeneratorType.project, categories: ["cat1", "cat2"]});
            yeomanUi.setGenFilter(genFilter);
            const result = await yeomanUi.getGenerators();

            expect(result.questions[0].choices).to.have.lengthOf(3);
            const test1Choice = result.questions[0].choices[0];
            const test2Choice = result.questions[0].choices[1];
            const test3Choice = result.questions[0].choices[2];
            expect(test1Choice.name).to.be.equal("test1");
            expect(test2Choice.name).to.be.equal("test2");
            expect(test3Choice.name).to.be.equal("test4");
        });

        it("get generators with displayName", async () => {
            envMock.expects("getGeneratorsMeta").returns({
                "test1-project:app": {
                    packagePath: "test1Path"
                },
                "test2-module:app": {
                    packagePath: "test2Path"
                },
                "test3:app": {
                    packagePath: "test3Path"
                }
            });
            envMock.expects("getGeneratorNames").returns(["test1-project", "test2-module", "test3"]);

            fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test3Description", "displayName": "3rd - Test"}`);

            yeomanUi.setGenFilter(GeneratorFilter.create());
            const result = await yeomanUi.getGenerators();

            expect(result.questions[0].choices).to.have.lengthOf(3);
            const test1Choice = result.questions[0].choices[0];
            const test2Choice = result.questions[0].choices[1];
            const test3Choice = result.questions[0].choices[2];
            expect(test1Choice.prettyName).to.be.equal("Test1 Project");
            expect(test2Choice.prettyName).to.be.equal("Test2 Module");
            expect(test3Choice.prettyName).to.be.equal("3rd - Test");
        });

        it("get generators with homepage", async () => {
            envMock.expects("getGeneratorsMeta").returns({
                "test1-project:app": {
                    packagePath: "test1Path"
                },
                "test2-module:app": {
                    packagePath: "test2Path"
                },
                "test3:app": {
                    packagePath: "test3Path"
                }
            });
            envMock.expects("getGeneratorNames").returns(["test1-project", "test2-module", "test3"]);

            fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description", "homepage": "https://myhomepage.com/ANY/generator-test1-project#readme"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}, "homepage": "https://myhomepage.com/ANY/generator-test2-module#readme"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test3Description"}`);

            yeomanUi.setGenFilter(GeneratorFilter.create());
            const result = await yeomanUi.getGenerators();

            expect(result.questions[0].choices).to.have.lengthOf(3);
            const test1Choice = result.questions[0].choices[0];
            const test2Choice = result.questions[0].choices[1];
            const test3Choice = result.questions[0].choices[2];
            expect(test1Choice.homepage).to.be.equal("https://myhomepage.com/ANY/generator-test1-project#readme");
            expect(test2Choice.homepage).to.be.equal("https://myhomepage.com/ANY/generator-test2-module#readme");
            expect(test3Choice.homepage).to.be.equal("");
        });
    });

    describe("funcReplacer", () => {
        it("with function", () => {
            const res = YeomanUI["funcReplacer"]("key", function() {});
            // tslint:disable-next-line: no-unused-expression
            expect(res).to.be.equal("__Function");
        });

        it("without function", () => {
            const res = YeomanUI["funcReplacer"]("key", "value");
            // tslint:disable-next-line: no-unused-expression
            expect(res).to.be.equal("value");
        });
    });

    it("toggleOutput", () => {
        const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);
        const res = yeomanUiInstance.toggleOutput();
        // tslint:disable-next-line: no-unused-expression
        expect(res).to.be.false;
    });

    it("logMessage", () => {
        const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);
        const res = yeomanUiInstance.logMessage("message");
        // tslint:disable-next-line: no-unused-expression
        expect(res).to.be.undefined;
    });

    it("setCwd", () => {
        const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger, undefined,  "testpathbefore");
        expect(yeomanUiInstance.getCwd()).equal("testpathbefore");
        const res = yeomanUiInstance.setCwd("testpathafter");
        // tslint:disable-next-line: no-unused-expression
        expect(res).to.be.undefined;
        expect(yeomanUiInstance.getCwd()).equal("testpathafter");
    });

    it("defaultOutputPath", () => {
        const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);
        const projectsPath = path.join(os.homedir(), 'projects');
        expect(yeomanUiInstance.getCwd()).equal(projectsPath);
    });

    it("getErrorInfo", () => {
        const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);
        const errorInfo: string = "Error Info";
        const res = yeomanUiInstance["getErrorInfo"](errorInfo);
        // tslint:disable-next-line: no-unused-expression
        expect(res).to.be.equal(errorInfo);
    });

    describe("setGenInstall", () => {
        it("install method not exist", () => {
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);
            const gen: any = {};
            yeomanUiInstance["setGenInstall"](gen);
            // tslint:disable-next-line: no-unused-expression
            expect(gen.__proto__.install).to.be.undefined;
        });

        it("install method exists", () => {
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);
            class GenTest {
               public install(): any{
                   return "original_install";
               }
            }
            const gen: any = new GenTest();
            // tslint:disable-next-line: no-unused-expression
            expect(gen.__proto__.install).to.be.not.undefined;

            const installSpy = sandbox.spy(youiEvents,"doGeneratorInstall");
            yeomanUiInstance["setGenInstall"](gen);
            gen.install();
            // tslint:disable-next-line: no-unused-expression
            expect(installSpy.called).to.be.true;
            installSpy.restore();
        });
    });

    describe("getEnv", () => {
        const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);
        const testEnv = yeomanUiInstance["getEnv"]();
        const nodemodules = YeomanUI["NODE_MODULES"];
        testEnv.getNpmPaths = (localOnly: boolean = false): string[] => {
            return localOnly ? 
                [path.join("localPath1", nodemodules), path.join("localPath2", nodemodules)] : 
                [path.join("path1", nodemodules), path.join("path2", nodemodules), path.join("localPath1", nodemodules), path.join("localPath2", nodemodules)];
        };

        beforeEach(() => {
            YeomanUI["cwd"] = path.join("root/project/folder");
            yeomanEnvMock.expects("createEnv").returns(testEnv);
        });

        it("env.getNpmPaths - localOnly is false, isWin32 is true", () => {
            YeomanUI["isWin32"] = true;
            const env = yeomanUi["getEnv"]();
            const res = env.getNpmPaths();
            expect(res).to.have.lengthOf(7);
            expect(res).to.include(path.join("root", nodemodules));
            expect(res).to.include(path.join("root", "project", nodemodules));
            expect(res).to.include(path.join("root", "project", "folder", nodemodules));
            expect(res).to.include(path.join("path1", nodemodules));
            expect(res).to.include(path.join("path2", nodemodules));
            expect(res).to.include(path.join("localPath1", nodemodules));
            expect(res).to.include(path.join("localPath2", nodemodules));
        });

        it("env.getNpmPaths - localOnly is true, isWin32 is true", () => {
            YeomanUI["isWin32"] = true;
            const env = yeomanUi["getEnv"]();
            const res = env.getNpmPaths(true);
            expect(res).to.have.lengthOf(5);
            expect(res).to.include(path.join("root", nodemodules));
            expect(res).to.include(path.join("root", "project", nodemodules));
            expect(res).to.include(path.join("root", "project", "folder", nodemodules));
            expect(res).to.include(path.join("localPath1", nodemodules));
            expect(res).to.include(path.join("localPath2", nodemodules));
        });

        it("env.getNpmPaths - localOnly is false, isWin32 is false", () => {
            YeomanUI["isWin32"] = false;
            const env = yeomanUi["getEnv"]();
            const res = env.getNpmPaths();
            expect(res).to.have.lengthOf(7);
            expect(res).to.include(path.join(path.sep, "root", nodemodules));
            expect(res).to.include(path.join(path.sep, "root", "project", nodemodules));
            expect(res).to.include(path.join(path.sep, "root", "project", "folder", nodemodules));
            expect(res).to.include(path.join("path1", nodemodules));
            expect(res).to.include(path.join("path2", nodemodules));
            expect(res).to.include(path.join("localPath1", nodemodules));
            expect(res).to.include(path.join("localPath2", nodemodules));
        });

        it("env.getNpmPaths - localOnly is true, isWin32 is false", () => {
            YeomanUI["isWin32"] = false;
            const env = yeomanUi["getEnv"]();
            const res = env.getNpmPaths(true);
            expect(res).to.have.lengthOf(5);
            expect(res).to.include(path.join(path.sep, "root", nodemodules));
            expect(res).to.include(path.join(path.sep, "root", "project", nodemodules));
            expect(res).to.include(path.join(path.sep, "root", "project", "folder", nodemodules));
            expect(res).to.include(path.join("localPath1", nodemodules));
            expect(res).to.include(path.join("localPath2", nodemodules));
        });
    });

    describe("onGeneratorSuccess - onGeneratorFailure", () => {
        let doGeneratorDoneSpy: any;

        beforeEach(() => {
            doGeneratorDoneSpy = sandbox.spy(youiEvents, "doGeneratorDone");
        });

        afterEach(() => {
            doGeneratorDoneSpy.restore();
        });

        it("onGeneratorSuccess", () => {
            yeomanUi["onGeneratorSuccess"]("testGenName", "testDestinationRoot");
            // tslint:disable-next-line: no-unused-expression
            expect(doGeneratorDoneSpy.calledWith(true, "The 'testGenName' project has been generated.", "testDestinationRoot")).to.be.true;
        });

        it("onGeneratorFailure", async () => {
            await yeomanUi["onGeneratorFailure"]("testGenName", "testError");
            // tslint:disable-next-line: no-unused-expression
            expect(doGeneratorDoneSpy.calledWith(false, "testGenName generator failed.\ntestError")).to.be.true;
        });
    });

    describe("Custom Question Event Handlers", async () => {
        it("addCustomQuestionEventHandlers()", async () => {
            const testEventFunction = () => {
                return true;
            };
            const questions = [
                {
                    name:"q1",
                    guiType: "questionType"
                }
            ];
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);

            yeomanUiInstance["addCustomQuestionEventHandlers"](questions);
            expect(questions[0]).to.not.have.property("testEvent");

            yeomanUiInstance.registerCustomQuestionEventHandler("questionType", "testEvent", testEventFunction);
            yeomanUiInstance["addCustomQuestionEventHandlers"](questions);
            expect(questions[0]).to.have.property("testEvent");
            expect((questions[0] as any)["testEvent"]).to.equal(testEventFunction);
        });
    });

    describe("evaluateMethod()", async () => {
        it("custom question events", async () => {
            const testEventFunction = () => {
                return true;
            };
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);
            yeomanUiInstance.registerCustomQuestionEventHandler("questionType", "testEvent", testEventFunction);
            yeomanUiInstance["currentQuestions"] = [{name:"question1", guiType: "questionType"}];
            const response = await yeomanUiInstance.evaluateMethod(null, "question1", "testEvent");
            expect(response).to.be.true;
        });

        it("question method is called", async () => {
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);
            yeomanUiInstance["currentQuestions"] = [{name:"question1", method1:()=>{
                return true;
            }}];
            const response = await yeomanUiInstance.evaluateMethod(null, "question1", "method1");
            // tslint:disable-next-line: no-unused-expression
            expect(response).to.be.true;
        });

        it("no questions", async () => {
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);
            const response = await yeomanUiInstance.evaluateMethod(null, "question1", "method1");
            expect(response).to.be.undefined;
        });

        it("method throws exception", async () => {
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, logger, testLogger);
            yeomanUiInstance["gen"] = Object.create({});
            yeomanUiInstance["gen"].options = {};
            yeomanUiInstance["currentQuestions"] = [{name:"question1", method1:()=>{
                throw new Error("Error");
            }}];
            try {
                await yeomanUiInstance.evaluateMethod(null, "question1", "method1");
            } catch(e) {
                expect(e.toString()).to.contain("method1");
            }
        });
    });
});
