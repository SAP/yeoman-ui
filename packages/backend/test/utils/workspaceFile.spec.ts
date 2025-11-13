import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import {
  FolderUriConfig,
  getFolderUri,
  getValidFolderUri,
  isUriFlow,
  isValidUri,
  WorkspaceFile,
} from "../../src/utils/workspaceFile";
import { Constants } from "../../src/utils/constants";
import { vscode } from "../mockUtil";
import * as fs from "fs";
import { dirname, join, normalize, relative } from "path";
import { Uri } from "vscode";
import messages from "../../src/messages";

// Mock fs module for ES module compatibility
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

describe("extension unit test", () => {
  // Mock functions
  const mockWriteFileSync = vi.mocked(fs.writeFileSync);
  const mockExistsSync = vi.mocked(fs.existsSync);
  const mockUriFile = vi.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Mock vscode.Uri.file
    vi.spyOn(vscode.Uri, 'file').mockImplementation(mockUriFile);
  });

  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });

  describe("create workspace file", () => {
    it("createWs", () => {
      const wsFilePath = normalize(join(Constants.HOMEDIR_PROJECTS, "../tmp/workspace.code-workspace"));
      const folderConfig = { path: "relative/path/to/project" }; // Adjust to match expected format

      mockUriFile.mockReturnValue(wsFilePath);
      
      WorkspaceFile.createWs(wsFilePath, folderConfig);

      expect(mockUriFile).toHaveBeenCalledWith(wsFilePath);
      expect(mockWriteFileSync).toHaveBeenCalledWith(wsFilePath, JSON.stringify({ folders: [folderConfig], settings: {} }));
    });

    it("create createWsWithPath", () => {
      const targetFolderPath = normalize(join(Constants.HOMEDIR_PROJECTS, "../tmp/targetFolderPath"));
      
      // Create a proper mock Uri object with fsPath property
      const targetFolderUri = {
        fsPath: targetFolderPath,
        scheme: 'file',
        authority: '',
        path: targetFolderPath,
        query: '',
        fragment: ''
      } as Uri;

      const wsFilePath = join(Constants.HOMEDIR_PROJECTS, "workspace.code-workspace"); // Expected workspace file path
      const folderConfig = { path: relative(dirname(wsFilePath), targetFolderPath) };

      // Mock existsSync to return false on the first call and true on subsequent calls
      mockExistsSync.mockReturnValueOnce(false); // Simulate that the file doesn't exist initially

      mockUriFile.mockReturnValue(targetFolderUri);

      WorkspaceFile.createWsWithPath(targetFolderUri);
      
      // The actual workspace file path will be determined by the method
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("workspace"),
        JSON.stringify({ folders: [folderConfig], settings: {} })
      );
    });

    it("workspace file exists with isUri true", () => {
      const targetFolderPath = normalize(join(Constants.HOMEDIR_PROJECTS, "../projects/tmp/targetFolderPath"));

      // Create FolderUriConfig
      const folderConfig: FolderUriConfig = {
        uri: targetFolderPath,
        name: "targetFolder", // Provide a name for the folder (optional, but required by the interface)
      };

      // Mock existsSync to simulate file existence
      mockExistsSync.mockReturnValueOnce(true); // Simulate that workspace.code-workspace exists
      mockExistsSync.mockReturnValueOnce(false); // Simulate that workspace.1.code-workspace does not exist

      const fileContent = {
        folders: [
          folderConfig, // Pass the FolderUriConfig object
        ],
        settings: {},
      };

      WorkspaceFile.createWsWithUri(folderConfig); // Pass the FolderUriConfig here
      
      // Check that writeFileSync was called with a workspace file and proper content
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("workspace"),
        JSON.stringify(fileContent)
      );
      expect(mockUriFile).toHaveBeenCalled();
    });
  });

  describe("isValidUri", () => {
    it("should return true for valid uri", () => {
      const uri = "https://example.com";
      const result = isValidUri(uri);
      expect(result).to.be.true;
    });

    it("should return false for invalid uri", () => {
      const uri = "invalid-uri";
      const result = isValidUri(uri);
      expect(result).to.be.false;
    });

    it("should return false for empty uri", () => {
      const uri = "";
      const result = isValidUri(uri);
      expect(result).to.be.false;
    });
  });

  describe("getValidFolderUri", () => {
    it("should return valid FolderUriConfig for valid input", () => {
      const folderUri = {
        uri: "https://example.com",
        name: "example",
      };
      const result = getValidFolderUri(folderUri);
      expect(result).to.deep.equal(folderUri);
    });

    it("should throw error for invalid uri", () => {
      const folderUri = {
        uri: "invalid-uri",
        name: "example",
      };
      expect(() => getValidFolderUri(folderUri)).to.throw(messages.bad_project_uri_config_error);
    });

    it("should throw error for missing uri", () => {
      const folderUri = {
        name: "example",
      };
      expect(() => getValidFolderUri(folderUri)).to.throw(messages.bad_project_uri_config_error);
    });

    it("should throw error for missing name", () => {
      const folderUri = {
        uri: "https://example.com",
      };
      expect(() => getValidFolderUri(folderUri)).to.throw(messages.bad_project_uri_config_error);
    });

    it("should throw error for non-string uri", () => {
      const folderUri = {
        uri: 123,
        name: "example",
      };
      expect(() => getValidFolderUri(folderUri)).to.throw(messages.bad_project_uri_config_error);
    });

    it("should throw error for non-string name", () => {
      const folderUri = {
        uri: "https://example.com",
        name: 123,
      };
      expect(() => getValidFolderUri(folderUri)).to.throw(messages.bad_project_uri_config_error);
    });

    describe("getFolderUri", () => {
      it("should return FolderUriConfig for valid JSON string with uri and name", () => {
        const optionalFolderUri = JSON.stringify({ uri: "https://example.com", name: "example" });
        const result = getFolderUri(optionalFolderUri);
        expect(result).to.deep.equal({ uri: "https://example.com", name: "example" });
      });

      it("should return undefined for valid JSON string without uri", () => {
        const optionalFolderUri = JSON.stringify({ name: "example" });
        const result = getFolderUri(optionalFolderUri);
        expect(result).to.be.undefined;
      });

      it("should return undefined for valid JSON string without name", () => {
        const optionalFolderUri = JSON.stringify({ uri: "https://example.com" });
        const result = getFolderUri(optionalFolderUri);
        expect(result).to.be.undefined;
      });

      it("should return undefined for invalid JSON string", () => {
        const optionalFolderUri = "{ uri: 'https://example.com', name: 'example' }";
        const result = getFolderUri(optionalFolderUri);
        expect(result).to.be.undefined;
      });

      it("should return undefined for non-JSON string", () => {
        const optionalFolderUri = "not a json string";
        const result = getFolderUri(optionalFolderUri);
        expect(result).to.be.undefined;
      });
    });
  });

  describe("isUriFlow", () => {
    it("should return true when  getFolderUri is not undefined", () => {
      const optionalFolderUri = JSON.stringify({ uri: "https://example.com", name: "example" });
      const result = isUriFlow(optionalFolderUri);
      expect(result).to.be.true;
    });

    it("should return false when getFolderUri is undefined", () => {
      const optionalFolderUri = "not a json string";
      const result = isUriFlow(optionalFolderUri);
      expect(result).to.be.false;
    });
  });
});
