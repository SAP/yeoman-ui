import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import { mockVscode } from "./mockUtil";

const oRegisteredCommands = {};
const testVscode = {
    commands: {
        registerCommand: (id: string, cmd: any) => { _.set(oRegisteredCommands, id, cmd); return Promise.resolve(oRegisteredCommands); },
        executeCommand: () => Promise.reject()
    },
    window: {}
};
mockVscode(testVscode, "src/extension.ts");
import * as extension from "../src/extension";
import * as loggerWrapper from "../src/logger/logger-wrapper";

describe('extension unit test', () => {
    let sandbox: any;
    let commandsMock: any;
    let windowMock: any;
    let yeomanUiPanelMock: any;
    let yeomanUiMock: any;
    let loggerWrapperMock: any;

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
        _.set(extension.YeomanUIPanel, "currentPanel.yeomanui", {toggleOutput: () => {}});
        yeomanUiMock = sandbox.mock(extension.YeomanUIPanel.currentPanel.yeomanui);
        loggerWrapperMock = sandbox.mock(loggerWrapper);
    });

    afterEach(() => {
        commandsMock.verify();
        windowMock.verify();
        yeomanUiPanelMock.verify();
        yeomanUiMock.verify();
        loggerWrapperMock.verify();
    });

    describe('activate', () => {
        let testContext: any;
        beforeEach(() => {
            testContext = { subscriptions: [], extensionPath: "testExtensionpath" };            
            loggerWrapperMock.expects("createExtensionLoggerAndSubscribeToLogSettingsChanges");
        });

        it("commands registration", () => {
            extension.activate(testContext);
            expect(_.size(_.keys(oRegisteredCommands))).to.be.equal(2);
            // tslint:disable-next-line: no-unused-expression
            expect( _.get(oRegisteredCommands, "loadYeomanUI")).to.be.not.undefined;
            // tslint:disable-next-line: no-unused-expression
            expect(_.get(oRegisteredCommands, "yeomanUI.toggleOutput")).to.be.not.undefined;
        });

        it("execution loadYeomanUI command", () => {
            extension.activate(testContext);
            const loadYeomanUICommand = _.get(oRegisteredCommands, "loadYeomanUI");
            yeomanUiPanelMock.expects("createOrShow").withArgs(testContext.extensionPath);
            loadYeomanUICommand();
        });

        it("execution yeomanui.toggleOutput command", () => {
            extension.activate(testContext);
            const yeomanUIToggleOutputCommand = _.get(oRegisteredCommands, "yeomanUI.toggleOutput");
            yeomanUiMock.expects("toggleOutput");
            yeomanUIToggleOutputCommand();
        });
    });
});