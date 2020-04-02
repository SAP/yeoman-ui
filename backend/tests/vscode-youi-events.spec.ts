import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import * as vscode from "vscode";
import { GeneratorFilter, GeneratorType } from '../src/filter';

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
        _.set(vscode, "Uri.file", (): any => undefined);
        _.set(vscode, "window.showInformationMessage", () => {return Promise.resolve("");});
        _.set(vscode, "window.showErrorMessage", () => {return Promise.resolve("");});
        _.set(vscode, "workspace.workspaceFolders", []);
        _.set(vscode, "workspace.getWorkspaceFolder", (): any => undefined);
        _.set(vscode, "workspace.updateWorkspaceFolders", (): any => undefined);
        _.set(vscode, "commands.executeCommand", (): any => undefined);
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        events = new VSCodeYouiEvents(undefined, undefined, GeneratorFilter.create());
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

    it("install", () => {
        const showInstallMessageSpy = sandbox.spy(events,"showInstallMessage");
        _.set(vscode, "window.withProgress", () => {return Promise.resolve("");});
        events.doGeneratorInstall();
        // tslint:disable-next-line: no-unused-expression
        expect(showInstallMessageSpy.called).to.be.true;
    });

    describe("doGeneratorDone", () => {
        it("on success, add to workspace button is visible", () => {
            eventsMock.expects("doClose");
            const actionName = 'Add to Workspace';
            windowMock.expects("showInformationMessage").
                withExactArgs('The project has been successfully generated.\nWhat would you like to do with it?', actionName).resolves(actionName);
            workspaceMock.expects("updateWorkspaceFolders").withArgs(0, null).resolves();
            return events.doGeneratorDone(true, "success message", "testDestinationRoot");
        });

        it("on success, open in new workspace button is visible", () => {
            eventsMock.expects("doClose");
            _.set(vscode, "workspace.workspaceFolders", undefined);
            _.set(vscode, "Uri.file", (path: string) => {return {uri: path};});
            _.set(vscode, "workspace.getWorkspaceFolder", (): any => {return {uri: {fsPath: "testDestinationRoot"}};});
            const actionName = 'Open in New Workspace';
            windowMock.expects("showInformationMessage").
                withExactArgs('The project has been successfully generated.\nWhat would you like to do with it?', actionName).resolves(actionName);
            commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
            return events.doGeneratorDone(true, "success message", "testDestinationRoot");
        });

        it("on failure", () => {
            eventsMock.expects("doClose");
            windowMock.expects("showErrorMessage").withExactArgs("error message");
            return events.doGeneratorDone(false, "error message");
        });

        it("generator filter type is module", () => {
            const genFilter = GeneratorFilter.create({type: GeneratorType.module});
            const events = new VSCodeYouiEvents(undefined, undefined, genFilter);
            eventsMock = sandbox.mock(events);
            eventsMock.expects("doClose");
            windowMock.expects("showInformationMessage").withExactArgs('The project has been successfully generated.').resolves();
            return events.doGeneratorDone(true, "success message", "testDestinationRoot");
        });
    });
});
