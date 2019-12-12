import * as sinon from "sinon";
import * as mocha from "mocha";
import * as datauri from "datauri";
import * as fsextra from "fs-extra";
import { expect } from "chai";
import * as _ from "lodash";
import * as path from "path";
import {YeomanUI, IGeneratorQuestion} from "../src/yeomanui";
import * as defaultImage from "../src/defaultImage";
import * as yeomanEnv from "yeoman-environment";
import { YouiLog } from "../src/youi-log";
import { IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";

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

        it("there are generators", async () => {
            envMock.expects("getGeneratorsMeta").returns({
                "test1:app": {
                    packagePath: "test1Path"
                },
                "test2:app2": {
                    packagePath: "test2Path"
                },
                "test3:app": {
                    packagePath: "test3Path"
                },
            });
            envMock.expects("getGeneratorNames").returns(["test1", "test3"]);
            fsExtraMock.expects("readFile").withExactArgs(path.join("test1Path", PACKAGE_JSON), UTF8).throws(new Error("description_error"));
            fsExtraMock.expects("readFile").withExactArgs(path.join("test3Path", PACKAGE_JSON), UTF8).resolves(`{"description": "test3Description"}`);

            datauriMock.expects("promise").withExactArgs(path.join("test1Path", YEOMAN_PNG)).resolves("yeomanPngData");
            datauriMock.expects("promise").withExactArgs(path.join("test3Path", YEOMAN_PNG)).throws(new Error("yeomanpng_error"));

            const result = await yeomanUi.getGenerators();

            const test1Choice = result.questions[0].choices[0];
            expect(test1Choice.name).to.be.equal("test1");
            expect(test1Choice.message).to.be.equal(choiceMessage);
            expect(test1Choice.imageUrl).to.be.equal("yeomanPngData");

            const test3Choice = result.questions[0].choices[1];
            expect(test3Choice.name).to.be.equal("test3");
            expect(test3Choice.message).to.be.equal("test3Description");
            expect(test3Choice.imageUrl).to.be.equal(defaultImage.default);
        });
    });
});
