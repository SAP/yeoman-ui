import * as sinon from "sinon";
import { expect } from "chai";
import * as _ from "lodash";
import * as yeomanui from "../src/yeomanui";
import * as Environment from "yeoman-environment";
import { YouiLog } from "../src/youi-log";
import { RpcCommon, IMethod } from "@sap-devx/webview-rpc/out.ext/rpc-common";

describe('yeomanui unit test', () => {
    let sandbox: any;
    let envMock: any;

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
        let yeomanUi: yeomanui.YeomanUI;
        class TestRpc extends RpcCommon {
            sendRequest(id: number, method: string, params?: any[]): void {
            }            
            sendResponse(id: number, response: any, success?: boolean): void {
            }
            protected promiseCallbacks: Map<number, import("@sap-devx/webview-rpc/out.ext/rpc-common").IPromiseCallbacks>;
            protected methods: Map<string, IMethod>;
            protected timeout: number;
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
                return Promise.resolve([])
            }
            invoke(method: string, params?: any[]): Promise<any> {
                return Promise.resolve()
            }
            handleResponse(message: any): void {
            }
            handleRequest(message: any): Promise<void> {
                return Promise.resolve()
            } 
        }
        const rpc = new TestRpc();

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
                return true
            } 
        }
        const logger = new TestLog();

        beforeEach(() => {
            yeomanUi = new yeomanui.YeomanUI(rpc, logger);
        });

        it("no generators", async () => {
            const environment = {
                lookup: async (cb: any) => {
                    console.error("callback");
                    return cb.call();
                },
                getGeneratorsMeta: (): any[] => {
                    return [];
                }
            };
            envMock.expects("createEnv").returns(environment);
            const result = yeomanUi.getGenerators();
            expect(result).to.be.undefined;
        })
    });
});
