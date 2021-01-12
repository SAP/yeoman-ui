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
import { MessageType, Severity } from "@sap-devx/yeoman-ui-types";

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
	const generatorOutput = new GeneratorOutput();

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
		it("error notification message on BAS", () => {
			const message = "error notification message";
			events["isInBAS"] = true;
			const appWizard = events.getAppWizard();
			generatorOutputMock.expects("appendLine").withExactArgs(message);
			windowMock.expects("showErrorMessage").withExactArgs(message);
			appWizard.showError(message, MessageType.notification);
		});

		it("warning notification message on BAS", () => {
			const message = "warning notification message";
			events["isInBAS"] = true;
			const appWizard = events.getAppWizard();
			generatorOutputMock.expects("appendLine").withExactArgs(message);
			windowMock.expects("showWarningMessage").withExactArgs(message);
			appWizard.showWarning(message, MessageType.notification);
		});

		it("information notification message on BAS", () => {
			const message = "information notification message";
			events["isInBAS"] = true;
			const appWizard = events.getAppWizard();
			generatorOutputMock.expects("appendLine").withExactArgs(message);
			windowMock.expects("showInformationMessage").withExactArgs(message);
			appWizard.showInformation(message, MessageType.notification);
		});

		it("error prompt message on BAS", () => {
			const message = "error prompt message";
			events["isInBAS"] = true;
			const appWizard = events.getAppWizard();
			generatorOutputMock.expects("appendLine").withExactArgs(message);
			events["getMessageImage"] = () => "errorTheia";
			rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message, Severity.error, "errorTheia"]);
			appWizard.showError(message, MessageType.prompt);
		});

		it("warning prompt message on BAS", () => {
			const message = "warning prompt message";
			events["isInBAS"] = true;
			const appWizard = events.getAppWizard();
			generatorOutputMock.expects("appendLine").withExactArgs(message);
			events["getMessageImage"] = () => "warnTheia";
			rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message, Severity.warning, "warnTheia"]);
			appWizard.showWarning(message, MessageType.prompt);
		});

		it("information prompt message on BAS", () => {
			const message = "information prompt message";
			events["isInBAS"] = true;
			const appWizard = events.getAppWizard();
			generatorOutputMock.expects("appendLine").withExactArgs(message);
			events["getMessageImage"] = () => "infoTheia";
			rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message, Severity.information, "infoTheia"]);
			appWizard.showInformation(message, MessageType.prompt);
		});

		it("error message with location prompt on vscode", () => {
			const message = "error prompt message";
			events["isInBAS"] = false;
			const appWizard = events.getAppWizard();
			events["getMessageImage"] = () => "errorVSCodeDark";
			generatorOutputMock.expects("appendLine").withExactArgs(message);
			rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message, Severity.error, "errorVSCodeDark"]);
			appWizard.showError(message, MessageType.prompt);
		});

		it("warning message with location prompt on vscode", () => {
			const message = "warning prompt message";
			events["isInBAS"] = false;
			const appWizard = events.getAppWizard();
			events["getMessageImage"] = () => "warnVSCode";
			generatorOutputMock.expects("appendLine").withExactArgs(message);
			rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message, Severity.warning, "warnVSCode"]);
			appWizard.showWarning(message, MessageType.prompt);
		});

		it("info message with location prompt on vscode", () => {
			const message = "information prompt message";
			events["isInBAS"] = false;
			const appWizard = events.getAppWizard();
			events["getMessageImage"] = () => "infoVSCode";
			generatorOutputMock.expects("appendLine").withExactArgs(message);
			rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message, Severity.information, "infoVSCode"]);
			appWizard.showInformation(message, MessageType.prompt);
		});
	});

	it("executeCommand", () => {
		const commandId = "vscode.open";
		const commandArgs = [vscode.Uri.file("https://en.wikipedia.org")];
		commandsMock.expects("executeCommand").withExactArgs(commandId, commandArgs).resolves();
		events.executeCommand(commandId, commandArgs);
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
		it("getAppWizard - no message received ---> show default Information message with Progress button", () => {
			const appWizard = events.getAppWizard();
			loggerMock.expects("debug");
			generatorOutputMock.expects("appendLine");
			windowMock.expects("showInformationMessage").
			withExactArgs(messages.default.show_progress_message, messages.default.show_progress_button).resolves();
			appWizard.showProgress();
		});

		it("no message received ---> show default Information message with Progress button", () => {
			loggerMock.expects("debug");
			generatorOutputMock.expects("appendLine");
			windowMock.expects("showInformationMessage").
			withExactArgs(messages.default.show_progress_message, messages.default.show_progress_button).resolves();
			events.showProgress();
		});

		it("message received ---> show Information message with received message and Progress button", () => {
			const message = "Generating generator";
			loggerMock.expects("debug");
			generatorOutputMock.expects("appendLine");
			windowMock.expects("showInformationMessage").
			withExactArgs(message, messages.default.show_progress_button).resolves();
			events.showProgress(message);
		});

		it("Progress button pressed ---> show Output", () => {
			loggerMock.expects("debug");
			loggerMock.expects("trace");
			generatorOutputMock.expects("appendLine");
			windowMock.expects("showInformationMessage").
			withExactArgs(messages.default.show_progress_message, messages.default.show_progress_button).resolves(messages.default.show_progress_button);
			generatorOutputMock.expects("show");
			events.showProgress();
		});
	});

	describe.skip("doGeneratorDone", () => {
		const createAndClose = "Create the project and close it for later use";
		const openNewWorkspace = "Open the project in a new workspace";
		const addToWorkspace = "Create the project and close it for later use";

		it("on success, add to workspace button and open in new workspace button are visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }]);
			windowMock.expects("showInformationMessage").withExactArgs(`${messages.default.artifact_generated}`).resolves();
			return events.doGeneratorDone(true, "success message", createAndClose, "testDestinationRoot");
		});

		it("on success, project path and workspace folder are Windows style ---> add to workspace button and open in new workspace button are visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "C:\\Windows" } }]);
			windowMock.expects("showInformationMessage").withExactArgs(`${messages.default.artifact_generated}`).resolves();
			return events.doGeneratorDone(true, "success message", openNewWorkspace, "D:\\Program Files");
		});

		it("on success, project path is already openned in workspace ---> only open in new workspace button is visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
			windowMock.expects("showInformationMessage").withExactArgs(`${messages.default.artifact_generated}`).resolves();
			return events.doGeneratorDone(true, "success message", addToWorkspace, "testDestinationRoot");
		});

		it("on success, project path parent folder is already openned in workspace ---> only open in new workspace button is visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
			windowMock.expects("showInformationMessage").withExactArgs(`${messages.default.artifact_generated}`).resolves();
			return events.doGeneratorDone(true, "success message", createAndClose, "testDestinationRoot/projectName");
		});

		it("on success, project path parent folder is already openned in workspace, path with '.' ---> only open in new workspace button is visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
			windowMock.expects("showInformationMessage").withExactArgs(`${messages.default.artifact_generated}`).resolves();
			commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
			return events.doGeneratorDone(true, "success message", openNewWorkspace, "testDestinationRoot/./projectName");
		});

		it("on success, project path parent folder is already openned in workspace, path with '..' ---> only open in new workspace button is visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
			windowMock.expects("showInformationMessage").withExactArgs(`${messages.default.artifact_generated}`).resolves();
			commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
			return events.doGeneratorDone(true, "success message", openNewWorkspace, "testDestinationRoot/projectName/../projectName");
		});

		it("on success, project path parent folder is already openned in workspace, workspaceFolders with '..' ---> only open in new workspace button is visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot/../testDestinationRoot" } }]);
			windowMock.expects("showInformationMessage").withExactArgs(`${messages.default.artifact_generated}`).resolves();
			commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
			return events.doGeneratorDone(true, "success message", openNewWorkspace, "testDestinationRoot/projectName/../projectName");
		});

		it("on success, project path grand parent folder is already openned in workspace ---> only open in new workspace button is visible", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
			windowMock.expects("showInformationMessage").withExactArgs(`${messages.default.artifact_generated}`).resolves();
			commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
			return events.doGeneratorDone(true, "success message", openNewWorkspace, "testDestinationRoot/projectName/moduleName");
		});

		it("on success, add to workspace button is pressed", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testRoot" } }]);
			windowMock.expects("showInformationMessage").withExactArgs(`${messages.default.artifact_generated}`).resolves();
			workspaceMock.expects("updateWorkspaceFolders").withArgs(2, null).resolves();
			return events.doGeneratorDone(true, "success message", createAndClose, "testDestinationRoot");
		});

		it("on success with the project already opened in the workspace, no buttons are displayed", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "testDestinationRoot" } }]);
			windowMock.expects("showInformationMessage").
				withExactArgs(messages.default.artifact_generated).resolves();
			return events.doGeneratorDone(true, "success message", createAndClose, "testDestinationRoot");
		});

		it("on success with null targetFolderPath, no buttons are displayed", () => {
			eventsMock.expects("doClose");
			_.set(vscode, "workspace.workspaceFolders", [{ uri: { fsPath: "rootFolderPath" } }]);
			windowMock.expects("showInformationMessage").
				withExactArgs(messages.default.artifact_generated).resolves();
			return events.doGeneratorDone(true, "success message", createAndClose, null);
		});

		it("on failure", () => {
			eventsMock.expects("doClose");
			windowMock.expects("showErrorMessage").withExactArgs("error message");
			return events.doGeneratorDone(false, "error message", createAndClose);
		});
	});
});

