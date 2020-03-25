import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import * as vscode from "vscode";

import { VSCodeYouiEvents } from "../src/vscode-youi-events";

describe('vscode-youi-events unit test', () => {
    let events: VSCodeYouiEvents;
    let sandbox: any;
    let windowMock: any;
    let eventsMock: any;

    before(() => {
        sandbox = sinon.createSandbox();
        _.set(vscode, "ProgressLocation.Notification", 15);
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        events = new VSCodeYouiEvents(undefined, undefined);
        windowMock = sandbox.mock(vscode.window);
        eventsMock = sandbox.mock(events);
    });

    afterEach(() => {
        windowMock.verify();
        eventsMock.verify();
    });

    it("install", () => {
        const showInstallMessageSpy = sandbox.spy(events,"showInstallMessage");
        _.set(vscode, "window.withProgress", () => {return Promise.resolve("");});
        events.doGeneratorInstall();
        // tslint:disable-next-line: no-unused-expression
        expect(showInstallMessageSpy.called).to.be.true;
    });

    describe("doGeneratorDone", () => {
        it("on success workspace is open", () => {
            eventsMock.expects("doClose");
            _.set(vscode, "window.showInformationMessage", () => {return Promise.resolve("");});
            _.set(vscode, "workspace.workspaceFolders", []);
            _.set(vscode, "workspace.workspaceFolders.length", 1);
            windowMock.expects("showInformationMessage").withExactArgs('The project has been successfully generated.\nWhat would you like to do with it?', 'Add to Workspace', 'Open in New Workspace').resolves();
            events.doGeneratorDone(true, "success message", "testDestinationRoot");
        });

        it("on success workspace is closed", () => {
            eventsMock.expects("doClose");
            _.set(vscode, "window.showInformationMessage", () => {return Promise.resolve("");});
            _.set(vscode, "workspace.workspaceFolders", undefined);
            _.set(vscode, "workspace.workspaceFolders.length", 0);
            windowMock.expects("showInformationMessage").withExactArgs('The project has been successfully generated.\nWhat would you like to do with it?', undefined, 'Open in New Workspace').resolves();
            events.doGeneratorDone(true, "success message", "testDestinationRoot");
        });

        it("on failure", () => {
            eventsMock.expects("doClose");
            _.set(vscode, "window.showErrorMessage", () => {return Promise.resolve("");});
            windowMock.expects("showErrorMessage").withExactArgs("error message");
            events.doGeneratorDone(false, "error message");
        });
    });
});
