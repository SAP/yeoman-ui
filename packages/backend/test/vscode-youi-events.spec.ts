import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as vscode from "vscode";
import { VSCodeYouiEvents } from "../src/vscode-youi-events.js";
import { MessageType, Severity, IBannerProps } from "@sap-devx/yeoman-ui-types";
import { Constants } from "../src/utils/constants.js";
import * as messages from "../src/messages.js";
import * as fs from "fs";

// Mock all dependencies
vi.mock("vscode", () => ({
  Uri: {
    file: vi.fn((path) => ({ fsPath: path, scheme: "file" })),
    parse: vi.fn((uri) => ({ fsPath: uri, scheme: "file" }))
  },
  window: {
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    withProgress: vi.fn(),
    activeColorTheme: {
      kind: 1 // Light theme
    }
  },
  commands: {
    executeCommand: vi.fn()
  },
  workspace: {
    workspaceFolders: undefined,
    workspaceFile: undefined,
    updateWorkspaceFolders: vi.fn()
  },
  ProgressLocation: {
    Notification: 15
  },
  ColorThemeKind: {
    Light: 1,
    Dark: 2,
    HighContrast: 3
  }
}));

vi.mock("../src/vscode-output.js", () => ({
  GeneratorOutput: class MockGeneratorOutput {
    appendLine = vi.fn();
    show = vi.fn();
  }
}));

vi.mock("../src/logger/logger-wrapper.js", () => ({
  getClassLogger: vi.fn(() => ({
    debug: vi.fn(),
    trace: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}));

vi.mock("../src/utils/constants.js", () => ({
  Constants: {
    IS_IN_BAS: false,
    HOMEDIR_PROJECTS: "/mock/home/projects"
  }
}));

vi.mock("../src/messages.js", () => ({
  default: {
    show_progress_message: "Generating...",
    show_progress_button: "Show Output",
    open_in_a_new_workspace: "Open in new workspace",
    add_to_workspace: "Add to workspace",
    artifact_generated_files: "Files generated successfully",
    artifact_generated_project_add_to_workspace: "Project added to workspace",
    artifact_generated_project_open_in_a_new_workspace: "Project opened in new workspace",
    artifact_generated_project_saved_for_future: "Project saved for future use",
    artifact_generated_module: "Module generated successfully"
  }
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn()
}));

describe("vscode-youi-events unit test", () => {
  let events: VSCodeYouiEvents;
  let mockRpc: any;
  let mockWebviewPanel: any;
  let mockGeneratorOutput: any;

  const testLogger = {
    debug: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    trace: vi.fn(),
    getChildLogger: vi.fn(() => testLogger)
  };

  class TestRpc {
    public timeout: number = 5000;
    public promiseCallbacks: Map<number, any> = new Map();
    public methods: Map<string, any> = new Map();
    public sendRequest = vi.fn();
    public sendResponse = vi.fn();
    public setResponseTimeout = vi.fn();
    public registerMethod = vi.fn();
    public unregisterMethod = vi.fn();
    public listLocalMethods = vi.fn(() => []);
    public handleResponse = vi.fn();
    public listRemoteMethods = vi.fn(() => Promise.resolve([]));
    public invoke = vi.fn(() => Promise.resolve());
    public handleRequest = vi.fn(() => Promise.resolve());
  }

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock objects
    mockRpc = new TestRpc();
    mockWebviewPanel = { dispose: vi.fn() };
    mockGeneratorOutput = {
      appendLine: vi.fn(),
      show: vi.fn()
    };
    
    // Create events instance
    events = new VSCodeYouiEvents(mockRpc, mockWebviewPanel, messages.default, mockGeneratorOutput);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getAppWizard", () => {
    it("error notification message on BAS", () => {
      const message = "error notification message";
      vi.mocked(Constants).IS_IN_BAS = true;
      
      const appWizard = events.getAppWizard();
      const showErrorSpy = vi.spyOn(vscode.window, "showErrorMessage");
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      
      appWizard.showError(message, MessageType.notification);
      
      expect(appendLineSpy).toHaveBeenCalledWith(message);
      expect(showErrorSpy).toHaveBeenCalledWith(message);
    });

    it("warning notification message on BAS", () => {
      const message = "warning notification message";
      vi.mocked(Constants).IS_IN_BAS = true;
      
      const appWizard = events.getAppWizard();
      const showWarningSpy = vi.spyOn(vscode.window, "showWarningMessage");
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      
      appWizard.showWarning(message, MessageType.notification);
      
      expect(appendLineSpy).toHaveBeenCalledWith(message);
      expect(showWarningSpy).toHaveBeenCalledWith(message);
    });

    it("information notification message on BAS", () => {
      const message = "information notification message";
      vi.mocked(Constants).IS_IN_BAS = true;
      
      const appWizard = events.getAppWizard();
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage");
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      
      appWizard.showInformation(message, MessageType.notification);
      
      expect(appendLineSpy).toHaveBeenCalledWith(message);
      expect(showInfoSpy).toHaveBeenCalledWith(message);
    });

    it("error prompt message on BAS", () => {
      const message = "error prompt message";
      vi.mocked(Constants).IS_IN_BAS = true;
      
      const appWizard = events.getAppWizard();
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      vi.spyOn(events as any, "getMessageImage").mockReturnValue("errorTheia");
      
      appWizard.showError(message, MessageType.prompt);
      
      expect(appendLineSpy).toHaveBeenCalledWith(message);
      expect(mockRpc.invoke).toHaveBeenCalledWith("showPromptMessage", [message, Severity.error, "errorTheia"]);
    });

    it("warning prompt message on BAS", () => {
      const message = "warning prompt message";
      vi.mocked(Constants).IS_IN_BAS = true;
      
      const appWizard = events.getAppWizard();
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      vi.spyOn(events as any, "getMessageImage").mockReturnValue("warnTheia");
      
      appWizard.showWarning(message, MessageType.prompt);
      
      expect(appendLineSpy).toHaveBeenCalledWith(message);
      expect(mockRpc.invoke).toHaveBeenCalledWith("showPromptMessage", [message, Severity.warning, "warnTheia"]);
    });

    it("information prompt message on BAS", () => {
      const message = "information prompt message";
      vi.mocked(Constants).IS_IN_BAS = true;
      
      const appWizard = events.getAppWizard();
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      vi.spyOn(events as any, "getMessageImage").mockReturnValue("infoTheia");
      
      appWizard.showInformation(message, MessageType.prompt);
      
      expect(appendLineSpy).toHaveBeenCalledWith(message);
      expect(mockRpc.invoke).toHaveBeenCalledWith("showPromptMessage", [message, Severity.information, "infoTheia"]);
    });

    it("error message with location prompt on vscode", () => {
      const message = "error prompt message";
      vi.mocked(Constants).IS_IN_BAS = false;
      
      const appWizard = events.getAppWizard();
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      vi.spyOn(events as any, "getMessageImage").mockReturnValue("errorVSCodeDark");
      
      appWizard.showError(message, MessageType.prompt);
      
      expect(appendLineSpy).toHaveBeenCalledWith(message);
      expect(mockRpc.invoke).toHaveBeenCalledWith("showPromptMessage", [message, Severity.error, "errorVSCodeDark"]);
    });

    it("warning message with location prompt on vscode", () => {
      const message = "warning prompt message";
      vi.mocked(Constants).IS_IN_BAS = false;
      
      const appWizard = events.getAppWizard();
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      vi.spyOn(events as any, "getMessageImage").mockReturnValue("warnVSCode");
      
      appWizard.showWarning(message, MessageType.prompt);
      
      expect(appendLineSpy).toHaveBeenCalledWith(message);
      expect(mockRpc.invoke).toHaveBeenCalledWith("showPromptMessage", [message, Severity.warning, "warnVSCode"]);
    });

    it("info message with location prompt on vscode", () => {
      const message = "information prompt message";
      vi.mocked(Constants).IS_IN_BAS = false;
      
      const appWizard = events.getAppWizard();
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      vi.spyOn(events as any, "getMessageImage").mockReturnValue("infoVSCode");
      
      appWizard.showInformation(message, MessageType.prompt);
      
      expect(appendLineSpy).toHaveBeenCalledWith(message);
      expect(mockRpc.invoke).toHaveBeenCalledWith("showPromptMessage", [message, Severity.information, "infoVSCode"]);
    });
  });

  it("executeCommand", async () => {
    const commandId = "vscode.open";
    const commandArgs = [vscode.Uri.file("https://en.wikipedia.org")];
    const executeCommandSpy = vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(undefined);
    
    await events.executeCommand(commandId, commandArgs);
    
    expect(executeCommandSpy).toHaveBeenCalledWith(commandId, ...commandArgs);
  });

  it("doGeneratorInstall", () => {
    const withProgressSpy = vi.spyOn(vscode.window, "withProgress").mockResolvedValue(undefined);
    vi.spyOn(mockWebviewPanel, "dispose");
    
    events.doGeneratorInstall();
    
    expect(withProgressSpy).toHaveBeenCalledWith({
      location: 15,
      title: "Installing dependencies..."
    }, expect.any(Function));
  });

  it("setAppWizardHeaderTitle", () => {
    const testTitle = "testTitle";
    const testInfo = "testInfo";
    
    events.setAppWizardHeaderTitle(testTitle, testInfo);
    
    expect(mockRpc.invoke).toHaveBeenCalledWith("setHeaderTitle", [testTitle, testInfo]);
  });

  it("setBanner", () => {
    const bannerProps: IBannerProps = {
      text: "Test Banner",
      ariaLabel: "Test Banner Label",
      displayBannerForStep: "testStep",
      icon: { source: "mdi-check-circle", type: "mdi" },
      action: { text: "Click Me", url: "https://example.com" },
      triggerActionFrom: "banner"
    };
    
    events.setAppWizardBanner(bannerProps);
    
    expect(mockRpc.invoke).toHaveBeenCalledWith("setBanner", [bannerProps]);
  });

  describe("showProgress", () => {
    it("getAppWizard - no message received ---> show default Information message with Progress button", () => {
      const appWizard = events.getAppWizard();
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      
      appWizard.showProgress();
      
      expect(appendLineSpy).toHaveBeenCalled();
      expect(showInfoSpy).toHaveBeenCalledWith(
        messages.default.show_progress_message,
        messages.default.show_progress_button
      );
    });

    it("no message received ---> show default Information message with Progress button", () => {
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      
      events.showProgress();
      
      expect(appendLineSpy).toHaveBeenCalled();
      expect(showInfoSpy).toHaveBeenCalledWith(
        messages.default.show_progress_message,
        messages.default.show_progress_button
      );
    });

    it("message received ---> show Information message with received message and Progress button", () => {
      const message = "Generating generator";
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      
      events.showProgress(message);
      
      expect(appendLineSpy).toHaveBeenCalled();
      expect(showInfoSpy).toHaveBeenCalledWith(message, messages.default.show_progress_button);
    });

    it("Progress button pressed ---> show Output", async () => {
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage")
        .mockResolvedValue(messages.default.show_progress_button as any);
      const appendLineSpy = vi.spyOn(mockGeneratorOutput, "appendLine");
      const showSpy = vi.spyOn(mockGeneratorOutput, "show");
      
      events.showProgress();
      
      // Wait for the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(appendLineSpy).toHaveBeenCalled();
      expect(showInfoSpy).toHaveBeenCalledWith(
        messages.default.show_progress_message,
        messages.default.show_progress_button
      );
      expect(showSpy).toHaveBeenCalled();
    });
  });

  it("getMessageImage", () => {
    const errorImage = (events as any).getMessageImage(Severity.error);
    expect(errorImage).toBeDefined();
    const infoImage = (events as any).getMessageImage(Severity.information);
    expect(infoImage).toBeDefined();
    const warningImage = (events as any).getMessageImage(Severity.warning);
    expect(warningImage).toBeDefined();
  });

  describe("doGeneratorDone", () => {
    const createAndClose = "Create the project and close it for future use";

    beforeEach(() => {
      vi.spyOn(events as any, "doClose").mockImplementation(() => {});
    });

    it("on success, project path and workspace folder are Windows style ---> the project added to current workspace", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [
        { uri: { fsPath: "rootFolderPath" } }, 
        { uri: { fsPath: "testRoot" } }
      ] as any;
      vi.mocked(vscode.workspace).workspaceFile = "/workspace/file/path" as any;
      
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      const updateWorkspaceSpy = vi.spyOn(vscode.workspace, "updateWorkspaceFolders").mockResolvedValue(true);
      
      events.doGeneratorDone(true, "success message", messages.default.add_to_workspace, "project", "testDestinationRoot");
      
      expect(showInfoSpy).toHaveBeenCalledWith(messages.default.artifact_generated_project_add_to_workspace);
      expect(updateWorkspaceSpy).toHaveBeenCalledWith(2, null, expect.any(Object));
    });

    it("on success, project path is already openned in workspace ---> the project added to current workspace", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [
        { uri: { fsPath: "rootFolderPath" } }, 
        { uri: { fsPath: "testDestinationRoot" } }
      ] as any;
      vi.mocked(vscode.workspace).workspaceFile = "/workspace/file/path" as any;
      
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      const updateWorkspaceSpy = vi.spyOn(vscode.workspace, "updateWorkspaceFolders").mockResolvedValue(true);
      
      events.doGeneratorDone(true, "success message", messages.default.add_to_workspace, "project", "testDestinationRoot");
      
      expect(showInfoSpy).toHaveBeenCalledWith(messages.default.artifact_generated_project_add_to_workspace);
      expect(updateWorkspaceSpy).toHaveBeenCalledWith(2, null, expect.any(Object));
    });

    it("on success, project path parent folder is already openned in workspace ---> the user changed to create and close the project for later use", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [
        { uri: { fsPath: "rootFolderPath" } }, 
        { uri: { fsPath: "testDestinationRoot" } }
      ] as any;
      
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      
      events.doGeneratorDone(true, "success message", createAndClose, "project", "testDestinationRoot/projectName");
      
      expect(showInfoSpy).toHaveBeenCalledWith(messages.default.artifact_generated_project_saved_for_future);
    });

    it("on success, project path parent folder is already openned in workspace ---> the project openned in a stand-alone", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [
        { uri: { fsPath: "rootFolderPath" } }, 
        { uri: { fsPath: "testDestinationRoot" } }
      ] as any;
      
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      const executeCommandSpy = vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(undefined);
      
      events.doGeneratorDone(true, "success message", messages.default.open_in_a_new_workspace, "project", "testDestinationRoot/./projectName");
      
      expect(showInfoSpy).toHaveBeenCalledWith(messages.default.artifact_generated_project_open_in_a_new_workspace);
      expect(executeCommandSpy).toHaveBeenCalledWith("vscode.openFolder", expect.any(Object));
    });

    it("on success, no workspace is opened ---> the project openned in a new multi-root workspace", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [];
      vi.mocked(vscode.workspace).workspaceFile = undefined;
      
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(undefined);
      const updateWorkspaceSpy = vi.spyOn(vscode.workspace, "updateWorkspaceFolders").mockResolvedValue(true);
      const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(false);
      const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      const fileSpy = vi.spyOn(vscode.Uri, "file").mockReturnValue({ fsPath: "testFsPath" } as any);
      
      events.doGeneratorDone(true, "success message", messages.default.add_to_workspace, "project", "testDestinationRoot/./projectName");
      
      expect(showInfoSpy).toHaveBeenCalledWith(messages.default.artifact_generated_project_add_to_workspace);
      expect(updateWorkspaceSpy).toHaveBeenCalledWith(0, null, expect.any(Object));
      expect(existsSyncSpy).toHaveBeenCalled();
      expect(writeFileSyncSpy).toHaveBeenCalled();
      expect(fileSpy).toHaveBeenCalledTimes(2);
    });

    it("on success, targetFolder is uri and the the project openned in a new multi-root workspace", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [];
      vi.mocked(vscode.workspace).workspaceFile = undefined;
      
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(undefined);
      const updateWorkspaceSpy = vi.spyOn(vscode.workspace, "updateWorkspaceFolders").mockResolvedValue(true);
      const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(false);
      const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      
      events.doGeneratorDone(true, "success message", messages.default.add_to_workspace, "project", '{"uri":"abapdf://testDestinationRoot","name":"projectName"}');
      
      expect(showInfoSpy).toHaveBeenCalledWith(messages.default.artifact_generated_project_add_to_workspace);
      expect(updateWorkspaceSpy).toHaveBeenCalled();
      expect(existsSyncSpy).toHaveBeenCalled();
      expect(writeFileSyncSpy).toHaveBeenCalled();
    });

    it("on success, targetFolderPath is uri and the the project openned in a Open the project in a stand-alone", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [];
      vi.mocked(vscode.workspace).workspaceFile = undefined;
      
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      const executeCommandSpy = vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(undefined);
      const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(false);
      const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      
      events.doGeneratorDone(true, "success message", messages.default.open_in_a_new_workspace, "project", '{"uri":"abapdf://testDestinationRoot","name":"projectName"}');
      
      expect(showInfoSpy).toHaveBeenCalledWith(messages.default.artifact_generated_project_open_in_a_new_workspace);
      expect(executeCommandSpy).toHaveBeenCalledWith("vscode.openFolder", expect.any(Object));
      expect(existsSyncSpy).toHaveBeenCalled();
      expect(writeFileSyncSpy).toHaveBeenCalled();
    });

    it("on success, targetFolderPath is uri and the the project openned in a Create the project and close it for future use", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [];
      vi.mocked(vscode.workspace).workspaceFile = undefined;
      
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(false);
      const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      
      events.doGeneratorDone(true, "success message", createAndClose, "project", '{"uri":"abapdf://testDestinationRoot","name":"projectName"}');
      
      expect(showInfoSpy).toHaveBeenCalledWith(messages.default.artifact_generated_project_saved_for_future);
      expect(existsSyncSpy).toHaveBeenCalled();
      expect(writeFileSyncSpy).toHaveBeenCalled();
    });

    it("on success, module is created", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [
        { uri: { fsPath: "rootFolderPath" } }, 
        { uri: { fsPath: "testDestinationRoot" } }
      ] as any;
      
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      
      events.doGeneratorDone(true, "success message", createAndClose, "module", "testDestinationRoot/projectName/../projectName");
      
      expect(showInfoSpy).toHaveBeenCalledWith(messages.default.artifact_generated_module);
    });

    it("on success, not a module and not a project", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [
        { uri: { fsPath: "rootFolderPath" } },
        { uri: { fsPath: "testDestinationRoot/../testDestinationRoot" } }
      ] as any;
      
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      
      events.doGeneratorDone(true, "success message", createAndClose, "files", "testDestinationRoot/projectName/../projectName");
      
      expect(showInfoSpy).toHaveBeenCalledWith(messages.default.artifact_generated_files);
    });

    it("on success with null targetFolderPath", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [{ uri: { fsPath: "rootFolderPath" } }] as any;
      
      const showInfoSpy = vi.spyOn(vscode.window, "showInformationMessage").mockResolvedValue(undefined);
      
      events.doGeneratorDone(true, "success message", createAndClose, "files", undefined);
      
      expect(showInfoSpy).toHaveBeenCalledWith(messages.default.artifact_generated_files);
    });

    it("on failure", () => {
      const showErrorSpy = vi.spyOn(vscode.window, "showErrorMessage").mockResolvedValue(undefined);
      
      events.doGeneratorDone(false, "error message", createAndClose, "files");
      
      expect(showErrorSpy).toHaveBeenCalledWith("error message");
    });
  });

  describe("getUniqueProjectName", () => {
    it("should return baseName if it does not exist in workspace", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [{ name: "Project1" }, { name: "Project2" }] as any;
      
      const result = (events as any).getUniqueProjectName("NewProject");
      
      expect(result).toBe("NewProject");
    });

    it("should return baseName(1) if baseName already exists", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [{ name: "Project1" }, { name: "NewProject" }] as any;
      
      const result = (events as any).getUniqueProjectName("NewProject");
      
      expect(result).toBe("NewProject(1)");
    });

    it("should return baseName with incremented counter if multiple exist", () => {
      vi.mocked(vscode.workspace).workspaceFolders = [
        { name: "NewProject" }, 
        { name: "NewProject(1)" }, 
        { name: "NewProject(2)" }
      ] as any;
      
      const result = (events as any).getUniqueProjectName("NewProject");
      
      expect(result).toBe("NewProject(3)");
    });

    it("should handle empty workspace folders gracefully", () => {
      vi.mocked(vscode.workspace).workspaceFolders = undefined;
      
      const result = (events as any).getUniqueProjectName("UniqueProject");
      
      expect(result).toBe("UniqueProject");
    });
  });
});