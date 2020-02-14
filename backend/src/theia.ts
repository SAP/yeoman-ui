// TODO: remove this class when those vscode commands are implemented in theia.
import * as vscode from "vscode"; // NOSONAR

export class Theia {
    private isInTheiaCached: boolean;
    private commandMappings: Map<string, string>;

    constructor() {
        this.isInTheiaCached = undefined;
        this.commandMappings = new Map();
        this.initCommandMappings();
    }

    private initCommandMappings(): void {
        this.commandMappings.set("vscode.openFolder", "workspace:openWorkspace");
        this.commandMappings.set("workbench.action.closeActiveEditor", "core.close.tab");
    }

    public getCommandMappings(): Map<string, string> {
        return this.commandMappings;
    }

    /**
     * isInTheia - just one way of finding out whether running in Theia (can/should be changed)
     */
    public async isInTheia(): Promise<boolean> {
        if (this.isInTheiaCached !== undefined) {
            return Promise.resolve(this.isInTheiaCached);
        }

        return vscode.commands.getCommands(true).then((commands) => {
            return this.isInTheiaCached = (commands.indexOf("change_theme") >= 0);
        });
    }

}