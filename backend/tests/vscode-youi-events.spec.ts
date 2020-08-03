import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import * as vscode from "vscode";
import { GeneratorFilter } from '../src/filter';
import * as messages from '../src/messages';

import { VSCodeYouiEvents } from "../src/vscode-youi-events";

describe('vscode-youi-events unit test', () => {
    let events: VSCodeYouiEvents;
    let sandbox: any;
    let windowMock: any;
    let commandsMock: any;
    let workspaceMock: any;
    let eventsMock: any;

    before(() => {
        sandbox = sinon.createSandbox();
        _.set(vscode, "ProgressLocation.Notification", 15);
        _.set(vscode, "Uri.file", (path: string) => {
            return {
                fsPath: path
            };
        });
        _.set(vscode, "window.showInformationMessage", () => Promise.resolve(""));
        _.set(vscode, "window.showErrorMessage", () => Promise.resolve(""));
        _.set(vscode, "workspace.workspaceFolders", []);
        _.set(vscode, "workspace.updateWorkspaceFolders", (): any => undefined);
        _.set(vscode, "commands.executeCommand", (): any => undefined);
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        const webViewPanel: any = {dispose: () => true};
        events = new VSCodeYouiEvents(undefined, webViewPanel, GeneratorFilter.create(), messages.default);
        windowMock = sandbox.mock(vscode.window);
        commandsMock = sandbox.mock(vscode.commands);
        workspaceMock = sandbox.mock(vscode.workspace);
        eventsMock = sandbox.mock(events);
    });

    afterEach(() => {
        windowMock.verify();
        eventsMock.verify();
        commandsMock.verify();
        workspaceMock.verify();
    });

    it("doGeneratorInstall", () => {
        const showInstallMessageSpy = sandbox.spy(events,"showInstallMessage");
        _.set(vscode, "window.withProgress", () => Promise.resolve(""));
        events.doGeneratorInstall();
        expect(showInstallMessageSpy.called).to.be.true;
    });

    describe("doGeneratorDone", () => {
        it("on success, add to workspace button and open in new workspace button are visible", () => {
            eventsMock.expects("doClose");
            const actionName1 = 'Add to Workspace';
            const actionName2 = 'Open in New Workspace';
            _.set(vscode, "workspace.workspaceFolders", [{uri: {fsPath: "rootFolderPath"}}]);
            windowMock.expects("showInformationMessage").
                withExactArgs(`${messages.default.artifact_generated}\nWhat would you like to do with it?`, actionName1, actionName2).resolves();
            return events.doGeneratorDone(true, "success message", "testDestinationRoot");
        });

        it("on success, open in new workspace button is visible", () => {
            eventsMock.expects("doClose");
            _.set(vscode, "workspace.workspaceFolders", [{uri: {fsPath: "rootFolderPath"}}, {uri: {fsPath: "testDestinationRoot"}}]);
            const actionName = 'Open in New Workspace';
            windowMock.expects("showInformationMessage").
                withExactArgs(`${messages.default.artifact_generated}\nWhat would you like to do with it?`, actionName).resolves(actionName);
            commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
            return events.doGeneratorDone(true, "success message", "testDestinationRoot");
        });

        it("on success, add to workspace button is pressed", () => {
            eventsMock.expects("doClose");
            _.set(vscode, "workspace.workspaceFolders", [{uri: {fsPath: "rootFolderPath"}}, {uri: {fsPath: "testRoot"}}]);
            const actionName1 = 'Add to Workspace';
            const actionName2 = 'Open in New Workspace';
            windowMock.expects("showInformationMessage").
                withExactArgs(`${messages.default.artifact_generated}\nWhat would you like to do with it?`, actionName1, actionName2).resolves(actionName1);
            workspaceMock.expects("updateWorkspaceFolders").withArgs(2, null).resolves();
            return events.doGeneratorDone(true, "success message", "testDestinationRoot");
        });

        it("on success, no buttons are displayed", () => {
            eventsMock.expects("doClose");
            _.set(vscode, "workspace.workspaceFolders", [{uri: {fsPath: "testDestinationRoot"}}]);
            const actionName1 = 'Add to Workspace';
            const actionName2 = 'Open in New Workspace';
            windowMock.expects("showInformationMessage").
                withExactArgs(messages.default.artifact_generated).resolves();
            return events.doGeneratorDone(true, "success message", "testDestinationRoot");
        });

        it("on failure", () => {
            eventsMock.expects("doClose");
            windowMock.expects("showErrorMessage").withExactArgs("error message");
            return events.doGeneratorDone(false, "error message");
        });

        it("generator filter type is module", () => {
            const genFilter = GeneratorFilter.create({type: ["module"]});
            const testEvents = new VSCodeYouiEvents(undefined, undefined, genFilter, messages.default);
            eventsMock = sandbox.mock(testEvents);
            eventsMock.expects("doClose");
            windowMock.expects("showInformationMessage").withExactArgs(messages.default.artifact_generated).resolves();
            return testEvents.doGeneratorDone(true, "success message", "testDestinationRoot");
        });
    });
});
