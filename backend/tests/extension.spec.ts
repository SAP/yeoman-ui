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

describe('extension unit test', () => {
    let sandbox: any;
    let commandsMock: any;
    let windowMock: any;
    let yeomanUiPanelMock: any;
    let yeomanUiMock: any;

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
        _.set(extension.YeomanUIPanel, "currentPanel.yeomanui", {toggleLog: () => {}});
        yeomanUiMock = sandbox.mock(extension.YeomanUIPanel.currentPanel.yeomanui);
    });

    afterEach(() => {
        commandsMock.verify();
        windowMock.verify();
        yeomanUiPanelMock.verify();
        yeomanUiMock.verify();
    });

    describe('activate', () => {
        let testContext: any;
        beforeEach(() => {
            testContext = { subscriptions: [], extensionPath: "testExtensionpath" };
        });

        it("commands registration", () => {
            extension.activate(testContext);
            expect(_.size(_.keys(oRegisteredCommands))).to.be.equal(2);
            // tslint:disable-next-line: no-unused-expression
            expect( _.get(oRegisteredCommands, "loadYeomanUI")).to.be.not.undefined;
            // tslint:disable-next-line: no-unused-expression
            expect(_.get(oRegisteredCommands, "yeomanUI.toggleLog")).to.be.not.undefined;
        });

        it("execution loadYeomanUI command", () => {
            extension.activate(testContext);
            const loadYeomanUICommand = _.get(oRegisteredCommands, "loadYeomanUI");
            yeomanUiPanelMock.expects("createOrShow").withArgs(testContext.extensionPath);
            loadYeomanUICommand();
        });

        it("execution yeomanui.toggleLog command", () => {
            extension.activate(testContext);
            const yeomanUIToggleLogCommand = _.get(oRegisteredCommands, "yeomanUI.toggleLog");
            yeomanUiMock.expects("toggleLog");
            yeomanUIToggleLogCommand();
        });
    });
});