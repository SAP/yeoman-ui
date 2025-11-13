import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import * as extension from "../src/extension";
import { AnalyticsWrapper } from "../src/usage-report/usage-analytics-wrapper";
import * as shellJsWorkarounds from "../src/utils/shellJsWorkarounds";
import { vscode } from "./mockUtil";
import * as loggerWrapper from "../src/logger/logger-wrapper";

// Mock the logger wrapper module
vi.mock("../src/logger/logger-wrapper", () => ({
  createExtensionLoggerAndSubscribeToLogSettingsChanges: vi.fn(),
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
    getChildLogger: vi.fn()
  })),
  getClassLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
    getChildLogger: vi.fn()
  }))
}));

describe("extension unit test", () => {
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

  describe("activate", () => {
    it("commands registration", () => {
      const createLoggerMock = vi.mocked(loggerWrapper.createExtensionLoggerAndSubscribeToLogSettingsChanges);
      const createTrackerSpy = vi.spyOn(AnalyticsWrapper, "createTracker").mockImplementation(() => {});
      const applySpy = vi.spyOn(shellJsWorkarounds, "apply").mockImplementation(() => {});
      const registerWebviewSpy = vi.spyOn(vscode.window, "registerWebviewPanelSerializer").mockImplementation(() => Promise.resolve());

      extension.activate(testContext);

      expect(applySpy).toHaveBeenCalledOnce();
      expect(registerWebviewSpy).toHaveBeenCalledTimes(2);
      expect(createTrackerSpy).toHaveBeenCalled();
      expect(createLoggerMock).toHaveBeenCalled();
    });

    it("logger failure on extenion activation", () => {
      const createLoggerMock = vi.mocked(loggerWrapper.createExtensionLoggerAndSubscribeToLogSettingsChanges);
      createLoggerMock.mockImplementation(() => {
        throw new Error("activation error");
      });
      
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      extension.activate(testContext);
      
      expect(consoleSpy).toHaveBeenCalledWith("Extension activation failed.", "activation error");
      expect(createLoggerMock).toHaveBeenCalled();
    });
  });

  it("deactivate", () => {
    extension.deactivate();
  });
});
