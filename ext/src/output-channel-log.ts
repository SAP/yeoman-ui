import { WizLog } from "./wiz-log";
import { getOutputChannel } from "./extension";
const stripAnsi = require("strip-ansi");

export class OutputChannelLog implements WizLog {
    log(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }
    writeln(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }
    create(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }
    force(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }
    conflict(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }
    identical(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }
    skip(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }
    showLog():boolean {
        getOutputChannel().show();
        return true;
    }
}