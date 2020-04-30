import { YouiLog } from "./youi-log";
import { getOutputChannel } from "./extension";
const stripAnsi = require("strip-ansi");

export class OutputChannelLog implements YouiLog {
    public constructor(private channelName: string) {}

    public log(value: string): void {
        this.appendLine(value);
    }

    public writeln(value: string): void {
        this.appendLine(value);
    }

    public create(value: string): void {
        this.appendLine(value);
    }

    public force(value: string): void {
        this.appendLine(value);
    }

    public conflict(value: string): void {
        this.appendLine(value);
    }

    public identical(value: string): void {
        this.appendLine(value);
    }
    
    public skip(value: string): void {
        this.appendLine(value);
    }
    public showOutput():boolean {
        getOutputChannel(this.channelName).show();
        return true;
    }

    private appendLine(value: string) {
        getOutputChannel(this.channelName).appendLine(stripAnsi(value));
    }
}
