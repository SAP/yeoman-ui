import { ExtensionContext, commands } from "vscode";
import { YeomanUIPanel } from "./panels/YeomanUIPanel";

export class ExtCommands {
  private exploreGensPanel: any;
  private yeomanUIPanels: YeomanUIPanel[] = [];
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

  private yeomanUIPanel_toggleOutput_Command() {
    // need to toggle output for the current active panel
    return this.getActiveYeomanUIPanel()?.toggleOutput();
  }

  private yeomanUIPanel_notifyGeneratorsChange_Command(uiOptions?: any) {
    // notify all existing panels in the change
    this.yeomanUIPanels.forEach((panel) => {
      panel.notifyGeneratorsChange(uiOptions);
    });
  }

  private async exploreGenerators_Command(uiOptions?: any) {
    return (await this.getExploreGensPanel()).loadWebviewPanel(uiOptions);
  }

  private getActiveYeomanUIPanel(): YeomanUIPanel | undefined {
    return this.yeomanUIPanels.find(
      (panel) => panel["webViewPanel"] && panel["webViewPanel"].active && panel["webViewPanel"].visible
    );
  }

  public async getYeomanUIPanel(): Promise<YeomanUIPanel> {
    const { YeomanUIPanel } = await import("./panels/YeomanUIPanel");
    const panel = new YeomanUIPanel(this.context);
    const length = this.yeomanUIPanels.push(panel);
    panel.onDidWebviewPanelDispose(() => {
      this.yeomanUIPanels.slice(length - 1);
    });
    return panel;
  }

  public async getExploreGensPanel() {
    if (!this.exploreGensPanel) {
      const { ExploreGensPanel } = await import("./panels/ExploreGensPanel");
      this.exploreGensPanel = new ExploreGensPanel(this.context);
    }

    return this.exploreGensPanel;
  }
}
