import { ExtensionContext, commands, window, WebviewPanel } from "vscode";

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
      this.yeomanUIPanel_notifyGeneratorsChange_Command.bind(this)
    );

    this.registerAndSubscribeCommand("exploreGenerators", this.exploreGenerators_Command.bind(this));
  }

  private registerAndSubscribeCommand(cId: string, cAction: any) {
    this.context.subscriptions.push(commands.registerCommand(cId, cAction));
  }

  private async yeomanUIPanel_runGenerator_Command() {
    return (await this.getYeomanUIPanel()).runGenerator();
  }

  private async yeomanUIPanel_loadYeomanUI_Command(uiOptions?: any) {
    return (await this.getYeomanUIPanel()).loadWebviewPanel(uiOptions);
  }

  private async yeomanUIPanel_toggleOutput_Command() {
    return (await this.getYeomanUIPanel()).toggleOutput();
  }

  private async yeomanUIPanel_notifyGeneratorsChange_Command(uiOptions?: any) {
    return (await this.getYeomanUIPanel()).notifyGeneratorsChange(uiOptions);
  }

  private async exploreGenerators_Command(uiOptions?: any) {
    return (await this.getExploreGensPanel()).loadWebviewPanel(uiOptions);
  }

  public async getYeomanUIPanel() {
    if (!this.yeomanUIPanel) {
      const { YeomanUIPanel } = await import("./panels/YeomanUIPanel");
      this.yeomanUIPanel = new YeomanUIPanel(this.context);
    }

    return this.yeomanUIPanel;
  }

  public async getExploreGensPanel() {
    if (!this.exploreGensPanel) {
      const { ExploreGensPanel } = await import("./panels/ExploreGensPanel");
      this.exploreGensPanel = new ExploreGensPanel(this.context);
    }

    return this.exploreGensPanel;
  }
}
