import { WizLog } from "./wiz-log";
import { getOutputChannel } from "./extension";

export class OutputChannelLog implements WizLog {
    public log(value: string): void {
        getOutputChannel().appendLine(value);
    }

    public writeln(value: string): void {
        getOutputChannel().appendLine(value);
    }

    public create(value: string): void {
        getOutputChannel().appendLine(value);
    }

    public force(value: string): void {
        getOutputChannel().appendLine(value);
    }

    public conflict(value: string): void {
        getOutputChannel().appendLine(value);
    }

    public identical(value: string): void {
        getOutputChannel().appendLine(value);
    }
    
    public skip(value: string): void {
        getOutputChannel().appendLine(value);
    }
}
