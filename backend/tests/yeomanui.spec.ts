import * as sinon from "sinon";
import * as mocha from "mocha";
import { expect } from "chai";
import * as _ from "lodash";
import {YeomanUI, IGeneratorQuestion} from "../src/yeomanui";
import * as yeomanEnv from "yeoman-environment";
import { YouiLog } from "../src/youi-log";
import { IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";

describe('yeomanui unit test', () => {
    let sandbox: any;
    let yeomanEnvMock: any;
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
    });

    afterEach(() => {
        yeomanEnvMock.verify();
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
            envMock.expects("getGeneratorNames").returns(["test1", "test2", "test3"]);
            const result = await yeomanUi.getGenerators();
            const generatorQuestion: IGeneratorQuestion = {
                type: "generators",
                name: "name",
                message: "name",
                choices: []
              };
            expect(result.questions[0].choices).to.have.lengthOf(3);
        });
    });
});
