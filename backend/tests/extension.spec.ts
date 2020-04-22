import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import * as fsextra from 'fs-extra';
// import * as wvrpc from "@sap-devx/webview-rpc";
import { mockVscode } from "./mockUtil";

const oRegisteredCommands = {};
const testVscode = {
    commands: {
        registerCommand: (id: string, cmd: any) => { _.set(oRegisteredCommands, id, cmd); return Promise.resolve(oRegisteredCommands); },
        executeCommand: () => Promise.reject()
    },
    window: {
        createOutputChannel: () => {},
        registerWebviewPanelSerializer: () => Promise.resolve(),
        createWebviewPanel: () => {
            return {
                onDidDispose: () => Promise.resolve(),
                webview: {
                    onDidReceiveMessage: () => Promise.resolve(),
                    postMessage: () => Promise.resolve(),
                    asWebviewUri: () => {
                        return {
                            toString: () => {}
                        };
                    }
                }
            };
        }
    },
    ViewColumn: {
        One: 1
    },
    Uri: {
        file: () => {}
    },
    Webview: {
        onDidReceiveMessage: () => Promise.resolve(),
        postMessage: () => Promise.resolve()
    }
};
mockVscode(testVscode, "src/extension.ts");
import * as extension from "../src/extension";
import * as loggerWrapper from "../src/logger/logger-wrapper";
import { window } from "vscode";

describe('extension unit test', () => {
    let sandbox: any;
    let commandsMock: any;
    let windowMock: any;
    let yeomanUiPanelMock: any;
    let yeomanUiMock: any;
    let loggerWrapperMock: any;
    let fsextraMock: any;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        commandsMock = sandbox.mock(testVscode.commands);
        windowMock = sandbox.mock(testVscode.window);
        yeomanUiPanelMock = sandbox.mock(extension.YeomanUIPanel);
        _.set(extension.YeomanUIPanel, "currentPanel.yeomanui", {toggleOutput: () => true});
        yeomanUiMock = sandbox.mock(extension.YeomanUIPanel.currentPanel.yeomanui);
        loggerWrapperMock = sandbox.mock(loggerWrapper);
        fsextraMock = sandbox.mock(fsextra);
    });

    afterEach(() => {
        commandsMock.verify();
        windowMock.verify();
        yeomanUiPanelMock.verify();
        yeomanUiMock.verify();
        loggerWrapperMock.verify();
        fsextraMock.verify();
    });

    describe('activate', () => {
        const testContext: any = { subscriptions: [], extensionPath: "testExtensionpath" };

        it("commands registration", () => {
            loggerWrapperMock.expects("createExtensionLoggerAndSubscribeToLogSettingsChanges");
            extension.activate(testContext);
            expect(_.size(_.keys(oRegisteredCommands))).to.be.equal(2);
            // tslint:disable-next-line: no-unused-expression
            expect( _.get(oRegisteredCommands, "loadYeomanUI")).to.be.not.undefined;
            // tslint:disable-next-line: no-unused-expression
            expect(_.get(oRegisteredCommands, "yeomanUI.toggleOutput")).to.be.not.undefined;
        });

        it("logger failure on extenion activation", () => {
            const consoleMock = sandbox.mock(console);
            loggerWrapperMock.expects("createExtensionLoggerAndSubscribeToLogSettingsChanges").throws(new Error("activation error"));
            consoleMock.expects("error").withExactArgs('Extension activation failed due to Logger configuration failure:', "activation error");
            extension.activate(null);
        });
    });

    it("getOutputChannel", () => {
        const oOutputChannel = {};
        windowMock.expects("createOutputChannel").once().returns(oOutputChannel);
        expect(oOutputChannel).to.be.equal(extension.getOutputChannel());
        expect(oOutputChannel).to.be.equal(extension.getOutputChannel());
    });

    describe("YeomanUIPanel.toggleOutput", () => {
        it("YeomanUIPanel.currentPanel.yeomanui not exist", () => {
            _.set(extension.YeomanUIPanel, "currentPanel.yeomanui", undefined);
            yeomanUiMock.expects("toggleOutput").never();
            extension.YeomanUIPanel.toggleOutput();
        });

        it("YeomanUIPanel.currentPanel.yeomanui exists", () => {
            yeomanUiMock.expects("toggleOutput");
            extension.YeomanUIPanel.toggleOutput();
        });
    });

    describe("YeomanUIPanel.loadYeomanUI", () => {
        beforeEach(() => {
            extension.YeomanUIPanel.setPaths("testExtensionPath");
            loggerWrapperMock.expects("getClassLogger").returns({});
            fsextraMock.expects("readFile").resolves("test file content");
            yeomanUiPanelMock.expects("createRpc").returns({invoke: () => Promise.resolve(), setResponseTimeout: () => Promise.resolve(), registerMethod: () => Promise.resolve()});
        });

        it("YeomanUIPanel.currentPanel.panel not exists", () => {
            _.set(extension.YeomanUIPanel, "currentPanel.panel", undefined);
            extension.YeomanUIPanel.loadYeomanUI();
        });

        it("YeomanUIPanel.currentPanel.yeomanui exists", () => {
            _.set(extension.YeomanUIPanel, "currentPanel.panel", {dispose: () => {}});
            extension.YeomanUIPanel.loadYeomanUI();
        });
    });
});
