import * as sinon from "sinon";
import * as mocha from "mocha";
import { expect } from "chai";
import * as _ from "lodash";
import {YeomanUI, IGeneratorQuestion} from "../src/yeomanui";
import * as Environment from "yeoman-environment";
import { YouiLog } from "../src/youi-log";
import { IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";

describe('yeomanui unit test', () => {
    let sandbox: any;
    let envMock: any;
    class TestRpc implements IRpc {
        public  timeout: number;
        public promiseCallbacks: Map<number, IPromiseCallbacks>;
        public methods: Map<string, IMethod>;
        public sendRequest: () => void;             
        public sendResponse: () => void; 
        public setResponseTimeout: () => void; 
        public registerMethod: () => void; 
        public unregisterMethod: () => void; 
        public listLocalMethods: () => [];
        public handleResponse: () => void; 
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
        public log: () => void;            
        public writeln: () => void; 
        public create: () => void; 
        public force: () => void; 
        public conflict: () => void; 
        public identical: () => void; 
        public skip: () => void; 
        public showLog: () => true; 
    }

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        envMock = sandbox.mock(Environment);
    });

    afterEach(() => {
        envMock.verify();
    });

    describe("getGenerators", () => {
        let yeomanUi: YeomanUI;
        
        const rpc = new TestRpc();
        const logger = new TestLog();

        beforeEach(() => {
            yeomanUi = new YeomanUI(rpc, logger);
        });

        it("no generators", async () => {
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
            envMock.expects("createEnv").returns(environment);
            const result = await yeomanUi.getGenerators();
            // tslint:disable-next-line: no-unused-expression
            const generatorQuestion: IGeneratorQuestion = {
                type: "generators",
                name: "name",
                message: "name",
                choices: []
              };
            expect(result).to.be.deep.equal({ name: "Choose Generator", questions: [generatorQuestion] });
        });
    });
})
