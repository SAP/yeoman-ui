import { ExtensionContext, commands, window, WebviewPanel } from "vscode";

export class Commands {
  private yeomanUIPanel: any;
  private exploreGensPanel: any;

  constructor(private context: ExtensionContext) {}

  public registerAndSubscribeCommands() {
    this.registerAndSubscribeCommand("runGenerator", this.yeomanUIPanel_runGeneratorCommand.bind(this));

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

  private async yeomanUIPanel_runGeneratorCommand() {
    return (await this.getPanel()).runGenerator();
  }

  private async yeomanUIPanel_loadYeomanUI_Command(uiOptions: any) {
    return (await this.getPanel()).loadWebviewPanel(uiOptions);
  }

  private async yeomanUIPanel_toggleOutput_Command() {
    return (await this.getPanel()).toggleOutput();
  }

  private async yeomanUIPanel_notifyGeneratorsChange_Command(uiOptions: any) {
    return (await this.getPanel()).notifyGeneratorsChange(uiOptions);
  }

  private async exploreGenerators_Command(uiOptions: any) {
    return (await this.getPanel(false)).loadWebviewPanel(uiOptions);
  }

  // dynamic loading
  private async getPanel(isYeomanPanel = true): Promise<any> {
    if (isYeomanPanel) {
      if (!this.yeomanUIPanel) {
        const { YeomanUIPanel } = await import(`./panels/YeomanUIPanel`);
        this.yeomanUIPanel = new YeomanUIPanel(this.context);
        this.registerWebviewPanelSerializer(this.yeomanUIPanel);
      }

      return this.yeomanUIPanel;
    }

    if (!this.exploreGensPanel) {
      const { ExploreGensPanel } = await import(`./panels/ExploreGensPanel`);
      this.exploreGensPanel = new ExploreGensPanel(this.context);
      this.registerWebviewPanelSerializer(this.exploreGensPanel);
    }

    return this.exploreGensPanel;
  }

  private registerWebviewPanelSerializer(panel: any) {
    window.registerWebviewPanelSerializer(panel.viewType, {
      async deserializeWebviewPanel(webViewPanel: WebviewPanel, state?: unknown) {
        await Promise.resolve(panel.setWebviewPanel(webViewPanel, state));
      },
    });
  }
}
