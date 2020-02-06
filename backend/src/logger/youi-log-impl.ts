import { YouiLog } from "./youi-log";
const stripAnsi = require("strip-ansi");
import { IChildLogger } from "@vscode-logging/logger";

export class YouiLogImpl implements YouiLog {
    constructor(private logger: IChildLogger) {}

    public error(value: string): void {
        this.logger.error(value);
    }

    public log(value: string): void {
        this.logger.debug(value);
    }

    public writeln(value: string): void {
        this.logger.debug(stripAnsi(value));
    }

    public create(value: string): void {
        this.logger.debug(stripAnsi(value));
    }

    public force(value: string): void {
        this.logger.debug(stripAnsi(value));
    }

    public conflict(value: string): void {
        this.logger.debug(stripAnsi(value));
    }

    public identical(value: string): void {
        this.logger.debug(stripAnsi(value));
    }
    
    public skip(value: string): void {
        this.logger.debug(stripAnsi(value));
    }
}