import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import { mockVscode } from "./mockUtil";
import { GeneratorFilter } from "../src/filter";

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
    });

    afterEach(() => {
        commandsMock.verify();
        windowMock.verify();
        yeomanUiPanelMock.verify();
    });

    describe('activate', () => {
        let testContext: any;
        beforeEach(() => {
            testContext = { subscriptions: [], extensionPath: "testExtensionpath" };
        });

        it("commands registration", () => {
            extension.activate(testContext);
            expect(_.size(_.keys(oRegisteredCommands))).to.be.equal(2);
            expect(_.keys(oRegisteredCommands)[0]).to.be.equal("loadYeomanUI");
            expect(_.keys(oRegisteredCommands)[1]).to.be.equal("loadYeomanUI_projects");
        });

        it("execution loadYeomanUI command", () => {
            extension.activate(testContext);
            const loadYeomanUICommand = _.get(oRegisteredCommands, "loadYeomanUI");
            yeomanUiPanelMock.expects("createOrShow").withExactArgs(testContext.extensionPath, GeneratorFilter.create({}));
            loadYeomanUICommand();
        });

        it("execution loadYeomanUI_projects command", () => {
            extension.activate(testContext);
            
            const loadYeomanUIProjectsCommand = _.get(oRegisteredCommands, "loadYeomanUI_projects");
            commandsMock.expects("executeCommand").withExactArgs("loadYeomanUI", GeneratorFilter.create({"type": "project"}));
            loadYeomanUIProjectsCommand();
        });
    });
});