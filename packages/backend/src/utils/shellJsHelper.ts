const Module = require("module");

export const applyExecWorkaround = function () {
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function (request: string) {
    if (request.includes("shelljs")) {
      const shellJsModule = originalRequire.apply(this, arguments);
      if (shellJsModule.exec) {
        const originalExec = shellJsModule.exec;
        shellJsModule.exec = function () {
          if (arguments[0].startsWith("git config --get")) {
            return { stdout: "" };
          }
          return originalExec.apply(originalExec, arguments);
        };
      }
      return shellJsModule;
    }

    return originalRequire.apply(this, arguments);
  };
};
