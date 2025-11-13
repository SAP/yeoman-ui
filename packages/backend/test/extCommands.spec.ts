import { vscode } from "./mockUtil";
import { get } from "lodash";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { ExtCommands } from "../src/extCommands";

// Mock the logger wrapper module
vi.mock("../src/logger/logger-wrapper", () => ({
  getClassLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
    getChildLogger: vi.fn()
  })),
  createExtensionLoggerAndSubscribeToLogSettingsChanges: vi.fn(),
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
    getChildLogger: vi.fn()
  }))
}));

describe("extension commands unit test", () => {
  const testContext: any = {
    subscriptions: [],
    extensionPath: "testExtensionpath",
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });

  it("registerAndSubscribeCommands", () => {
    const oRegisteredCommands: any = vscode.commands.getCommands();

    new ExtCommands(testContext).registerAndSubscribeCommands();

    expect(get(oRegisteredCommands, "loadYeomanUI")).toBeDefined();
    expect(get(oRegisteredCommands, "yeomanUI.toggleOutput")).toBeDefined();
    expect(get(oRegisteredCommands, "exploreGenerators")).toBeDefined();
    expect(get(oRegisteredCommands, "yeomanUI._notifyGeneratorsChange")).toBeDefined();
    expect(get(oRegisteredCommands, "runGenerator")).toBeDefined();
  });

  it("call ExploreGensPanel commands", async () => {
    const exploreGensPanelMock = {
      loadWebviewPanel: vi.fn(),
    };
    const extCommands = new ExtCommands(testContext);
    extCommands["exploreGensPanel"] = exploreGensPanelMock;

    await extCommands["exploreGenerators_Command"]();

    expect(exploreGensPanelMock.loadWebviewPanel).toHaveBeenCalled();
  });

  it("call YeomanUIPanel commands", async () => {
    const yeomanUIPanelMock = {
      runGenerator: vi.fn(),
      loadWebviewPanel: vi.fn(),
      toggleOutput: vi.fn(),
      notifyGeneratorsChange: vi.fn(),
    };

    const extCommands = new ExtCommands(testContext);
    extCommands["yeomanUIPanel"] = yeomanUIPanelMock;

    await extCommands["yeomanUIPanel_loadYeomanUI_Command"]();
    await extCommands["yeomanUIPanel_toggleOutput_Command"]();
    await extCommands["yeomanUIPanel_notifyGeneratorsChange_Command"]();
    await extCommands["yeomanUIPanel_runGenerator_Command"]();

    expect(yeomanUIPanelMock.runGenerator).toHaveBeenCalled();
    expect(yeomanUIPanelMock.loadWebviewPanel).toHaveBeenCalled();
    expect(yeomanUIPanelMock.toggleOutput).toHaveBeenCalled();
    expect(yeomanUIPanelMock.notifyGeneratorsChange).toHaveBeenCalled();
  });

  it("call YeomanUIPanel commands - when yeomanUIPanel is in invalid state", async () => {
    const yeomanUIPanelMock = {
      runGenerator: vi.fn(),
      loadWebviewPanel: vi.fn(),
      toggleOutput: vi.fn(),
      notifyGeneratorsChange: vi.fn(),
    };

    const extCommands = new ExtCommands(testContext);
    const getYeomanUIPanelSpy = vi.spyOn(extCommands as any, "getYeomanUIPanel").mockImplementation((verifyEmptyState = true) => {
      if (verifyEmptyState) {
        throw new Error("yeomanUIPanel is in invalid state");
      }
      return yeomanUIPanelMock;
    });

    await extCommands["yeomanUIPanel_loadYeomanUI_Command"]();
    await extCommands["yeomanUIPanel_toggleOutput_Command"]();
    await extCommands["yeomanUIPanel_notifyGeneratorsChange_Command"]();
    await extCommands["yeomanUIPanel_runGenerator_Command"]();

    expect(yeomanUIPanelMock.runGenerator).not.toHaveBeenCalled();
    expect(yeomanUIPanelMock.loadWebviewPanel).not.toHaveBeenCalled();
    expect(yeomanUIPanelMock.toggleOutput).toHaveBeenCalled();
    expect(yeomanUIPanelMock.notifyGeneratorsChange).toHaveBeenCalled();
    
    getYeomanUIPanelSpy.mockRestore();
  });

  describe("getYeomanUIPanel", () => {
    const extCommands = new ExtCommands(testContext);

    it("getYeomanUIPanel - open twice, no generator loaded", async () => {
      extCommands["yeomanUIPanel"] = undefined;

      // yeomanUIPanel is undefined
      const yeomanUIPanel_firstTime = await extCommands["getYeomanUIPanel"]();
      // yeomanUIPanel should be already defined
      const yeomanUIPanel_secondTime = await extCommands["getYeomanUIPanel"]();

      expect(yeomanUIPanel_firstTime).toBe(yeomanUIPanel_secondTime);
    });

    it("getYeomanUIPanel - there is generator running, answer 'Continue'", async () => {
      const mockYeomanui = { yeomanui: { generatorName: "test" } };
      extCommands["yeomanUIPanel"] = mockYeomanui;
      
      const showWarningMessageSpy = vi.spyOn(vscode.window, 'showWarningMessage').mockResolvedValue("Continue" as any);
      
      const result = await extCommands["getYeomanUIPanel"]();
      expect(result).toBe(mockYeomanui);
      
      showWarningMessageSpy.mockRestore();
    });

    it("getYeomanUIPanel - there is generator running, answer 'Cancel'", async () => {
      const mockYeomanui = { yeomanui: { generatorName: "test" } };
      extCommands["yeomanUIPanel"] = mockYeomanui;
      
      const showWarningMessageSpy = vi.spyOn(vscode.window, 'showWarningMessage').mockResolvedValue("Cancel" as any);
      
      try {
        await extCommands["getYeomanUIPanel"]();
      } catch (e) {
        expect(e instanceof Error).toBe(true);
      }
      
      showWarningMessageSpy.mockRestore();
    });

    it("getYeomanUIPanel - there is generator running, canceled", async () => {
      const mockYeomanui = { yeomanui: { generatorName: "test" } };
      extCommands["yeomanUIPanel"] = mockYeomanui;
      
      const showWarningMessageSpy = vi.spyOn(vscode.window, 'showWarningMessage').mockResolvedValue(undefined);
      
      try {
        await extCommands["getYeomanUIPanel"]();
      } catch (e) {
        expect(e instanceof Error).toBe(true);
      }
      
      showWarningMessageSpy.mockRestore();
    });

    it("getYeomanUIPanel - skip verifing empty state", async () => {
      const mockYeomanui = { yeomanui: { generatorName: "test" } };
      extCommands["yeomanUIPanel"] = mockYeomanui;
      
      const showWarningMessageSpy = vi.spyOn(vscode.window, 'showWarningMessage');
      
      const result = await extCommands["getYeomanUIPanel"](false);
      expect(result).toBe(mockYeomanui);
      expect(showWarningMessageSpy).not.toHaveBeenCalled();
      
      showWarningMessageSpy.mockRestore();
    });

    it("isInEmptyState - yeomanUIPanel is undefined", async () => {
      extCommands["yeomanUIPanel"] = undefined;
      const result = await extCommands["isInEmptyState"]();
      expect(result).toBe(true);
    });
  });

  it("getExploreGensPanel", async () => {
    const extCommands = new ExtCommands(testContext);
    extCommands["exploreGensPanel"] = undefined;

    // exploreGensPanel is undefined
    const exploreGensPanel_firstTime = await extCommands["getExploreGensPanel"]();
    // exploreGensPanel should be already defined
    const exploreGensPanel_secondTime = await extCommands["getExploreGensPanel"]();

    expect(exploreGensPanel_firstTime).toBe(exploreGensPanel_secondTime);
  });
});
