import { WorkspaceFile } from "../../src/utils/workspaceFile";
import { Constants } from "../../src/utils/constants";
import { Uri } from "../resources/mocks/mockVSCode";
import * as fs from "fs";
import { dirname, join, normalize, relative } from "path";

// Mock the entire `fs` module
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe("extension unit test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createWorkspaceFile", () => {
    it("workspace file does not exist", () => {
      const targetFolderPath = normalize(join(Constants.HOMEDIR_PROJECTS, "../tmp/targetFolerPath"));
      const expectedWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.code-workspace`);

      // Mock fs.existsSync() to return false
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Mock Uri.file()
      const uriFileSpy = jest.spyOn(Uri, "file");

      // Mock fs.writeFileSync()
      const writeFileSpy = jest.spyOn(fs, "writeFileSync");

      const fileContent = {
        folders: [{ path: `${relative(dirname(expectedWsFilePath), targetFolderPath)}` }],
        settings: {},
      };

      WorkspaceFile.create(targetFolderPath);

      expect(uriFileSpy).toHaveBeenCalledWith(expectedWsFilePath);
      expect(writeFileSpy).toHaveBeenCalledWith(expectedWsFilePath, JSON.stringify(fileContent));
    });

    it("workspace file exists", () => {
      const targetFolderPath = normalize(join(Constants.HOMEDIR_PROJECTS, "../projects/tmp/targetFolerPath"));
      const existingWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.code-workspace`);
      const expectedWsFilePath = join(Constants.HOMEDIR_PROJECTS, `workspace.1.code-workspace`);

      // Mock fs.existsSync() responses for different file paths
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        return path === existingWsFilePath;
      });

      const writeFileSpy = jest.spyOn(fs, "writeFileSync");
      const uriFileSpy = jest.spyOn(Uri, "file");

      const fileContent = {
        folders: [{ path: `${relative(dirname(existingWsFilePath), targetFolderPath)}` }],
        settings: {},
      };

      WorkspaceFile.create(targetFolderPath);

      expect(writeFileSpy).toHaveBeenCalledWith(expectedWsFilePath, JSON.stringify(fileContent));
      expect(uriFileSpy).toHaveBeenCalledWith(expectedWsFilePath);
    });
  });
});
