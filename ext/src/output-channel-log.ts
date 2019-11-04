import { WizLog } from "./wiz-log";
import { getOutputChannel } from "./extension";

export class OutputChannelLog implements WizLog {
    log(value: string): void {
        getOutputChannel().appendLine(value);
    }
    writeln(value: string): void {
        getOutputChannel().appendLine(value);
    }
    create(value: string): void {
        getOutputChannel().appendLine(value);
    }
    force(value: string): void {
        getOutputChannel().appendLine(value);
    }
    conflict(value: string): void {
        getOutputChannel().appendLine(value);
    }
    identical(value: string): void {
        getOutputChannel().appendLine(value);
    }
    skip(value: string): void {
        getOutputChannel().appendLine(value);
    }
    showLog():boolean {
        getOutputChannel().show();
        return true;
    }


}