import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import { expect } from "chai";
import { vscode } from "../mockUtil";
import {
  getWorkspaceFolders,
  getFileSchemeWorkspaceFolders,
  getFirstWorkspacePath,
} from "../../src/utils/workspaceFolders";
import { Uri, WorkspaceFolder } from "vscode";

describe("workspaceFolders utility tests", () => {
  let sandbox: SinonSandbox;
  let workspaceMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    workspaceMock = sandbox.mock(vscode.workspace);
  });

  afterEach(() => {
    workspaceMock.verify();
  });

  describe("getWorkspaceFolders", () => {
    it("returns empty array when workspaceFolders is undefined", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value(undefined);
      const result = getWorkspaceFolders();
      expect(result).to.be.an("array").that.is.empty;
    });

    it("returns empty array when workspaceFolders is empty", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
      const result = getWorkspaceFolders();
      expect(result).to.be.an("array").that.is.empty;
    });

    it("returns all paths when all folders have file scheme", () => {
      const mockFolders: WorkspaceFolder[] = [
        {
          uri: Uri.file("/path/to/workspace1"),
          name: "workspace1",
          index: 0,
        },
        {
          uri: Uri.file("/path/to/workspace2"),
          name: "workspace2",
          index: 1,
        },
      ];
      sandbox.stub(vscode.workspace, "workspaceFolders").value(mockFolders);

      const result = getWorkspaceFolders();
      expect(result).to.deep.equal(["/path/to/workspace1", "/path/to/workspace2"]);
    });

    it("filters out non-file scheme folders (vscode-remote)", () => {
      const mockFolders: WorkspaceFolder[] = [
        {
          uri: Uri.file("/local/path"),
          name: "local",
          index: 0,
        },
        {
          uri: Uri.parse("vscode-remote://ssh-remote/remote/path"),
          name: "remote",
          index: 1,
        },
      ];
      sandbox.stub(vscode.workspace, "workspaceFolders").value(mockFolders);

      const result = getWorkspaceFolders();
      expect(result).to.deep.equal(["/local/path"]);
    });

    it("filters out multiple virtual schemes (ssh, wsl, vscode-vfs)", () => {
      const mockFolders: WorkspaceFolder[] = [
        {
          uri: Uri.file("/local/path1"),
          name: "local1",
          index: 0,
        },
        {
          uri: Uri.parse("ssh://remote/path"),
          name: "ssh",
          index: 1,
        },
        {
          uri: Uri.file("/local/path2"),
          name: "local2",
          index: 2,
        },
        {
          uri: Uri.parse("wsl://ubuntu/home/user"),
          name: "wsl",
          index: 3,
        },
        {
          uri: Uri.parse("vscode-vfs://github/repo"),
          name: "vfs",
          index: 4,
        },
      ];
      sandbox.stub(vscode.workspace, "workspaceFolders").value(mockFolders);

      const result = getWorkspaceFolders();
      expect(result).to.deep.equal(["/local/path1", "/local/path2"]);
    });

    it("returns empty array when only virtual workspaces exist", () => {
      const mockFolders: WorkspaceFolder[] = [
        {
          uri: Uri.parse("vscode-remote://ssh-remote/remote/path"),
          name: "remote1",
          index: 0,
        },
        {
          uri: Uri.parse("ssh://host/path"),
          name: "remote2",
          index: 1,
        },
      ];
      sandbox.stub(vscode.workspace, "workspaceFolders").value(mockFolders);

      const result = getWorkspaceFolders();
      expect(result).to.be.an("array").that.is.empty;
    });
  });

  describe("getFileSchemeWorkspaceFolders", () => {
    it("returns empty array when workspaceFolders is undefined", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value(undefined);
      const result = getFileSchemeWorkspaceFolders();
      expect(result).to.be.an("array").that.is.empty;
    });

    it("returns WorkspaceFolder objects for file scheme folders", () => {
      const mockFolders: WorkspaceFolder[] = [
        {
          uri: Uri.file("/path/to/workspace1"),
          name: "workspace1",
          index: 0,
        },
        {
          uri: Uri.parse("vscode-remote://ssh-remote/remote/path"),
          name: "remote",
          index: 1,
        },
        {
          uri: Uri.file("/path/to/workspace2"),
          name: "workspace2",
          index: 2,
        },
      ];
      sandbox.stub(vscode.workspace, "workspaceFolders").value(mockFolders);

      const result = getFileSchemeWorkspaceFolders();
      expect(result).to.have.lengthOf(2);
      expect(result[0].name).to.equal("workspace1");
      expect(result[0].uri.scheme).to.equal("file");
      expect(result[1].name).to.equal("workspace2");
      expect(result[1].uri.scheme).to.equal("file");
    });

    it("returns empty array when only virtual workspaces exist", () => {
      const mockFolders: WorkspaceFolder[] = [
        {
          uri: Uri.parse("vscode-remote://ssh-remote/remote/path"),
          name: "remote",
          index: 0,
        },
      ];
      sandbox.stub(vscode.workspace, "workspaceFolders").value(mockFolders);

      const result = getFileSchemeWorkspaceFolders();
      expect(result).to.be.an("array").that.is.empty;
    });
  });

  describe("getFirstWorkspacePath", () => {
    it("returns first file-scheme path when available", () => {
      const mockFolders: WorkspaceFolder[] = [
        {
          uri: Uri.file("/first/path"),
          name: "first",
          index: 0,
        },
        {
          uri: Uri.file("/second/path"),
          name: "second",
          index: 1,
        },
      ];
      sandbox.stub(vscode.workspace, "workspaceFolders").value(mockFolders);

      const result = getFirstWorkspacePath("/fallback/path");
      expect(result).to.equal("/first/path");
    });

    it("returns fallback when no workspaces exist", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value(undefined);

      const result = getFirstWorkspacePath("/fallback/path");
      expect(result).to.equal("/fallback/path");
    });

    it("returns fallback when workspaceFolders is empty", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value([]);

      const result = getFirstWorkspacePath("/fallback/path");
      expect(result).to.equal("/fallback/path");
    });

    it("returns fallback when only virtual workspaces exist", () => {
      const mockFolders: WorkspaceFolder[] = [
        {
          uri: Uri.parse("vscode-remote://ssh-remote/remote/path"),
          name: "remote",
          index: 0,
        },
        {
          uri: Uri.parse("ssh://host/path"),
          name: "ssh",
          index: 1,
        },
      ];
      sandbox.stub(vscode.workspace, "workspaceFolders").value(mockFolders);

      const result = getFirstWorkspacePath("/fallback/path");
      expect(result).to.equal("/fallback/path");
    });

    it("skips virtual workspaces and returns first file-scheme path", () => {
      const mockFolders: WorkspaceFolder[] = [
        {
          uri: Uri.parse("vscode-remote://ssh-remote/remote/path"),
          name: "remote",
          index: 0,
        },
        {
          uri: Uri.file("/local/path"),
          name: "local",
          index: 1,
        },
      ];
      sandbox.stub(vscode.workspace, "workspaceFolders").value(mockFolders);

      const result = getFirstWorkspacePath("/fallback/path");
      expect(result).to.equal("/local/path");
    });

    it("works with empty string fallback", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value(undefined);

      const result = getFirstWorkspacePath("");
      expect(result).to.equal("");
    });
  });
});
