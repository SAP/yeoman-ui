const Module = require("module");

// Replaces shelljs.exec method when first parameter starts with "git config" command
// https://github.com/shelljs/shelljs/wiki/Electron-compatibility

export const apply = function () {
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function (...requireArgs: any[]) {
    if (requireArgs?.[0] === "shelljs") {
      const shellJsModule = originalRequire.apply(this, requireArgs);
      applyExecWorkarounds(shellJsModule);
      return shellJsModule;
    }

    return originalRequire.apply(this, requireArgs);
  };
};

function applyExecWorkarounds(shellJsModule: any) {
  if (shellJsModule.exec) {
    const originalExec = shellJsModule.exec;
    shellJsModule.exec = function (...execArgs: any[]) {
      const firstArg = execArgs?.[0];
      if (typeof firstArg === "string" && firstArg.trim().toLowerCase().startsWith("git config")) {
        return { stdout: "" };
      }
      return originalExec.apply(originalExec, execArgs);
    };
  }
  return shellJsModule;
}
