// import Module from "module";

// // Replaces shelljs.exec method when execResult is undefined
// // https://github.com/shelljs/shelljs/wiki/Electron-compatibility

// export const apply = function () {
//   const originalRequire = Module.prototype.require;
//   //@ts-ignore
//   Module.prototype.require = function (...requireArgs: any[]) {
//     if (requireArgs?.[0] === "shelljs") {
//       const shellJsModule = originalRequire.apply(this, requireArgs);
//       applyExecWorkaround(shellJsModule);
//       return shellJsModule;
//     }

//     return originalRequire.apply(this, requireArgs);
//   };
// };

// function applyExecWorkaround(shellJsModule: any) {
//   if (shellJsModule.exec) {
//     const originalExec = shellJsModule.exec;
//     shellJsModule.exec = function (...execArgs: any[]) {
//       // if execResult is defined then return it, otherwise return the workaround
//       return originalExec.apply(originalExec, execArgs) ?? { stdout: "" };
//     };
//   }
// }
