import * as vscode from "vscode";
import { join, sep } from "path";
import { readFileSync } from "fs";
import { IChildLogger } from "@vscode-logging/logger";
import { getClassLogger } from "../logger/logger-wrapper.js";
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension.js";
import { createFlowPromise, FlowPromise } from "../utils/promise.js";
import * as cheerio from "cheerio";

export abstract class AbstractWebviewPanel {
  public viewType!: string;
  protected extensionPath: string;
  protected mediaPath: string;
  protected viewTitle!: string;
  protected webViewPanel: vscode.WebviewPanel | null = null;
  protected focusedKey!: string;
  protected htmlFileName: string;
  protected state: unknown;
  protected context: Partial<vscode.ExtensionContext>;

  protected readonly logger: IChildLogger;
  protected disposables: vscode.Disposable[];
  protected rpc: RpcExtension | null = null;
  protected flowPromise: FlowPromise<void> | null = null;
  protected viewColumn: vscode.ViewColumn;

  public loadWebviewPanel(uiOptions?: any, disposables: vscode.Disposable[] = []): Promise<void> {
    this.disposeWebviewPanel();
    if (uiOptions?.viewColumn in vscode.ViewColumn) {
      this.viewColumn = uiOptions.viewColumn;
    }
    this.disposables = disposables;
    const webViewPanel = this.createWebviewPanel();
    this.setWebviewPanel(webViewPanel, uiOptions);
    if (this.flowPromise) {
      return this.flowPromise.promise;
    } else {
      return Promise.reject(new Error("flowPromise not initialized"));
    }
  }

  protected constructor(context: Partial<vscode.ExtensionContext>) {
    this.extensionPath = context.extensionPath ?? "";
    this.mediaPath = join(context.extensionPath ?? "", "dist", "media");
    this.htmlFileName = "index.html";
    this.logger = getClassLogger("AbstractWebviewPanel");
    this.disposables = [];
    this.context = context;
    this.viewColumn = vscode.ViewColumn.One;
  }

  public setWebviewPanel(webviewPanel: vscode.WebviewPanel, state?: unknown) {
    this.flowPromise = createFlowPromise<void>();
    this.webViewPanel = webviewPanel;
    this.state = state;
  }

  public createWebviewPanel(): vscode.WebviewPanel {
    return vscode.window.createWebviewPanel(this.viewType, this.viewTitle, this.viewColumn, {
      // Enable javascript in the webview
      enableScripts: true,
      retainContextWhenHidden: true,
      // And restrict the webview to only loading content from our extension's `media` directory.
      localResourceRoots: [vscode.Uri.file(this.mediaPath)],
    });
  }

  protected disposeWebviewPanel() {
    this.rpc = null;
    const displayedPanel = this.webViewPanel;
    if (displayedPanel) {
      this.dispose();
      this.webViewPanel = null;
    }
  }

  protected initWebviewPanel() {
    // Set the webview's initial html content
    this.initHtmlContent();
    if (!this.webViewPanel) {
      return;
    }

    // Set the context (current panel is focused)
    this.setFocused(this.webViewPanel.active);

    this.webViewPanel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Update the content based on view changes
    this.webViewPanel.onDidChangeViewState(
      () => {
        if (this.webViewPanel) {
          this.setFocused(this.webViewPanel.active);
        }
      },
      null,
      this.disposables,
    );
  }

  protected setFocused(focusedValue: boolean) {
    void vscode.commands.executeCommand("setContext", this.focusedKey, focusedValue);
  }

  private cleanFlowPromise() {
    if (this.flowPromise) {
      // resolves promise in case panel is closed manually by an user
      // it is safe to call resolve several times on same promise
      this.flowPromise.state.resolve();
    }
    this.flowPromise = null;
  }

  protected dispose() {
    this.setFocused(false);

    // Clean up our resources
    if (this.webViewPanel) {
      this.webViewPanel.dispose();
      this.webViewPanel = null;
    }
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }

    this.cleanFlowPromise();
  }

  protected initHtmlContent(): void {
    let indexHtml = readFileSync(join(this.mediaPath, this.htmlFileName), "utf8");
    if (indexHtml) {
      // Local path to main script run in the webview
      const scriptPathOnDisk = vscode.Uri.file(join(this.mediaPath, sep));
      const scriptUri = this.webViewPanel?.webview.asWebviewUri(scriptPathOnDisk) ?? "";
      const baseUrl = scriptUri.toString();
      const $ = cheerio.load(indexHtml);

      function replaceAttributePaths(elements: any, attributeName: string) {
        elements.each((index: number, element: cheerio.Element) => {
          const currentAttr = $(element).attr(attributeName);
          if (currentAttr) {
            $(element).attr(attributeName, `${baseUrl}/${currentAttr}`);
          }
        });
      }

      replaceAttributePaths($("[src]"), "src");
      replaceAttributePaths($("[href]"), "href");
      indexHtml = $.html();
    }
    if (this.webViewPanel) {
      this.webViewPanel.webview.html = indexHtml;
    }
  }
}
