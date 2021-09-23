import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import { WorkspaceFile } from "../../src/utils/workspaceFile";
import { Constants } from "../../src/utils/constants";
import { vscode } from "../mockUtil";
import * as fs from "fs";
import { join } from "path";

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
    it("is in BAS, workspace file does not exist", () => {
      Constants.IS_IN_BAS = true;
      const targetFolerPath = "targetFolerPath";
      const expectedWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.theia-workspace`);
      uriMock.expects("file").withArgs(expectedWsFilePath);
      fsMock.expects("existsSync").withArgs(expectedWsFilePath).returns(false);
      fsMock.expects("writeFileSync").withArgs(expectedWsFilePath);

      WorkspaceFile.create(targetFolerPath);
    });

    it("is in BAS, workspace file exists", () => {
      Constants.IS_IN_BAS = true;
      const targetFolerPath = "targetFolerPath";

      const existingWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.theia-workspace`);
      fsMock.expects("existsSync").withArgs(existingWsFilePath).returns(true);

      const expectedWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.1.theia-workspace`);
      fsMock.expects("existsSync").withArgs(expectedWsFilePath).returns(false);
      fsMock.expects("writeFileSync").withArgs(expectedWsFilePath);
      uriMock.expects("file").withArgs(expectedWsFilePath);

      WorkspaceFile.create(targetFolerPath);
    });

    it("is not in BAS, workspace file does not exist", () => {
      Constants.IS_IN_BAS = false;
      const targetFolerPath = "targetFolerPath";
      const expectedWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.code-workspace`);
      uriMock.expects("file").withArgs(expectedWsFilePath);
      fsMock.expects("existsSync").withArgs(expectedWsFilePath).returns(false);
      fsMock.expects("writeFileSync").withArgs(expectedWsFilePath);

      WorkspaceFile.create(targetFolerPath);
    });

    it("is not in BAS, workspace file exists", () => {
      Constants.IS_IN_BAS = false;
      const targetFolerPath = "targetFolerPath";

      const existingWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.code-workspace`);
      fsMock.expects("existsSync").withArgs(existingWsFilePath).returns(true);

      const expectedWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.1.code-workspace`);
      fsMock.expects("existsSync").withArgs(expectedWsFilePath).returns(false);
      fsMock.expects("writeFileSync").withArgs(expectedWsFilePath);
      uriMock.expects("file").withArgs(expectedWsFilePath);

      WorkspaceFile.create(targetFolerPath);
    });
  });
});
