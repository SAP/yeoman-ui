import { YouiLog } from "./youi-log";
import { getOutputChannel } from "./extension";
const stripAnsi = require("strip-ansi");

export class OutputChannelLog implements YouiLog {
    public log(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }

    public writeln(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }

    public create(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }

    public force(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }

    public conflict(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }

    public identical(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }
    
    public skip(value: string): void {
        getOutputChannel().appendLine(stripAnsi(value));
    }
    public showLog():boolean {
        getOutputChannel().show();
        return true;
    }
}
