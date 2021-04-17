import { set } from "lodash";
import { join } from "path";

export const getVscode = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("vscode");
  } catch (error) {
    return undefined;
  }
};

const filename: string = require.main.filename;
const _isInTest = filename.includes(join("node_modules", "mocha"));

const notImplementedError = new Error("tested method is not implemented");
const returnValue = () => {
  if (_isInTest) {
    throw notImplementedError;
  }
  return "";
};

const returnPromise = () => {
  if (_isInTest) {
    throw notImplementedError;
  }
  return Promise.resolve();
};

const configObj = { get: returnValue, update: returnValue };
const globalStateObj = { get: returnValue, update: returnValue };
const context = { globalState: globalStateObj };

const Uri = {
  file: (path?: string) => {
    return { fsPath: path };
  },
};

const workspace = {
  getConfiguration: () => configObj,
  updateWorkspaceFolders: returnValue,
};

const oRegisteredCommands = {};
const commands = {
  registerCommand: (id: string, cmd: any) => {
    set(oRegisteredCommands, id, cmd);
    return Promise.resolve(oRegisteredCommands);
  },
  executeCommand: returnPromise,
  getCommands: () => oRegisteredCommands,
};

const window = {
  setStatusBarMessage: () => {
    return {
      dispose: returnValue,
    };
  },
  showErrorMessage: returnPromise,
  showInformationMessage: returnPromise,
  showWarningMessage: returnPromise,
  withProgress: returnPromise,
  registerWebviewPanelSerializer: returnPromise,
};

const vscodeMock = {
  Uri,
  context,
  workspace,
  commands,
  window,
};

export const getVscodeMock = () => vscodeMock;

export const vscode = getVscode() ?? getVscodeMock();
