// eslint-disable-next-line eslint-comments/disable-enable-pair -- need for the next rule
/* eslint-disable @typescript-eslint/no-explicit-any -- test scope */
import * as path from "path";
import type { Disposable } from "vscode";

const window = {
  registerWebviewViewProvider: jest.fn(
    (viewType, provider) => <Disposable>{ dispose: (): any => ({ viewType, provider }) },
  ),
  showInformationMessage: jest.fn((): null => null),
  showErrorMessage: jest.fn((): null => null),
  showWarningMessage: jest.fn((): null => null),
  withProgress: jest.fn(),
};

const ViewColumn = {
  One: 1,
  Two: 2,
};

const commands = {
  registerCommand: jest.fn(
    (command, callback) => <Disposable>{ dispose: (): any => ({ command, result: callback() }) },
  ),
  executeCommand: jest.fn(),
  getCommands: jest.fn(),
};

const Extension = {
  id: "",
  extensionPath: path.join(__dirname, "..", "..", ".."),
  isActive: true,
  packageJSON: {
    sapLicenseUrl: "https://tools.hana.ondemand.com/eula.json",
  },
  exports: {},
  activate: jest.fn(),
};

const extensions = {
  getExtension: jest.fn(() => Extension),
};

const Uri = {
  // tslint:disable-next-line: no-shadowed-variable
  file: jest.fn((path: string) => {
    return { fsPath: path };
  }),
  joinPath: jest.fn((root: { fsPath: string }, ...parts: string[]) => {
    return { fsPath: path.join(root.fsPath, ...parts) };
  }),
  parse: jest.fn((path: string) => {
    return { fsPath: path };
  }),
  
};

const workspace = {
  fs: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    copy: jest.fn(),
    delete: jest.fn(),
    stat: jest.fn(),
    createDirectory: jest.fn(),
    readDirectory: jest.fn(),
    workspaceFolders:[Uri.file('')],
  },
  getConfiguration: jest.fn(),
  textDocuments: [] as any[],
  workspaceFolders: [] as any[],
  workspaceFile: {},
};

const globalStateObj = { get: jest.fn(), update: jest.fn() } as any;
const context = { globalState: globalStateObj, extensionPath: "" };

export { window, commands, workspace, Extension, extensions, Uri, ViewColumn, context };
