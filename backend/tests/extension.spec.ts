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
        executeCommand: () => Promise.resolve()
    },
    window: {
        showOpenDialog: () => {},
        createOutputChannel: () => {},
        registerWebviewPanelSerializer: () => Promise.resolve(),
        createWebviewPanel: () => {
            return {
                onDidChangeViewState: () => Promise.resolve(),
                onDidDispose: () => Promise.resolve(),
                webview: {
                    onDidReceiveMessage: () => Promise.resolve(),
                    postMessage: () => Promise.resolve(),
                    asWebviewUri: () => {
                        return {
                            toString: () => {}
                        };
                    }
                },
                dispose: () => {}
            };
        }
    },
    ViewColumn: {
        One: 1
    },
    Uri: {
        file: (path: string) => path
    },
    Webview: {
        onDidReceiveMessage: () => Promise.resolve(),
        postMessage: () => Promise.resolve()
    },
    Disposable: {}
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
        const rpcExtension = {
            invoke: () => Promise.resolve(), 
            setResponseTimeout: () => Promise.resolve(), 
            registerMethod: () => Promise.resolve()
        };

        let rpcExtensionMock: any;
        beforeEach(() => {
            extension.YeomanUIPanel.setPaths("testExtensionPath");
            loggerWrapperMock.expects("getClassLogger").returns({});
            yeomanUiPanelMock.expects("createRpc").returns(rpcExtension);
            rpcExtensionMock = sandbox.mock(rpcExtension);
        });

        afterEach(() => {
            rpcExtensionMock.verify();
        });

        it("YeomanUIPanel.currentPanel.panel not exists", () => {
            fsextraMock.expects("readFile").resolves("test file content");
            _.set(extension.YeomanUIPanel, "currentPanel.panel", undefined);
            rpcExtensionMock.expects("invoke").resolves();
            extension.YeomanUIPanel.loadYeomanUI();
        });

        it("YeomanUIPanel.currentPanel.yeomanui exists", () => {
            fsextraMock.expects("readFile").resolves();
            _.set(extension.YeomanUIPanel, "currentPanel.panel", {dispose: () => {}});
            rpcExtensionMock.expects("invoke").resolves();
            extension.YeomanUIPanel.loadYeomanUI();
        });
    });

    describe("showOpenDialog", () => {
        const rpcExtension = {
            invoke: () => Promise.resolve(), 
            setResponseTimeout: () => Promise.resolve(), 
            registerMethod: () => Promise.resolve()
        };

        let rpcExtensionMock: any;

        beforeEach(() => {
            rpcExtensionMock = sandbox.mock(rpcExtension);
            fsextraMock.expects("readFile").resolves();
            rpcExtensionMock.expects("invoke").resolves();
            extension.YeomanUIPanel.setPaths("testExtensionPath");
            loggerWrapperMock.expects("getClassLogger").returns({});
            yeomanUiPanelMock.expects("createRpc").returns(rpcExtension);
            _.set(extension.YeomanUIPanel, "currentPanel.panel", undefined);
            extension.YeomanUIPanel.loadYeomanUI();
        });

        afterEach(() => {
            rpcExtensionMock.verify();
        });

        it("showOpenFileDialog", async () => {
            const currentPanel = _.get(extension.YeomanUIPanel, "currentPanel");
            windowMock.expects("showOpenDialog").withExactArgs({
				canSelectFiles: true,
				canSelectFolders: false,
				defaultUri: "testFilePath"
			}).resolves();
            const result = await currentPanel["showOpenFileDialog"]("testFilePath");
            expect(result).to.be.equals("testFilePath");
        });

        it("showOpenFolderDialog", async () => {
            const currentPanel = _.get(extension.YeomanUIPanel, "currentPanel");
            windowMock.expects("showOpenDialog").withExactArgs({
				canSelectFiles: false,
				canSelectFolders: true,
				defaultUri: "testFolderPath"
			}).resolves();
            const result = await currentPanel["showOpenFolderDialog"]("testFolderPath");
            expect(result).to.be.equals("testFolderPath");
        });

        it("showOpenFolderDialog - showOpenDialog throws error", async () => {
            const currentPanel = _.get(extension.YeomanUIPanel, "currentPanel");
            windowMock.expects("showOpenDialog").withExactArgs({
				canSelectFiles: false,
				canSelectFolders: true,
				defaultUri: "testFolderPath"
			}).rejects();
            const result = await currentPanel["showOpenFolderDialog"]("testFolderPath");
            expect(result).to.be.equals("testFolderPath");
        });
        
        it("showOpenFolderDialog - vscode.Uri.file fails", async () => {
            const uriMock = sandbox.mock(testVscode.Uri);
            const currentPanel = _.get(extension.YeomanUIPanel, "currentPanel");
            windowMock.expects("showOpenDialog").withExactArgs({
				canSelectFiles: false,
				canSelectFolders: true,
				defaultUri: "os_path"
            }).resolves([{fsPath: "os_path"}]);
            uriMock.expects("file").throws(new Error());
            uriMock.expects("file").returns("os_path");
            const result = await currentPanel["showOpenFolderDialog"]("testFolderPath");
            expect(result).to.be.equals("os_path");
            uriMock.verify();
        });
    });
    
    describe("dispose", () => {
        const rpcExtension = {
            invoke: () => Promise.resolve(), 
            setResponseTimeout: () => Promise.resolve(), 
            registerMethod: () => Promise.resolve()
        };

        let rpcExtensionMock: any;

        beforeEach(() => {
            rpcExtensionMock = sandbox.mock(rpcExtension);
            fsextraMock.expects("readFile").resolves();
            rpcExtensionMock.expects("invoke").resolves();
            extension.YeomanUIPanel.setPaths("testExtensionPath");
            loggerWrapperMock.expects("getClassLogger").returns({});
            yeomanUiPanelMock.expects("createRpc").returns(rpcExtension);
            _.set(extension.YeomanUIPanel, "currentPanel.panel", undefined);
            extension.YeomanUIPanel.loadYeomanUI();
        });

        afterEach(() => {
            rpcExtensionMock.verify();
        });

        it("there are no disposables", async () => {
            const currentPanel = _.get(extension.YeomanUIPanel, "currentPanel");
            currentPanel["disposables"] = [{dispose: () => {}}, {dispose: () => {}}];
            currentPanel["dispose"]();
            // tslint:disable-next-line: no-unused-expression
            expect(_.get(extension.YeomanUIPanel, "currentPanel")).to.be.undefined;
            // tslint:disable-next-line: no-unused-expression
            expect(currentPanel["disposables"]).to.be.empty;
        });
    });
});
