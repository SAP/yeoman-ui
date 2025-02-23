import { createSandbox, SinonSandbox, SinonMock, stub } from "sinon";
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
import { expect } from "chai";
import messages from "../../src/messages";

describe("extension unit test", () => {
  let sandbox: SinonSandbox;
  let fsMock: SinonMock;
  let uriMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    fsMock = sandbox.mock(fs);
    uriMock = sandbox.mock(vscode.Uri);
  });

  afterEach(() => {
    fsMock.verify();
    uriMock.verify();
  });

  describe("create workspace file", () => {
    it("createWs", () => {
      const wsFilePath = normalize(join(Constants.HOMEDIR_PROJECTS, "../tmp/workspace.code-workspace"));
      const folderConfig = { path: "relative/path/to/project" }; // Adjust to match expected format

      uriMock.expects("file").withArgs(wsFilePath);
      fsMock.expects("writeFileSync").withArgs(wsFilePath, JSON.stringify({ folders: [folderConfig], settings: {} }));

      WorkspaceFile.createWs(wsFilePath, folderConfig);
    });

    it("create createWsWithPath", () => {
      const targetFolderPath = normalize(join(Constants.HOMEDIR_PROJECTS, "../tmp/targetFolderPath"));
      const targetFolderUri = Uri.file(targetFolderPath);

      const wsFilePath = join(Constants.HOMEDIR_PROJECTS, "workspace.code-workspace"); // Expected workspace file path
      const folderConfig = { path: relative(dirname(wsFilePath), targetFolderPath) };

      // Mock existsSync to return false on the first call and true on subsequent calls
      const existsSyncStub = sandbox.stub(fs, "existsSync");
      existsSyncStub.onFirstCall().returns(false); // Simulate that the file doesn't exist initially
      existsSyncStub.onSecondCall().returns(true); // Simulate that the file exists on the second call (forces the unique file path)

      uriMock.expects("file").withArgs(wsFilePath);
      fsMock.expects("writeFileSync").withArgs(wsFilePath, JSON.stringify({ folders: [folderConfig], settings: {} }));

      WorkspaceFile.createWsWithPath(targetFolderUri);

    });

    it("workspace file exists with isUri true", () => {
      const targetFolderPath = normalize(join(Constants.HOMEDIR_PROJECTS, "../projects/tmp/targetFolderPath"));

      // Create FolderUriConfig
      const folderConfig: FolderUriConfig = {
        uri: targetFolderPath,
        name: "targetFolder", // Provide a name for the folder (optional, but required by the interface)
      };

      // Mock existsSync to simulate file existence
      const existsSyncStub = sandbox.stub(fs, "existsSync");
      existsSyncStub.onFirstCall().returns(true); // Simulate that workspace.code-workspace exists
      existsSyncStub.onSecondCall().returns(false); // Simulate that workspace.1.code-workspace does not exist

      const fileContent = {
        folders: [
          folderConfig, // Pass the FolderUriConfig object
        ],
        settings: {},
      };

      const expectedWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.1.code-workspace`); // The new workspace file path

      // Expect writeFileSync to be called with the new workspace file path and content
      fsMock.expects("writeFileSync").withArgs(expectedWsFilePath, JSON.stringify(fileContent));
      uriMock.expects("file").withArgs(expectedWsFilePath);

      WorkspaceFile.createWsWithUri(folderConfig); // Pass the FolderUriConfig here

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
