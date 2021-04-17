import { IChildLogger } from "@vscode-logging/logger";

export function getConsoleWarnLogger(): IChildLogger {
  const consoleLog = (msg: string, ...args: any[]): void => {
    console.log(msg, args);
  };
  const noopLog = () => "";
  const warningLogger = {
    fatal: consoleLog,
    error: consoleLog,
    warn: consoleLog,
    info: noopLog,
    debug: noopLog,
    trace: noopLog,
    getChildLogger: () => {
      return warningLogger;
    },
  };
  return warningLogger;
}
