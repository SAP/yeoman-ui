import * as sinon from "sinon";
import * as mocha from "mocha";
import { expect } from "chai";
import * as _ from "lodash";
import {YeomanUI, IGeneratorQuestion} from "../src/yeomanui";
import * as Environment from "yeoman-environment";
import { YouiLog } from "../src/youi-log";
import { RpcCommon, IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";

describe('yeomanui unit test', () => {
    let sandbox: any;
    let envMock: any;
    class TestRpc implements IRpc {
        sendRequest(id: number, method: string, params?: any[]): void {
        }            
        sendResponse(id: number, response: any, success?: boolean): void {
        }
        public promiseCallbacks: Map<number, IPromiseCallbacks>;
        public methods: Map<string, IMethod>;
        timeout: number;
        setResponseTimeout(timeout: number): void {
        }
        registerMethod(method: IMethod): void {
        }
        unregisterMethod(method: IMethod): void {
        }
        listLocalMethods(): string[] {
            return [];
        }
        listRemoteMethods(): Promise<string[]> {
            return Promise.resolve([]);
        }
        invoke(method: string, params?: any[]): Promise<any> {
            return Promise.resolve();
        }
        handleResponse(message: any): void {
        }
        handleRequest(message: any): Promise<void> {
            return Promise.resolve();
        } 
    }

    class TestLog implements YouiLog {
        log(str: string): void {
        }            
        writeln(str: string): void {
        }
        create(str: string): void {
        }
        force(str: string): void {
        }
        conflict(str: string): void {
        }
        identical(str: string): void {
        }
        skip(str: string): void {
        }
        showLog(): boolean {
            return true;
        } 
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
                    console.error("callback");
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
});
