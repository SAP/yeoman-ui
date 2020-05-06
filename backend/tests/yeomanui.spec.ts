import * as mocha from "mocha";
import * as sinon from "sinon";
const datauri = require("datauri");
import * as fsextra from "fs-extra";
import { expect } from "chai";
import * as _ from "lodash";
import * as path from "path";
import {YeomanUI} from "../src/yeomanui";
import {ReplayUtils} from "../src/replayUtils";
import * as yeomanEnv from "yeoman-environment";
import { YouiLog } from "../src/youi-log";
import { YouiEvents } from '../src/youi-events';
import { IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { GeneratorType, GeneratorFilter } from "../src/filter";
import { IChildLogger } from "@vscode-logging/logger";
import * as os from "os";
import { fail } from "assert";
import Environment = require("yeoman-environment");

describe('yeomanui unit test', () => {
    let sandbox: any;
    let yeomanEnvMock: any;
    let fsExtraMock: any;
    let datauriMock: any;
    let loggerMock: any;
    let rpcMock: any;
    let youiEventsMock: any;
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
    class TestOutputChannel implements YouiLog {
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
    const outputChannel = new TestOutputChannel();
    const youiEvents = new TestEvents();
    const yeomanUi: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {genFilter: GeneratorFilter.create(), messages: {select_generator_question_message: "test_question_message", select_generator_question_hint: "test_question_hint"}});

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
        rpcMock = sandbox.mock(rpc);
        loggerMock = sandbox.mock(testLogger);
        youiEventsMock = sandbox.mock(youiEvents);
    });

    afterEach(() => {
        yeomanEnvMock.verify();
        fsExtraMock.verify();
        datauriMock.verify();
        rpcMock.verify();
        loggerMock.verify();
        youiEventsMock.verify();
    });

    it("constructor", () => {
        try {
            // tslint:disable-next-line: no-unused-expression
            new YeomanUI(undefined, undefined, undefined, undefined, undefined);
            fail("contructor should throw an exception");
        } catch (error) {
            expect(error.message).to.be.equal("rpc must be set");
        }
    });

    describe.skip("receiveIsWebviewReady", () => {
        it("flow is successfull", async () => {
            rpcMock.expects("invoke").withArgs("showPrompt").resolves({generator: "testGenerator"});
            youiEventsMock.expects("doGeneratorDone").withArgs(false);
            await yeomanUi["receiveIsWebviewReady"]();
        });

        it("an error is thrown", async () => {
            loggerMock.expects("error");
            youiEventsMock.expects("doGeneratorDone").never();
            await yeomanUi["receiveIsWebviewReady"]();
        });
    });

    describe("showPrompt", () => {
        it("prompt without questions", async () => {
            const answers = await yeomanUi.showPrompt([]);
            // tslint:disable-next-line: no-unused-expression
            expect(answers).to.be.empty;
        });
    });

    describe.skip("getGenerators", () => {
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
            const result = await yeomanUi["getGeneratorsPrompt"]();
            const generatorQuestion: any = {
                type: "list",
                guiType: "tiles",
                guiOptions: {
                    hint: "test_question_hint"
                },
                name: "generator",
                message: "test_question_message",
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
            yeomanUi["uiOptions"] = {genFilter, messages: {}};
            const result = await yeomanUi["getGeneratorsPrompt"]();

            expect(result.questions[1].choices).to.have.lengthOf(2);
            const test1Choice = result.questions[1].choices[0];
            const test2Choice = result.questions[1].choices[1];
            expect(test1Choice.name).to.be.equal("Test1");
            expect(test1Choice.description).to.be.equal("test1Description");
            expect(test2Choice.name).to.be.equal("Test4");
            expect(test2Choice.description).to.be.equal("test4Description");
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
            yeomanUi["uiOptions"] = {genFilter, messages: {}};
            const result = await yeomanUi["getGeneratorsPrompt"]();

            expect(result.questions[0].choices).to.have.lengthOf(1);
            const test1Choice = result.questions[0].choices[0];
            expect(test1Choice.name).to.be.equal("Test3");
            expect(test1Choice.description).to.be.equal(choiceMessage);
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

            yeomanUi["uiOptions"] = {genFilter: GeneratorFilter.create({type: GeneratorType.all}), messages: {}};
            const result = await yeomanUi["getGeneratorsPrompt"]();

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

            yeomanUi["uiOptions"] = {genFilter: GeneratorFilter.create({type: GeneratorType.all}), messages: {}};
            const result = await yeomanUi["getGeneratorsPrompt"]();

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

            yeomanUi["uiOptions"] = {genFilter: GeneratorFilter.create({type: GeneratorType.project}), messages: {}};
            const result = await yeomanUi["getGeneratorsPrompt"]();

            // tslint:disable-next-line: no-unused-expression
            expect(result.questions[1].choices).to.be.empty;
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
            yeomanUi["uiOptions"].genFilter = genFilter;
            const result = await yeomanUi["getGeneratorsPrompt"]();

            expect(result.questions[1].choices).to.have.lengthOf(3);
            const test1Choice = result.questions[1].choices[0];
            const test2Choice = result.questions[1].choices[1];
            const test3Choice = result.questions[1].choices[2];
            expect(test1Choice.name).to.be.equal("Test1");
            expect(test2Choice.name).to.be.equal("Test2");
            expect(test3Choice.name).to.be.equal("Test4");
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

            yeomanUi["uiOptions"] = {genFilter: GeneratorFilter.create({type: GeneratorType.all}), messages: {}};
            const result = await yeomanUi["getGeneratorsPrompt"]();

            const choices = result.questions[0].choices;
            expect(choices).to.have.lengthOf(3);
            const test1Choice = choices[0];
            const test2Choice = choices[1];
            const test3Choice = choices[2];
            expect(test1Choice.name).to.be.equal("Test1 Project");
            expect(test2Choice.name).to.be.equal("Test2 Module");
            expect(test3Choice.name).to.be.equal("3rd - Test");
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

            yeomanUi["uiOptions"] = {genFilter: GeneratorFilter.create(), messages: {}};
            const result = await yeomanUi["getGeneratorsPrompt"]();

            const choices = result.questions[0].choices;
            expect(choices).to.have.lengthOf(3);
            const test1Choice = choices[0];
            const test2Choice = choices[1];
            const test3Choice = choices[2];
            expect(test1Choice.homepage).to.be.equal("https://myhomepage.com/ANY/generator-test1-project#readme");
            expect(test2Choice.homepage).to.be.equal("https://myhomepage.com/ANY/generator-test2-module#readme");
            expect(test3Choice.homepage).to.be.equal("");
        });
    });

    describe("funcReplacer", () => {
        it("with function", () => {
            const res = YeomanUI["funcReplacer"]("key", () => { return; });
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
        const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {genFilter: GeneratorFilter.create()});
        const res = yeomanUiInstance["toggleOutput"]();
        // tslint:disable-next-line: no-unused-expression
        expect(res).to.be.false;
    });

    it("setCwd", () => {
        const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {},  "testpathbefore");
        expect(yeomanUiInstance["getCwd"]()).equal("testpathbefore");
        yeomanUiInstance["setCwd"]("testpathafter");
        expect(yeomanUiInstance["getCwd"]()).equal("testpathafter");

        yeomanUiInstance["setCwd"](undefined);
        expect(yeomanUiInstance["getCwd"]()).equal(YeomanUI["PROJECTS"]);
    });

    it("setState", async () => {
        const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {},  "testpathbefore");
        // tslint:disable-next-line: no-unused-expression
        expect(await yeomanUiInstance.setState(null)).to.be.undefined;
        
        rpc.invoke = async () => {};
        const messages = {key: "value"};
        await yeomanUiInstance.setState(messages);
    });

    it("defaultOutputPath", () => {
        const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {});
        const projectsPath = path.join(os.homedir(), 'projects');
        expect(yeomanUiInstance["getCwd"]()).equal(projectsPath);
    });

    it("getErrorInfo", () => {
        const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, {});
        const errorInfo: string = "Error Info";
        const res = yeomanUiInstance["getErrorInfo"](errorInfo);
        // tslint:disable-next-line: no-unused-expression
        expect(res).to.be.equal(errorInfo);
    });

    describe("answersUtils", () => {
        it("setDefaults", () => {
            const questions = [
                {name: "q1", default: "a"},
                {name: "q2", default: () => { return "b";}},
                {name: "q3"}
            ];
            const answers = {
                q1: "x",
                q2: "y",
                q3: "z"
            };
            ReplayUtils.setDefaults(questions, answers);
            for (const index in questions) {
                const question = questions[index];
                switch (question.name) {
                    case "a":
                        expect((question as any)["answer"]).to.equal("x");
                        break;
                    case "b":
                        expect((question as any)["answer"]).to.equal("y");
                        break;
                    case "c":
                        expect((question as any)["answer"]).to.equal("z");
                        break;
                }
            }
        });
    });

    describe("setGenInstall", () => {
        it("install method not exist", () => {
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create());
            const gen: any = {};
            yeomanUiInstance["setGenInstall"](gen);
            // tslint:disable-next-line: no-unused-expression
            expect(gen.__proto__.install).to.be.undefined;
        });

        it("install method exists", () => {
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create());
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

    describe("showPrompt", async () => {
        it("returns answers", async () => {
            const firstName = "john";
            rpc.invoke = async () => {
                return {
                    firstName,
                    lastName: "doe"
                };
            };
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create());
            const questions = [{name: "q1"}];
            const response = await yeomanUiInstance.showPrompt(questions);
            expect (response.firstName).to.equal(firstName);
        });

        it("with back", async () => {
            const firstName = "john";
            const country = "denmark";

            (rpc.invoke as (methodName: string, params: any[]) => Promise<any>) = async (methodName: string, params: any[]) => {
                const questionName: string = params[0][0].name;
                if (questionName === "q1") {
                    return {
                        firstName,
                        lastName: "doe"
                    };
                } else if (questionName === "q2") {
                    return {
                        country
                    };
                }
            };
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create());
            yeomanUiInstance["runGenerator"] = async (): Promise<any> => { return; };
            let questions = [{name: "q1"}];
            let response = await yeomanUiInstance.showPrompt(questions);
            expect (response.firstName).to.equal(firstName);

            questions = [{name: "q2"}];

            response = await yeomanUiInstance.showPrompt(questions);        
            expect (response.country).to.equal(country);
            // tslint:disable-next-line: no-unused-expression
            expect(yeomanUiInstance["replayUtils"]["isReplaying"]).to.be.false;

            yeomanUiInstance["back"](undefined);
            // tslint:disable-next-line: no-unused-expression
            expect(yeomanUiInstance["replayUtils"]["isReplaying"]).to.be.true;

            questions = [{name: "q1"}];
            response = await yeomanUiInstance.showPrompt(questions);
            expect (response.firstName).to.equal(firstName);
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

        it("onGeneratorSuccess - one dir was created", () => {
            const beforeGen = {targetFolderPath: "testDestinationRoot", childDirs: ["dirparh1"]};
            const afterGen = {targetFolderPath: "testDestinationRoot", childDirs: ["dirparh1", "dirpath2"]};
            yeomanUi["onGeneratorSuccess"]("testGenName", beforeGen, afterGen);
            // tslint:disable-next-line: no-unused-expression
            expect(doGeneratorDoneSpy.calledWith(true, "The 'testGenName' project has been generated.", "dirpath2")).to.be.true;
        });

        it("onGeneratorSuccess - two dirs were created", () => {
            const beforeGen = {targetFolderPath: "testDestinationRoot", childDirs: ["dirparh1"]};
            const afterGen = {targetFolderPath: "testDestinationRoot", childDirs: ["dirparh1", "dirpath2", "dirpath3"]};
            yeomanUi["onGeneratorSuccess"]("testGenName", beforeGen, afterGen);
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
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create());

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
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create());
            yeomanUiInstance.registerCustomQuestionEventHandler("questionType", "testEvent", testEventFunction);
            yeomanUiInstance["currentQuestions"] = [{name:"question1", guiType: "questionType"}];
            const response = await yeomanUiInstance["evaluateMethod"](null, "question1", "testEvent");
            // tslint:disable-next-line: no-unused-expression
            expect(response).to.be.true;
        });

        it("question method is called", async () => {
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create());
            yeomanUiInstance["currentQuestions"] = [{name:"question1", method1:()=>{
                return true;
            }}];
            const response = await yeomanUiInstance["evaluateMethod"](null, "question1", "method1");
            // tslint:disable-next-line: no-unused-expression
            expect(response).to.be.true;
        });

        it("no questions", async () => {
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create());
            const response = await yeomanUiInstance["evaluateMethod"](null, "question1", "method1");
            // tslint:disable-next-line: no-unused-expression
            expect(response).to.be.undefined;
        });

        it("method throws exception", async () => {
            const yeomanUiInstance: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger, GeneratorFilter.create());
            yeomanUiInstance["gen"] = Object.create({});
            yeomanUiInstance["gen"].options = {};
            yeomanUiInstance["currentQuestions"] = [{name:"question1", method1:()=>{
                throw new Error("Error");
            }}];
            try {
                await yeomanUiInstance["evaluateMethod"](null, "question1", "method1");
            } catch(e) {
                expect(e.toString()).to.contain("method1");
            }
        });
    });
});
