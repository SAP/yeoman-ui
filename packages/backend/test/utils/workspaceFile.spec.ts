import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import { WorkspaceFile } from "../../src/utils/workspaceFile";
import { Constants } from "../../src/utils/constants";
import { vscode } from "../mockUtil";
import * as fs from "fs";
import { dirname, join, normalize, relative } from "path";

describe("extension unit test", () => {
  let sandbox: SinonSandbox;
  let fsMock: SinonMock;
  let uriMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
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

  describe("createWorkspaceFile", () => {
    it("workspace file does not exist", () => {
      const targetFolderPath = normalize(join(Constants.HOMEDIR_PROJECTS, "../tmp/targetFolerPath"));
      const expectedWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.code-workspace`);
      uriMock.expects("file").withArgs(expectedWsFilePath);
      fsMock.expects("existsSync").withArgs(expectedWsFilePath).returns(false);
      const fileContent = {
        folders: [
          {
            path: `${relative(dirname(expectedWsFilePath), targetFolderPath)}`,
          },
        ],
        settings: {},
      };
      fsMock.expects("writeFileSync").withArgs(expectedWsFilePath, JSON.stringify(fileContent));

      WorkspaceFile.createWorkspaceFile(targetFolderPath, false);
    });

    it("workspace file exists", () => {
      const targetFolderPath = normalize(join(Constants.HOMEDIR_PROJECTS, "../projects/tmp/targetFolerPath"));
      const existingWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.code-workspace`);
      fsMock.expects("existsSync").withArgs(existingWsFilePath).returns(true);
      const fileContent = {
        folders: [
          {
            path: `${relative(dirname(existingWsFilePath), targetFolderPath)}`,
          },
        ],
        settings: {},
      };
      const expectedWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.1.code-workspace`);
      fsMock.expects("existsSync").withArgs(expectedWsFilePath).returns(false);
      fsMock.expects("writeFileSync").withArgs(expectedWsFilePath, JSON.stringify(fileContent));
      uriMock.expects("file").withArgs(expectedWsFilePath);

      WorkspaceFile.createWorkspaceFile(targetFolderPath, false);
    });

    it("workspace file does not exist with isUri true", () => {
      const targetFolderPath = normalize(join(Constants.HOMEDIR_PROJECTS, "../tmp/targetFolerPath"));
      const expectedWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.code-workspace`);
      uriMock.expects("file").withArgs(expectedWsFilePath);
      fsMock.expects("existsSync").withArgs(expectedWsFilePath).returns(false);
      const fileContent = {
        folders: [
          {
            uri: targetFolderPath,
          },
        ],
        settings: {},
      };
      fsMock.expects("writeFileSync").withArgs(expectedWsFilePath, JSON.stringify(fileContent));
  
      WorkspaceFile.createWorkspaceFile(targetFolderPath, true);
    });
  
    it("workspace file exists with isUri true", () => {
      const targetFolderPath = normalize(join(Constants.HOMEDIR_PROJECTS, "../projects/tmp/targetFolerPath"));
      const existingWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.code-workspace`);
      fsMock.expects("existsSync").withArgs(existingWsFilePath).returns(true);
      const fileContent = {
        folders: [
          {
            uri: targetFolderPath,
          },
        ],
        settings: {},
      };
      const expectedWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.1.code-workspace`);
      fsMock.expects("existsSync").withArgs(expectedWsFilePath).returns(false);
      fsMock.expects("writeFileSync").withArgs(expectedWsFilePath, JSON.stringify(fileContent));
      uriMock.expects("file").withArgs(expectedWsFilePath);
  
      WorkspaceFile.createWorkspaceFile(targetFolderPath, true);
    });

  });
});
