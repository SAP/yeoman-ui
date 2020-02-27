import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import { mockVscode } from "./mockUtil";

const oRegisteredCommands = {};
const testVscode = {
    commands: {
        executeCommand: () => Promise.resolve()
    },
    window: {
        withProgress: () => Promise.resolve(),
        showInformationMessage: () => Promise.resolve()
    },
    ProgressLocation: {
        Notification: 15
    }
};
mockVscode(testVscode, "src/vscode-youi-events.ts");
import { VSCodeYouiEvents } from "../src/vscode-youi-events";

describe('vscode-youi-events unit test', () => {
    let sandbox: any;
    let commandsMock: any;
    let windowMock: any;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        commandsMock = sandbox.mock(testVscode.commands);
        windowMock = sandbox.mock(testVscode.window);
    });

    afterEach(() => {
        commandsMock.verify();
        windowMock.verify();
    });

    it("install", () => {
        const events = new VSCodeYouiEvents(undefined);
        const showInstallMessageSpy = sandbox.spy(events,"showInstallMessage");
        events.doGeneratorInstall();
        // tslint:disable-next-line: no-unused-expression
        expect(showInstallMessageSpy.called).to.be.true;
    });
});