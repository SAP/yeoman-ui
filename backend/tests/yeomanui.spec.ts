import * as sinon from "sinon";
const datauri = require("datauri");
import * as fsextra from "fs-extra";
import { expect } from "chai";
import * as _ from "lodash";
import * as path from "path";
import {YeomanUI, IGeneratorQuestion} from "../src/yeomanui";
import * as yeomanEnv from "yeoman-environment";
import { YouiLog } from "../src/youi-log";
import { IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { GeneratorType, GeneratorFilter } from "../src/filter";

describe('yeomanui unit test', () => {
    let sandbox: any;
    let yeomanEnvMock: any;
    let fsExtraMock: any;
    let datauriMock: any;
    const UTF8: string = "utf8";
    const PACKAGE_JSON: string = "package.json";
    const YEOMAN_PNG = "yeoman.png";

    const choiceMessage = 
        "Some quick example text of the generator description. This is a long text so that the example will look good.";
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
        public showLog(): boolean {
            return false;
        }  
    }

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

    describe("getGenerators", () => {
        const rpc = new TestRpc();
        const logger = new TestLog();
        const yeomanUi: YeomanUI = new YeomanUI(rpc, logger);
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
                message: "name",
                choices: []
              };
            expect(result).to.be.deep.equal({ name: "Choose Generator", questions: [generatorQuestion] });
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

            const genFilter = new GeneratorFilter();
            genFilter.type = GeneratorType.project;
            const result = await yeomanUi.getGenerators(genFilter);

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

            const genFilter = new GeneratorFilter();
            genFilter.type = GeneratorType.module;
            const result = await yeomanUi.getGenerators(genFilter);

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
                }
            });
            envMock.expects("getGeneratorNames").returns(["test1", "test2", "test3", "test4", "test5"]);

            fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test1Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test2Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project_test"}}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "module"}}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test4Path", PACKAGE_JSON), UTF8).resolves(`{"generator-filter": {"type": "project"}, "description": "test4Description"}`);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test5Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test5Description"}`);

            const result = await yeomanUi.getGenerators();

            expect(result.questions[0].choices).to.have.lengthOf(5);
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
    });
});
