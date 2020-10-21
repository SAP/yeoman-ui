import * as mocha from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import * as vscode from "vscode";
import { IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as messages from '../src/messages';
import * as loggerWrapper from "../src/logger/logger-wrapper";
import { GeneratorOutput } from '../src/vscode-output';
import { VSCodeYouiEvents } from "../src/vscode-youi-events";
import { Message } from "@sap-devx/yeoman-ui-types";


describe('vscode-youi-events unit test', () => {
	let events: VSCodeYouiEvents;
	let sandbox: any;
	let windowMock: any;
	let commandsMock: any;
	let workspaceMock: any;
	let eventsMock: any;
	let loggerWrapperMock: any;
	let generatorOutputMock: any;
	let rpcMock: any;
	let loggerMock: any;

	const testLogger = {
		debug: () => true, error: () => true,
		fatal: () => true, warn: () => true, info: () => true, trace: () => true, getChildLogger: () => { return testLogger; }
	};

	class TestRpc implements IRpc {
		public timeout: number;
		public promiseCallbacks: Map<number, IPromiseCallbacks>;
		public methods: Map<string, IMethod>;
		public sendRequest(): void {
			return;
		}
		public sendResponse(): void {
			return;
		}
		public setResponseTimeout(): void {
			return;
		}
		public registerMethod(): void {
			return;
		}
		public unregisterMethod(): void {
			return;
		}
		public listLocalMethods(): string[] {
			return [];
		}
		public handleResponse(): void {
			return;
		}
		public listRemoteMethods(): Promise<string[]> {
			return Promise.resolve([]);
		}
		public invoke(): Promise<any> {
			return Promise.resolve();
		}
		public handleRequest(): Promise<void> {
			return Promise.resolve();
		}
	}
	const rpc = new TestRpc();
	

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
		_.set(vscode, "window.showWarningMessage", () => Promise.resolve(""));
		_.set(vscode, "workspace.workspaceFolders", []);
		_.set(vscode, "workspace.updateWorkspaceFolders", (): any => undefined);
		_.set(vscode, "commands.executeCommand", (): any => undefined);
	});

	after(() => {
		sandbox.restore();
	});

	beforeEach(() => {
		const webViewPanel: any = { dispose: () => true };
		loggerWrapperMock = sandbox.mock(loggerWrapper);
		loggerWrapperMock.expects("getClassLogger").returns(testLogger);
		const generatorOutput = new GeneratorOutput();
		events = new VSCodeYouiEvents(rpc, webViewPanel, messages.default, generatorOutput, true);
		windowMock = sandbox.mock(vscode.window);
		commandsMock = sandbox.mock(vscode.commands);
		workspaceMock = sandbox.mock(vscode.workspace);
		eventsMock = sandbox.mock(events);
		generatorOutputMock = sandbox.mock(generatorOutput);
		loggerMock = sandbox.mock(testLogger);
		rpcMock = sandbox.mock(rpc);
	});

	afterEach(() => {
		windowMock.verify();
		eventsMock.verify();
		commandsMock.verify();
		workspaceMock.verify();
		loggerWrapperMock.verify();
		generatorOutputMock.verify();
		loggerMock.verify();
		rpcMock.verify();
	});

	describe("getAppWizard", () => {
		it("error message with location message on theia", () => {
			const message = new Message("value message", Message.Type.error, Message.Location.notification);
			events["isInBAS"] = true;
			const appWizard = events.getAppWizard();
			windowMock.expects("showErrorMessage").withExactArgs(message.text);
			appWizard.messages.show(message);
		});

		it("warning message with location notification on theia", () => {
			const message = new Message("value message", Message.Type.warn, Message.Location.notification);
			events["isInBAS"] = true;
			const appWizard = events.getAppWizard();
			windowMock.expects("showWarningMessage").withExactArgs(message.text);
			appWizard.messages.show(message);
		});

		it("info message with location notification on theia", () => {
			const message = new Message("value message", Message.Type.info, Message.Location.notification);
			events["isInBAS"] = true;
			const appWizard = events.getAppWizard();
			windowMock.expects("showInformationMessage").withExactArgs(message.text);
			appWizard.messages.show(message);
		});

		it("error message with location prompt on theia", () => {
			const message = new Message("value message", Message.Type.error, Message.Location.prompt);
			events["isInBAS"] = true;
			const appWizard = events.getAppWizard();
			events["getMessageImage"] = () => "errorTheiaDark";
			rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message.text, message.type, "errorTheiaDark"]);
			appWizard.messages.show(message);
		});

		it("warning message with location prompt on theia", () => {
			const message = new Message("value message", Message.Type.warn, Message.Location.prompt);
			events["isInBAS"] = true;
			const appWizard = events.getAppWizard();
			events["getMessageImage"] = () => "warnTheia";
			rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message.text, message.type, "warnTheia"]);
			appWizard.messages.show(message);
		});

		it("info message with location prompt on theia", () => {
			const message = new Message("value message", Message.Type.info, Message.Location.prompt);
			events["isInBAS"] = true;
			const appWizard = events.getAppWizard();
			events["getMessageImage"] = () => "infoTheia";
			rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message.text, message.type, "infoTheia"]);
			appWizard.messages.show(message);
		});

		it("error message with location prompt on vscode", () => {
			const message = new Message("value message", Message.Type.error, Message.Location.prompt);
			events["isInBAS"] = false;
			const appWizard = events.getAppWizard();
			events["getMessageImage"] = () => "errorVSCodeDark";
			rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message.text, message.type, "errorVSCodeDark"]);
			appWizard.messages.show(message);
		});

		it("warning message with location prompt on vscode", () => {
			const message = new Message("value message", Message.Type.warn, Message.Location.prompt);
			events["isInBAS"] = false;
			const appWizard = events.getAppWizard();
			events["getMessageImage"] = () => "warnVSCode";
			rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message.text, message.type, "warnVSCode"]);
			appWizard.messages.show(message);
		});

		it("info message with location prompt on vscode", () => {
			const message = new Message("value message", Message.Type.info, Message.Location.prompt);
			events["isInBAS"] = false;
			const appWizard = events.getAppWizard();
			events["getMessageImage"] = () => "infoVSCode";
			rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message.text, message.type, "infoVSCode"]);
			appWizard.messages.show(message);
		});
	});


	it("doGeneratorInstall", () => {
		const showInstallMessageSpy = sandbox.spy(events, "showInstallMessage");
		_.set(vscode, "window.withProgress", () => Promise.resolve(""));
		events.doGeneratorInstall();
		expect(showInstallMessageSpy.called).to.be.true;
	});

	it("isPredecessorOf", () => {
		expect(events["isPredecessorOf"]('/foo', '/foo')).to.be.false;
		expect(events["isPredecessorOf"]('/foo', '/bar')).to.be.false;
		expect(events["isPredecessorOf"]('/foo', '/foobar')).to.be.false;
		expect(events["isPredecessorOf"]('/foo', '/foo/bar')).to.be.true;
		expect(events["isPredecessorOf"]('/foo', '/foo/../bar')).to.be.false;
		expect(events["isPredecessorOf"]('/foo', '/foo/./bar')).to.be.true;
		expect(events["isPredecessorOf"]('/bar/../foo', '/foo/bar')).to.be.true;
		expect(events["isPredecessorOf"]('/foo', './bar')).to.be.false;
		expect(events["isPredecessorOf"]('C:\\Foo', 'C:\\Bar')).to.be.false;
		expect(events["isPredecessorOf"]('C:\\Foo', 'D:\\Foo\\Bar')).to.be.false;
	});

	describe("showProgress", () => {
		it("getAppWizard - no message received ---> show default Information message with Progress button", async () => {
			const appWizard = events.getAppWizard();
			loggerMock.expects("debug");
			windowMock.expects("showInformationMessage").
				withExactArgs(messages.default.show_progress_message, messages.default.show_progress_button).resolves();
			await appWizard.messages.showProgress();
		});

		it("no message received ---> show default Information message with Progress button", async () => {
			loggerMock.expects("debug");
			windowMock.expects("showInformationMessage").
				withExactArgs(messages.default.show_progress_message, messages.default.show_progress_button).resolves();
			await events.showProgress();
		});

		it("message received ---> show Information message with received message and Progress button", async () => {
			const message: string = "Generating generator";
			loggerMock.expects("debug");
			windowMock.expects("showInformationMessage").
				withExactArgs(message, messages.default.show_progress_button).resolves();
			await events.showProgress(message);
		});

		it("Progress button pressed ---> show Output", async () => {
			loggerMock.expects("debug");
			loggerMock.expects("trace");
			windowMock.expects("showInformationMessage").
				withExactArgs(messages.default.show_progress_message, messages.default.show_progress_button).resolves(messages.default.show_progress_button);
			generatorOutputMock.expects("show");
			await events.showProgress();
		});
	});

	describe("doGeneratorDone", () => {
		it("on success, add to workspace button and open in new workspace button are visible", () => {
			eventsMock.expects("doClose");
			const actionName1 = 'Add to Workspace';
			const actionName2 = 'Open in New Workspace';
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }]);
			windowMock.expects("showInformationMessage").
				withExactArgs(`${messages.default.artifact_generated}\nWhat would you like to do with it?`, actionName1, actionName2).resolves();
			return events.doGeneratorDone(true, "success message", "testDestinationRoot");
		});

		it("on success, project path and workspace folder are Windows style ---> add to workspace button and open in new workspace button are visible", () => {
			eventsMock.expects("doClose");
			const actionName1 = 'Add to Workspace';
			const actionName2 = 'Open in New Workspace';
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "C:\\Windows" } }]);
			windowMock.expects("showInformationMessage").
				withExactArgs(`${messages.default.artifact_generated}\nWhat would you like to do with it?`, actionName1, actionName2).resolves();
			return events.doGeneratorDone(true, "success message", "D:\\Program Files");
		});

		it("on success, project path is already openned in workspace ---> only open in new workspace button is visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
			const actionName = 'Open in New Workspace';
			windowMock.expects("showInformationMessage").
				withExactArgs(`${messages.default.artifact_generated}\nWhat would you like to do with it?`, actionName).resolves(actionName);
			commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
			return events.doGeneratorDone(true, "success message", "testDestinationRoot");
		});

		it("on success, project path parent folder is already openned in workspace ---> only open in new workspace button is visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
			const actionName = 'Open in New Workspace';
			windowMock.expects("showInformationMessage").
				withExactArgs(`${messages.default.artifact_generated}\nWhat would you like to do with it?`, actionName).resolves(actionName);
			commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
			return events.doGeneratorDone(true, "success message", "testDestinationRoot/projectName");
		});

		it("on success, project path parent folder is already openned in workspace, path with '.' ---> only open in new workspace button is visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
			const actionName = 'Open in New Workspace';
			windowMock.expects("showInformationMessage").
				withExactArgs(`${messages.default.artifact_generated}\nWhat would you like to do with it?`, actionName).resolves(actionName);
			commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
			return events.doGeneratorDone(true, "success message", "testDestinationRoot/./projectName");
		});

		it("on success, project path parent folder is already openned in workspace, path with '..' ---> only open in new workspace button is visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
			const actionName = 'Open in New Workspace';
			windowMock.expects("showInformationMessage").
				withExactArgs(`${messages.default.artifact_generated}\nWhat would you like to do with it?`, actionName).resolves(actionName);
			commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
			return events.doGeneratorDone(true, "success message", "testDestinationRoot/projectName/../projectName");
		});

		it("on success, project path parent folder is already openned in workspace, workspaceFolders with '..' ---> only open in new workspace button is visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot/../testDestinationRoot" } }]);
			const actionName = 'Open in New Workspace';
			windowMock.expects("showInformationMessage").
				withExactArgs(`${messages.default.artifact_generated}\nWhat would you like to do with it?`, actionName).resolves(actionName);
			commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
			return events.doGeneratorDone(true, "success message", "testDestinationRoot/projectName/../projectName");
		});

		it("on success, project path grand parent folder is already openned in workspace ---> only open in new workspace button is visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
			const actionName = 'Open in New Workspace';
			windowMock.expects("showInformationMessage").
				withExactArgs(`${messages.default.artifact_generated}\nWhat would you like to do with it?`, actionName).resolves(actionName);
			commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
			return events.doGeneratorDone(true, "success message", "testDestinationRoot/projectName/moduleName");
		});

		it("on success, add to workspace button is pressed", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testRoot" } }]);
			const actionName1 = 'Add to Workspace';
			const actionName2 = 'Open in New Workspace';
			windowMock.expects("showInformationMessage").
				withExactArgs(`${messages.default.artifact_generated}\nWhat would you like to do with it?`, actionName1, actionName2).resolves(actionName1);
			workspaceMock.expects("updateWorkspaceFolders").withArgs(2, null).resolves();
			return events.doGeneratorDone(true, "success message", "testDestinationRoot");
		});

		it("on success with the project already opened in the workspace, no buttons are displayed", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "testDestinationRoot" } }]);
			windowMock.expects("showInformationMessage").
				withExactArgs(messages.default.artifact_generated).resolves();
			return events.doGeneratorDone(true, "success message", "testDestinationRoot");
		});

		it("on success with null targetFolderPath, no buttons are displayed", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }]);
			windowMock.expects("showInformationMessage").
				withExactArgs(messages.default.artifact_generated).resolves();
			return events.doGeneratorDone(true, "success message", null);
		});

		it("on failure", () => {
			eventsMock.expects("doClose");
			windowMock.expects("showErrorMessage").withExactArgs("error message");
			return events.doGeneratorDone(false, "error message");
		});
	});
});
