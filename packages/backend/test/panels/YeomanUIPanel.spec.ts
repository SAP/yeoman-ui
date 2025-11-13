import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { vscode } from "../mockUtil";
import * as YeomanUIPanel from "../../src/panels/YeomanUIPanel";
import { Env } from "../../src/utils/env";
import { Constants } from "../../src/utils/constants";
import { NpmCommand } from "../../src/utils/npm";
import { set } from "lodash";
import { join } from "path";
import { homedir } from "os";
import messages from "../../src/messages";
import { AnalyticsWrapper } from "../../src/usage-report/usage-analytics-wrapper";

// Mock external modules
vi.mock("../../src/logger/logger-wrapper", () => ({
  getClassLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
    getChildLogger: vi.fn(() => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      trace: vi.fn(),
    }))
  })),
  getWebviewRpcLibraryLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    getChildLogger: vi.fn(() => ({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
    })),
  }))
}));

describe("YeomanUIPanel unit test", () => {
  let panel: YeomanUIPanel.YeomanUIPanel;

  beforeEach(() => {
    vi.clearAllMocks();
    panel = new YeomanUIPanel.YeomanUIPanel(vscode.context);
    
    // Mock flowPromise for loadWebviewPanel tests
    (panel as any)["flowPromise"] = {
      promise: Promise.resolve()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("runGenerator", () => {
    it("generator is not choosen", async () => {
      const getAllGeneratorNamespacesSpy = vi.spyOn(Env, "getAllGeneratorNamespaces").mockResolvedValue(["gen1:test", "test:app", "code:app"]);
      const showQuickPickSpy = vi.spyOn(vscode.window, "showQuickPick").mockResolvedValue(undefined);
      
      await panel.runGenerator();
      
      expect(getAllGeneratorNamespacesSpy).toHaveBeenCalled();
      expect(showQuickPickSpy).toHaveBeenCalled();
    });

    it("generator is choosen", async () => {
      vi.spyOn(NpmCommand, "getNodeProcessVersions").mockResolvedValue({ node: "20.6.0" } as any);
      const getAllGeneratorNamespacesSpy = vi.spyOn(Env, "getAllGeneratorNamespaces").mockResolvedValue(["gen1:test", "test:app", "code:app"]);
      const showQuickPickSpy = vi.spyOn(vscode.window, "showQuickPick").mockResolvedValue("test:app" as any);
      const loadWebviewPanelSpy = vi.spyOn(panel, "loadWebviewPanel").mockImplementation(vi.fn());
      
      await panel.runGenerator();
      
      expect(getAllGeneratorNamespacesSpy).toHaveBeenCalled();
      expect(showQuickPickSpy).toHaveBeenCalled();
      expect(loadWebviewPanelSpy).toHaveBeenCalled();
    });
  });

  describe("loadWebviewPanel", () => {
    describe("in VSCODE", () => {
      beforeEach(() => {
        vi.spyOn(NpmCommand, "getNodeProcessVersions").mockResolvedValue({ node: "20.6.0" } as any);
        (Constants as any)["IS_IN_BAS"] = false;
      });

      it("generator is not provided, in VSCODE", async () => {
        const getAllGeneratorNamespacesSpy = vi.spyOn(Env, "getAllGeneratorNamespaces");
        const setWebviewPanelSpy = vi.spyOn(panel, "setWebviewPanel").mockImplementation(vi.fn());
        
        await panel.loadWebviewPanel();
        
        expect(getAllGeneratorNamespacesSpy).not.toHaveBeenCalled();
        expect(setWebviewPanelSpy).toHaveBeenCalled();
      });

      it("existing generator is provided, in VSCODE", async () => {
        const getAllGeneratorNamespacesSpy = vi.spyOn(Env, "getAllGeneratorNamespaces").mockResolvedValue(["gen1:test", "test:app", "code:app"]);
        const checkAccessSpy = vi.spyOn(NpmCommand, "checkAccessAndSetGeneratorsPath");
        const setWebviewPanelSpy = vi.spyOn(panel, "setWebviewPanel").mockImplementation(vi.fn());
        
        await panel.loadWebviewPanel({ generator: "test:app" });
        
        expect(getAllGeneratorNamespacesSpy).toHaveBeenCalled();
        expect(checkAccessSpy).not.toHaveBeenCalled();
        expect(setWebviewPanelSpy).toHaveBeenCalled();
      });

      it("existing generator is provided with viewColumn parameter, in VSCODE", async () => {
        const getAllGeneratorNamespacesSpy = vi.spyOn(Env, "getAllGeneratorNamespaces").mockResolvedValue(["gen1:test", "test:app", "code:app"]);
        const checkAccessSpy = vi.spyOn(NpmCommand, "checkAccessAndSetGeneratorsPath");
        const setWebviewPanelSpy = vi.spyOn(panel, "setWebviewPanel").mockImplementation(vi.fn());
        
        await panel.loadWebviewPanel({ generator: "test:app", viewColumn: vscode.ViewColumn.Two });
        
        expect(getAllGeneratorNamespacesSpy).toHaveBeenCalled();
        expect(checkAccessSpy).not.toHaveBeenCalled();
        expect(setWebviewPanelSpy).toHaveBeenCalled();
      });

      it("provided generator does not exist, in VSCODE", async () => {
        const getAllGeneratorNamespacesSpy = vi.spyOn(Env, "getAllGeneratorNamespaces").mockResolvedValue(["gen1:test", "code:app"]);
        const checkAccessSpy = vi.spyOn(NpmCommand, "checkAccessAndSetGeneratorsPath").mockResolvedValue();
        const executeCommandSpy = vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(undefined);
        const setWebviewPanelSpy = vi.spyOn(panel, "setWebviewPanel").mockImplementation(vi.fn());
        
        await panel.loadWebviewPanel({ generator: "test:app" });
        
        expect(getAllGeneratorNamespacesSpy).toHaveBeenCalled();
        expect(checkAccessSpy).toHaveBeenCalled();
        expect(executeCommandSpy).toHaveBeenCalledWith("exploreGenerators", {
          package: { name: "generator-test" },
        });
      });
    });

    describe("in BAS", () => {
      beforeEach(() => {
        (Constants as any)["IS_IN_BAS"] = true;
      });

      it("generator is not provided", async () => {
        const getAllGeneratorNamespacesSpy = vi.spyOn(Env, "getAllGeneratorNamespaces");
        const setWebviewPanelSpy = vi.spyOn(panel, "setWebviewPanel").mockImplementation(vi.fn());
        
        await panel.loadWebviewPanel();
        
        expect(getAllGeneratorNamespacesSpy).not.toHaveBeenCalled();
        expect(setWebviewPanelSpy).toHaveBeenCalled();
      });

      it("existing generator is provided", async () => {
        const getAllGeneratorNamespacesSpy = vi.spyOn(Env, "getAllGeneratorNamespaces").mockResolvedValue(["gen1:test", "test:app", "code:app"]);
        const checkAccessSpy = vi.spyOn(NpmCommand, "checkAccessAndSetGeneratorsPath");
        const setWebviewPanelSpy = vi.spyOn(panel, "setWebviewPanel").mockImplementation(vi.fn());
        
        await panel.loadWebviewPanel({ generator: "test:app" });
        
        expect(getAllGeneratorNamespacesSpy).toHaveBeenCalled();
        expect(checkAccessSpy).not.toHaveBeenCalled();
        expect(setWebviewPanelSpy).toHaveBeenCalled();
      });

      it("existing generator is provided with viewColumn parameter, in VSCODE", async () => {
        const getAllGeneratorNamespacesSpy = vi.spyOn(Env, "getAllGeneratorNamespaces").mockResolvedValue(["gen1:test", "test:app", "code:app"]);
        const checkAccessSpy = vi.spyOn(NpmCommand, "checkAccessAndSetGeneratorsPath");
        const setWebviewPanelSpy = vi.spyOn(panel, "setWebviewPanel").mockImplementation(vi.fn());
        
        await panel.loadWebviewPanel({ generator: "test:app", viewColumn: vscode.ViewColumn.Two });
        
        expect(getAllGeneratorNamespacesSpy).toHaveBeenCalled();
        expect(checkAccessSpy).not.toHaveBeenCalled();
        expect(setWebviewPanelSpy).toHaveBeenCalled();
      });

      it("provided generator does not exist", async () => {
        const getAllGeneratorNamespacesSpy = vi.spyOn(Env, "getAllGeneratorNamespaces").mockResolvedValue(["gen1:test", "code:app"]);
        const checkAccessSpy = vi.spyOn(NpmCommand, "checkAccessAndSetGeneratorsPath");
        const setWebviewPanelSpy = vi.spyOn(panel, "setWebviewPanel").mockImplementation(vi.fn());
        
        await panel.loadWebviewPanel({ generator: "test:app" });
        
        expect(getAllGeneratorNamespacesSpy).toHaveBeenCalled();
        expect(checkAccessSpy).not.toHaveBeenCalled();
        expect(setWebviewPanelSpy).toHaveBeenCalled();
      });
    });

    describe("no NodeJS installation is found in VSCode", () => {
      beforeEach(() => {
        vi.spyOn(NpmCommand, "getNodeProcessVersions").mockResolvedValue({} as any);
        (Constants as any)["IS_IN_BAS"] = false;
      });

      it.skip("should show an error message", async () => {
        const showErrorMessageSpy = vi.spyOn(vscode.window, "showErrorMessage").mockImplementation(vi.fn());
        
        await panel.loadWebviewPanel();
        
        expect(showErrorMessageSpy).toHaveBeenCalledWith(messages.nodejs_install_not_found);
      });
    });
  });

  describe("toggleOutput", () => {
    it("toggleOutput - output exists", () => {
      const mockOutput = {
        show: vi.fn()
      };
      (panel as any)["output"] = mockOutput;
      
      panel.toggleOutput();
      
      expect(mockOutput.show).toHaveBeenCalled();
    });
  });

  describe("notifyGeneratorsChange", () => {
    const objYeomanui = {
      _notifyGeneratorsChange: vi.fn(() => Promise.resolve()),
      _notifyGeneratorsInstall: vi.fn(() => Promise.resolve()),
    };

    beforeEach(() => {
      vi.clearAllMocks();
      objYeomanui._notifyGeneratorsChange.mockClear();
      objYeomanui._notifyGeneratorsInstall.mockClear();
    });

    it("notifyGeneratorsChange - no args received", () => {
      set(panel, "yeomanui", objYeomanui);
      
      panel.notifyGeneratorsChange();
      
      // When no args (undefined), isEmpty is true, so it calls _notifyGeneratorsInstall(undefined)
      // and then _notifyGeneratorsChange in setTimeout
      expect(objYeomanui._notifyGeneratorsInstall).toHaveBeenCalledWith(undefined);
    });

    it("notifyGeneratorsChange - args provided", () => {
      set(panel, "yeomanui", objYeomanui);
      const args = ["gen"];
      
      panel.notifyGeneratorsChange(args);
      
      // When args provided (non-empty array), isEmpty is false, so it calls _notifyGeneratorsChange
      expect(objYeomanui._notifyGeneratorsChange).toHaveBeenCalled();
      expect(objYeomanui._notifyGeneratorsInstall).not.toHaveBeenCalled();
    });

    it("notifyGeneratorsChange - empty args provided", () => {
      set(panel, "yeomanui", objYeomanui);
      const args: any[] = [];
      
      panel.notifyGeneratorsChange(args);
      
      // When empty array provided, isEmpty is true, so it calls _notifyGeneratorsInstall(args)
      // and then _notifyGeneratorsChange in setTimeout
      // installGens should be the args (empty array) since yeomanui exists
      expect(objYeomanui._notifyGeneratorsInstall).toHaveBeenCalledWith(args);
      expect((panel as any)["installGens"]).toEqual(args);
    });

    it("notifyGeneratorsChange - yeomanui object does not exist on the panel", () => {
      set(panel, "yeomanui", undefined);
      
      expect(() => panel.notifyGeneratorsChange()).not.toThrow();
      expect((panel as any)["installGens"]).toBeUndefined();
    });
  });

  describe("showOpenDialog", () => {
    const selected = vscode.Uri.file("selected");
    const required = "some/path/file";

    it("showOpenFileDialog", async () => {
      const showOpenDialogSpy = vi.spyOn(panel as any, "showOpenDialog").mockReturnValue(selected.fsPath);
      
      const result = await (panel as any)["showOpenFileDialog"](required);
      
      expect(result).toBe(selected.fsPath);
      expect(showOpenDialogSpy).toHaveBeenCalledWith(required, true);
    });

    it("showOpenFolderDialog", async () => {
      const showOpenDialogSpy = vi.spyOn(panel as any, "showOpenDialog").mockReturnValue(selected.fsPath);
      
      const result = await (panel as any)["showOpenFolderDialog"](required);
      
      expect(result).toBe(selected.fsPath);
      expect(showOpenDialogSpy).toHaveBeenCalledWith(required, false);
    });

    it("showOpenDialog - empty path provided, ws folder exists", async () => {
      const canSelectFiles = true;
      const objWs = [{ uri: { fsPath: "rootFolderPath" } }];
      Object.defineProperty(vscode.workspace, 'workspaceFolders', {
        value: objWs,
        writable: true
      });
      const showOpenDialogSpy = vi.spyOn(vscode.window, "showOpenDialog").mockResolvedValue([selected] as any);
      
      const result = await (panel as any)["showOpenDialog"]("", canSelectFiles);
      
      expect(result).toBe(selected.fsPath);
      expect(showOpenDialogSpy).toHaveBeenCalledWith({ 
        canSelectFiles, 
        canSelectFolders: !canSelectFiles, 
        defaultUri: objWs[0].uri 
      });
    });

    it("showOpenDialog - empty path provided, ws folder not exists", async () => {
      const canSelectFiles = false;
      const objWs = [{}];
      Object.defineProperty(vscode.workspace, 'workspaceFolders', {
        value: objWs,
        writable: true
      });
      const showOpenDialogSpy = vi.spyOn(vscode.window, "showOpenDialog").mockResolvedValue([selected] as any);
      
      const result = await (panel as any)["showOpenDialog"]("", canSelectFiles);
      
      expect(result).toBe(selected.fsPath);
      expect(showOpenDialogSpy).toHaveBeenCalledWith({
        canSelectFiles,
        canSelectFolders: !canSelectFiles,
        defaultUri: vscode.Uri.file(join(homedir())),
      });
    });

    it("showOpenDialog - path provided", async () => {
      const canSelectFiles = false;
      const showOpenDialogSpy = vi.spyOn(vscode.window, "showOpenDialog").mockResolvedValue([selected] as any);
      
      const result = await (panel as any)["showOpenDialog"](required, canSelectFiles);
      
      expect(result).toBe(selected.fsPath);
      expect(showOpenDialogSpy).toHaveBeenCalledWith({ 
        canSelectFiles, 
        canSelectFolders: !canSelectFiles, 
        defaultUri: vscode.Uri.file(required) 
      });
    });

    it("showOpenDialog - path provided, showOpen throws error", async () => {
      const canSelectFiles = true;
      const showOpenDialogSpy = vi.spyOn(vscode.window, "showOpenDialog").mockRejectedValue(new Error("unexpected"));
      
      const result = await (panel as any)["showOpenDialog"](required, canSelectFiles);
      
      expect(result).toBe(required);
      expect(showOpenDialogSpy).toHaveBeenCalledWith({ 
        canSelectFiles, 
        canSelectFolders: !canSelectFiles, 
        defaultUri: vscode.Uri.file(required) 
      });
    });
  });

  describe("dispose", () => {
    const objYeomanui: any = {
      generatorName: "generator-name",
      promptCount: 1,
      gen: {
        prompts: {
          items: [
            {
              name: "step1",
            },
            {
              name: "step2",
            },
          ],
        },
      },
    };

    const webviewPanel = {
      dispose: vi.fn(),
    };

    beforeEach(() => {
      set(panel, "yeomanui", objYeomanui);
      set(panel, "webViewPanel", webviewPanel);
      set(panel, "disposables", []);
      set(panel, "cleanFlowPromise", () => {});

      vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(undefined);
    });

    it("dispose - calling usage analytics when panel is manually closed.", async () => {
      const updateGeneratorClosedManuallySpy = vi.spyOn(AnalyticsWrapper, "updateGeneratorClosedManually").mockResolvedValue();
      
      await (panel as any)["dispose"]();
      
      expect(updateGeneratorClosedManuallySpy).toHaveBeenCalledWith("generator-name", "step1", 1, 2);
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith("setContext", "yeomanUI.Focused", false);
    });

    it("dispose - not calling usage analytics when generation ended and user clicked finish.", async () => {
      set(webviewPanel, Constants.GENERATOR_COMPLETED, true);
      const updateGeneratorClosedManuallySpy = vi.spyOn(AnalyticsWrapper, "updateGeneratorClosedManually").mockResolvedValue();
      
      await (panel as any)["dispose"]();
      
      expect(updateGeneratorClosedManuallySpy).not.toHaveBeenCalled();
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith("setContext", "yeomanUI.Focused", false);
    });
  });
});
