import { ExtensionContext, commands, window, WebviewPanel } from "vscode";

class Commands {
  private exploreGensPanel: any;
  private yeomanUIPanel: any;
  private context: ExtensionContext;

  public registerAndSubscribeCommands(context: ExtensionContext) {
    this.context = context;

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

  private async getYeomanUIPanel() {
    if (!this.yeomanUIPanel) {
      const { YeomanUIPanel } = await import("./panels/YeomanUIPanel");
      this.yeomanUIPanel = new YeomanUIPanel(this.context);
      this.registerWebviewPanelSerializer(this.yeomanUIPanel);
    }

    return this.yeomanUIPanel;
  }

  private async getExploreGensPanel() {
    if (!this.exploreGensPanel) {
      const { ExploreGensPanel } = await import("./panels/ExploreGensPanel");
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

export const ExtCommands = new Commands();
