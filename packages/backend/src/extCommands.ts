import { ExtensionContext, commands, window } from "vscode";
import messages from "./messages";

export class ExtCommands {
  private exploreGensPanel: any;
  private yeomanUIPanel: any;
  private context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  public registerAndSubscribeCommands() {
    this.registerAndSubscribeCommand("runGenerator", this.yeomanUIPanel_runGenerator_Command.bind(this));

    this.registerAndSubscribeCommand("loadYeomanUI", this.yeomanUIPanel_loadYeomanUI_Command.bind(this));

    this.registerAndSubscribeCommand("yeomanUI.toggleOutput", this.yeomanUIPanel_toggleOutput_Command.bind(this));

    this.registerAndSubscribeCommand(
      "yeomanUI._notifyGeneratorsChange",
      this.yeomanUIPanel_notifyGeneratorsChange_Command.bind(this),
    );

    this.registerAndSubscribeCommand("exploreGenerators", this.exploreGenerators_Command.bind(this));
  }

  private registerAndSubscribeCommand(cId: string, cAction: any) {
    this.context.subscriptions.push(commands.registerCommand(cId, cAction));
  }

  private async yeomanUIPanel_runGenerator_Command() {
    try {
      return (await this.getYeomanUIPanel()).runGenerator();
    } catch (e) {
      console.log(e);
    }
  }

  private async yeomanUIPanel_loadYeomanUI_Command(uiOptions?: any) {
    try {
      return (await this.getYeomanUIPanel(uiOptions?.showOpenGeneratorWarning ?? undefined)).loadWebviewPanel(
        uiOptions,
      );
    } catch (e) {
      console.log(e);
    }
  }

  private async yeomanUIPanel_toggleOutput_Command() {
    return (await this.getYeomanUIPanel(false)).toggleOutput();
  }

  private async yeomanUIPanel_notifyGeneratorsChange_Command(uiOptions?: any) {
    return (await this.getYeomanUIPanel(false)).notifyGeneratorsChange(uiOptions);
  }

  private async exploreGenerators_Command(uiOptions?: any) {
    try {
      return (await this.getExploreGensPanel()).loadWebviewPanel(uiOptions);
    } catch (e) {
      console.log(e);
    }
  }

  private async isInEmptyState(): Promise<boolean> {
    if (this.yeomanUIPanel?.yeomanui?.generatorName) {
      const btnContinue = "Continue";
      if (
        (await window.showWarningMessage(
          messages.warn_another_generator_running(this.yeomanUIPanel.yeomanui.generatorName.split(":")[0]),
          btnContinue,
          "Cancel",
        )) !== btnContinue
      ) {
        return false;
      }
    }
    return true;
  }

  public async getYeomanUIPanel(verifyEmptyState = true) {
    if (!this.yeomanUIPanel) {
      const { YeomanUIPanel } = await import("./panels/YeomanUIPanel");
      this.yeomanUIPanel = new YeomanUIPanel(this.context);
    }
    if (!verifyEmptyState || (await this.isInEmptyState())) {
      return this.yeomanUIPanel;
    } else {
      throw new Error("another generator is running");
    }
  }

  public async getExploreGensPanel() {
    if (!this.exploreGensPanel) {
      const { ExploreGensPanel } = await import("./panels/ExploreGensPanel");
      this.exploreGensPanel = new ExploreGensPanel(this.context);
    }

    return this.exploreGensPanel;
  }
}
