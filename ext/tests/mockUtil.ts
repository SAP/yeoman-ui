import * as path from "path";

const Module = require("module");
const originalRequire = Module.prototype.require;

export function mockVscode(oVscodeMock: any, testModulePath?: string) {
    clearModuleCache(testModulePath);

    Module.prototype.require = function (request: any) {
        if (request === "vscode") {
            return oVscodeMock;
        }

        return originalRequire.apply(this, arguments);
    };
}

export function clearModuleCache(testModulePath?: string) {
    if (testModulePath) {
        const key = path.resolve(testModulePath);
        if (require.cache[key]) {
            delete require.cache[key];
        }
    }
}
