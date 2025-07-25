import { vscode } from "./mockUtil";
import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import * as _ from "lodash";
import { IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as messages from "../src/messages";
import { MessageType, Severity, IBannerProps } from "@sap-devx/yeoman-ui-types";
import { GeneratorOutput } from "../src/vscode-output";
import { Constants } from "../src/utils/constants";
import * as loggerWrapper from "../src/logger/logger-wrapper";
import { VSCodeYouiEvents } from "../src/vscode-youi-events";
import * as fs from "fs";

describe("vscode-youi-events unit test", () => {
  let events: VSCodeYouiEvents;
  let sandbox: SinonSandbox;
  let windowMock: SinonMock;
  let commandsMock: SinonMock;
  let workspaceMock: SinonMock;
  let eventsMock: SinonMock;
  let loggerWrapperMock: SinonMock;
  let generatorOutputMock: SinonMock;
  let rpcMock: SinonMock;
  let loggerMock: SinonMock;
  let uriMock: SinonMock;
  let fsMock: SinonMock;

  const testLogger = {
    debug: () => true,
    error: () => true,
    fatal: () => true,
    warn: () => true,
    info: () => true,
    trace: () => true,
    getChildLogger: () => {
      return testLogger;
    },
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
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    const webViewPanel: any = { dispose: () => true };
    loggerWrapperMock = sandbox.mock(loggerWrapper);
    loggerWrapperMock.expects("getClassLogger").returns(testLogger);
    events = new VSCodeYouiEvents(rpc, webViewPanel, messages.default, generatorOutput);
    windowMock = sandbox.mock(vscode.window);
    commandsMock = sandbox.mock(vscode.commands);
    workspaceMock = sandbox.mock(vscode.workspace);
    eventsMock = sandbox.mock(events);
    generatorOutputMock = sandbox.mock(generatorOutput);
    loggerMock = sandbox.mock(testLogger);
    rpcMock = sandbox.mock(rpc);
    uriMock = sandbox.mock(vscode.Uri);
    fsMock = sandbox.mock(fs);
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
    uriMock.verify();
    fsMock.verify();
  });

  describe("getAppWizard", () => {
    it("error notification message on BAS", () => {
      const message = "error notification message";
      Constants["IS_IN_BAS"] = true;
      const appWizard = events.getAppWizard();
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      windowMock.expects("showErrorMessage").withExactArgs(message);
      appWizard.showError(message, MessageType.notification);
    });

    it("warning notification message on BAS", () => {
      const message = "warning notification message";
      Constants["IS_IN_BAS"] = true;
      const appWizard = events.getAppWizard();
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      windowMock.expects("showWarningMessage").withExactArgs(message);
      appWizard.showWarning(message, MessageType.notification);
    });

    it("information notification message on BAS", () => {
      const message = "information notification message";
      Constants["IS_IN_BAS"] = true;
      const appWizard = events.getAppWizard();
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      windowMock.expects("showInformationMessage").withExactArgs(message);
      appWizard.showInformation(message, MessageType.notification);
    });

    it("error prompt message on BAS", () => {
      const message = "error prompt message";
      Constants["IS_IN_BAS"] = true;
      const appWizard = events.getAppWizard();
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      events["getMessageImage"] = () => "errorTheia";
      rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message, Severity.error, "errorTheia"]);
      appWizard.showError(message, MessageType.prompt);
    });

    it("warning prompt message on BAS", () => {
      const message = "warning prompt message";
      Constants["IS_IN_BAS"] = true;
      const appWizard = events.getAppWizard();
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      events["getMessageImage"] = () => "warnTheia";
      rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message, Severity.warning, "warnTheia"]);
      appWizard.showWarning(message, MessageType.prompt);
    });

    it("information prompt message on BAS", () => {
      const message = "information prompt message";
      Constants["IS_IN_BAS"] = true;
      const appWizard = events.getAppWizard();
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      events["getMessageImage"] = () => "infoTheia";
      rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message, Severity.information, "infoTheia"]);
      appWizard.showInformation(message, MessageType.prompt);
    });

    it("error message with location prompt on vscode", () => {
      const message = "error prompt message";
      Constants["IS_IN_BAS"] = false;
      const appWizard = events.getAppWizard();
      events["getMessageImage"] = () => "errorVSCodeDark";
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message, Severity.error, "errorVSCodeDark"]);
      appWizard.showError(message, MessageType.prompt);
    });

    it("warning message with location prompt on vscode", () => {
      const message = "warning prompt message";
      Constants["IS_IN_BAS"] = false;
      const appWizard = events.getAppWizard();
      events["getMessageImage"] = () => "warnVSCode";
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      rpcMock.expects("invoke").withExactArgs("showPromptMessage", [message, Severity.warning, "warnVSCode"]);
      appWizard.showWarning(message, MessageType.prompt);
    });

    it("info message with location prompt on vscode", () => {
      const message = "information prompt message";
      Constants["IS_IN_BAS"] = false;
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
    commandsMock
      .expects("executeCommand")
      .withExactArgs(commandId, ...commandArgs)
      .resolves();
    return events.executeCommand(commandId, commandArgs);
  });

  it("doGeneratorInstall", () => {
    _.set(vscode, "ProgressLocation.Notification", 15);
    windowMock
      .expects("withProgress")
      .withArgs({
        location: 15,
        title: "Installing dependencies...",
      })
      .resolves();
    events.doGeneratorInstall();
  });

  it("setAppWizardHeaderTitle", () => {
    const testTitle = "testTitle";
    const testInfo = "testInfo";
    rpcMock.expects("invoke").withExactArgs("setHeaderTitle", [testTitle, testInfo]);
    events.setAppWizardHeaderTitle(testTitle, testInfo);
  });

  it("setBanner", () => {
    const bannerProps: IBannerProps = {
      text: "Test Banner",
      ariaLabel: "Test Banner Label",
      displayBannerForStep: "testStep",
      icon: { source: "mdi-check-circle", type: "mdi" },
      action: { text: "Click Me", url: "https://example.com" },
      triggerActionFrom: "banner",
    };
    rpcMock.expects("invoke").withExactArgs("setBanner", [bannerProps]);
    events.setAppWizardBanner(bannerProps);
  });

  describe("showProgress", () => {
    it("getAppWizard - no message received ---> show default Information message with Progress button", () => {
      const appWizard = events.getAppWizard();
      loggerMock.expects("debug");
      generatorOutputMock.expects("appendLine");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.show_progress_message, messages.default.show_progress_button)
        .resolves();
      appWizard.showProgress();
    });

    it("no message received ---> show default Information message with Progress button", () => {
      loggerMock.expects("debug");
      generatorOutputMock.expects("appendLine");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.show_progress_message, messages.default.show_progress_button)
        .resolves();
      events.showProgress();
    });

    it("message received ---> show Information message with received message and Progress button", () => {
      const message = "Generating generator";
      loggerMock.expects("debug");
      generatorOutputMock.expects("appendLine");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(message, messages.default.show_progress_button)
        .resolves();
      events.showProgress(message);
    });

    it("Progress button pressed ---> show Output", () => {
      loggerMock.expects("debug");
      loggerMock.expects("trace");
      generatorOutputMock.expects("appendLine");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.show_progress_message, messages.default.show_progress_button)
        .resolves(messages.default.show_progress_button);
      generatorOutputMock.expects("show");
      events.showProgress();
    });
  });

  it("getMessageImage", () => {
    const errorImage = events["getMessageImage"](Severity.error);
    expect(errorImage).to.be.not.undefined;
    const infoImage = events["getMessageImage"](Severity.information);
    expect(infoImage).to.be.not.undefined;
    const warningImage = events["getMessageImage"](Severity.warning);
    expect(warningImage).to.be.not.undefined;
  });

  describe("doGeneratorDone", () => {
    const createAndClose = "Create the project and close it for future use";
    const openNewWorkspace = "Open the project in a stand-alone";
    const addToWorkspace = "Open the project in a multi-root workspace";

    it("on success, project path and workspace folder are Windows style ---> the project added to current workspace", () => {
      eventsMock.expects("doClose");
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testRoot" } }]);
      sandbox.stub(vscode.workspace, "workspaceFile").value("/workspace/file/path");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_project_add_to_workspace)
        .resolves();
      workspaceMock.expects("updateWorkspaceFolders").withArgs(2, null).resolves();
      return events.doGeneratorDone(true, "success message", addToWorkspace, "project", "testDestinationRoot");
    });

    it("on success, project path is already openned in workspace ---> the project added to current workspace", () => {
      eventsMock.expects("doClose");
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
      sandbox.stub(vscode.workspace, "workspaceFile").value("/workspace/file/path");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_project_add_to_workspace)
        .resolves();
      workspaceMock.expects("updateWorkspaceFolders").withArgs(2, null).resolves();
      return events.doGeneratorDone(true, "success message", addToWorkspace, "project", "testDestinationRoot");
    });

    it("on success, project path parent folder is already openned in workspace ---> the user changed to create and close the project for later use", () => {
      eventsMock.expects("doClose");
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_project_saved_for_future)
        .resolves();
      return events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "project",
        "testDestinationRoot/projectName",
      );
    });

    it("on success, project path parent folder is already openned in workspace ---> the project openned in a stand-alone", () => {
      eventsMock.expects("doClose");
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_project_open_in_a_new_workspace)
        .resolves();
      commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
      return events.doGeneratorDone(
        true,
        "success message",
        openNewWorkspace,
        "project",
        "testDestinationRoot/./projectName",
      );
    });

    it("on success, no workspace is opened ---> the project openned in a new multi-root workspace", () => {
      eventsMock.expects("doClose");
      sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
      sandbox.stub(vscode.workspace, "workspaceFile").value(undefined);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_project_add_to_workspace)
        .resolves();
      commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
      workspaceMock.expects("updateWorkspaceFolders").withArgs(0, null);
      fsMock.expects("existsSync").returns(false);
      fsMock.expects("writeFileSync");
      uriMock.expects("file").twice().returns({ fsPath: "testFsPath" });
      return events.doGeneratorDone(
        true,
        "success message",
        "Open the project in a multi-root workspace",
        "project",
        "testDestinationRoot/./projectName",
      );
    });

    it("on success, targetFolder is uri and the the project openned in a new multi-root workspace", () => {
      eventsMock.expects("doClose");
      sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
      sandbox.stub(vscode.workspace, "workspaceFile").value(undefined);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_project_add_to_workspace)
        .resolves();
      commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();
      workspaceMock.expects("updateWorkspaceFolders").withArgs(0, null);

      fsMock.expects("existsSync").returns(false);
      fsMock.expects("writeFileSync");

      events.doGeneratorDone(
        true,
        "success message",
        "Open the project in a multi-root workspace",
        "project",
        '{"uri":"abapdf://testDestinationRoot","name":"projectName"}',
      );
    });

    it("on success, targetFolderPath is uri and the the project openned in a Open the project in a stand-alone", () => {
      eventsMock.expects("doClose");
      sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
      sandbox.stub(vscode.workspace, "workspaceFile").value(undefined);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_project_open_in_a_new_workspace)
        .resolves();
      commandsMock.expects("executeCommand").withArgs("vscode.openFolder").resolves();

      fsMock.expects("existsSync").returns(false);
      fsMock.expects("writeFileSync");

      events.doGeneratorDone(
        true,
        "success message",
        "Open the project in a stand-alone",
        "project",
        '{"uri":"abapdf://testDestinationRoot","name":"projectName"}',
      );
    });

    it("on success, targetFolderPath is uri and the the project openned in a Create the project and close it for future use", () => {
      eventsMock.expects("doClose");
      sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
      sandbox.stub(vscode.workspace, "workspaceFile").value(undefined);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_project_saved_for_future)
        .resolves();

      fsMock.expects("existsSync").returns(false);
      fsMock.expects("writeFileSync");

      events.doGeneratorDone(
        true,
        "success message",
        "Create the project and close it for future use",
        "project",
        '{"uri":"abapdf://testDestinationRoot","name":"projectName"}',
      );
    });

    it("on success, module is created", () => {
      eventsMock.expects("doClose");
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ uri: { fsPath: "rootFolderPath" } }, { uri: { fsPath: "testDestinationRoot" } }]);
      windowMock.expects("showInformationMessage").withExactArgs(messages.default.artifact_generated_module).resolves();
      return events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "module",
        "testDestinationRoot/projectName/../projectName",
      );
    });

    it("on success, not a module and not a project", () => {
      eventsMock.expects("doClose");
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([
          { uri: { fsPath: "rootFolderPath" } },
          { uri: { fsPath: "testDestinationRoot/../testDestinationRoot" } },
        ]);
      windowMock.expects("showInformationMessage").withExactArgs(messages.default.artifact_generated_files).resolves();
      return events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "files",
        "testDestinationRoot/projectName/../projectName",
      );
    });

    it("on success with null targetFolderPath", () => {
      eventsMock.expects("doClose");
      sandbox.stub(vscode.workspace, "workspaceFolders").value([{ uri: { fsPath: "rootFolderPath" } }]);
      windowMock.expects("showInformationMessage").withExactArgs(messages.default.artifact_generated_files).resolves();
      return events.doGeneratorDone(true, "success message", createAndClose, "files", null);
    });

    it("on failure", () => {
      eventsMock.expects("doClose");
      windowMock.expects("showErrorMessage").withExactArgs("error message");
      return events.doGeneratorDone(false, "error message", createAndClose, "files");
    });
  });

  describe("getUniqueProjectName", () => {
    it("should return baseName if it does not exist in workspace", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value([{ name: "Project1" }, { name: "Project2" }]);
      const result = events["getUniqueProjectName"]("NewProject");
      expect(result).to.equal("NewProject");
    });

    it("should return baseName(1) if baseName already exists", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value([{ name: "Project1" }, { name: "NewProject" }]);
      const result = events["getUniqueProjectName"]("NewProject");
      expect(result).to.equal("NewProject(1)");
    });

    it("should return baseName with incremented counter if multiple exist", () => {
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ name: "NewProject" }, { name: "NewProject(1)" }, { name: "NewProject(2)" }]);
      const result = events["getUniqueProjectName"]("NewProject");
      expect(result).to.equal("NewProject(3)");
    });

    it("should handle empty workspace folders gracefully", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value(undefined);
      const result = events["getUniqueProjectName"]("UniqueProject");
      expect(result).to.equal("UniqueProject");
    });
  });
});
