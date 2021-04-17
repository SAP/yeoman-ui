// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as mocha from "mocha";
import { getVscodeMock } from "../src/utils/vscodeProxy";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require("module");
const originalRequire = Module.prototype.require;

const mockVscode = () => {
  Module.prototype.require = function (request: any) {
    if (request === "vscode") {
      return getVscodeMock();
    }

    return originalRequire.apply(this, arguments);
  };
};

mockVscode();
export const vscode = getVscodeMock();
