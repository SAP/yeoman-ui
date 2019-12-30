// TODO: remove this class when those vscode commands are implemented in theia.
import * as vscode from "vscode";

export class Theia {
    private isInTheiaCached: boolean = undefined;
    private commandMappings: Map<string, string> = new Map();

    constructor() {
        this.initCommandMappings();
    }

    public initCommandMappings(): void {
        this.commandMappings.set("vscode.openFolder", "workspace:openWorkspace");
        this.commandMappings.set("workbench.action.closeActiveEditor", "core.close.tab");
    }

    public getCommandMappings(): Map<string, string> {
        return this.commandMappings;
    }

    /**
     * isInTheia - just one way of finding out whether running in Theia (can/should be changed)
     */
    public isInTheia(): Thenable<boolean> {
        if (this.isInTheiaCached !== undefined) {
            return Promise.resolve(this.isInTheiaCached);
        }

        return vscode.commands.getCommands(true).then((commands) => {
            return (commands.indexOf("change_theme") >= 0);
        });
    }

}