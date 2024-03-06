import * as WebSocket from "ws";
import { RpcExtensionWebSockets } from "@sap-devx/webview-rpc/out.ext/rpc-extension-ws.js";
import { YeomanUI } from "../yeomanui.js";
import { ServerOutput } from "./server-output.js";
import { ServerYouiEvents } from "./server-youi-events.js";
import backendMessages from "../messages.js";
import { IChildLogger } from "@vscode-logging/logger";
import { YouiEvents } from "../youi-events.js";
import { GeneratorFilter } from "../filter.js";
import { getConsoleWarnLogger } from "../logger/console-logger.js";
import { createFlowPromise } from "../utils/promise.js";

class YeomanUIWebSocketServer {
  private rpc: RpcExtensionWebSockets | undefined;
  private yeomanui: YeomanUI | undefined;
  private mockFolderDialog() {
    return "mock path";
  }

  init() {
    // web socket server
    const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 8081;
    const wss = new WebSocket.Server({ port: port }, () => {
      console.log("started websocket server");
    });
    wss.on("listening", () => {
      console.log(`listening to websocket on port ${port}`);
    });

    wss.on("error", (error) => {
      console.error(error);
    });

    wss.on("connection", (ws: WebSocket) => {
      console.log("new ws connection");
      const childLogger: IChildLogger = getConsoleWarnLogger();
      this.rpc = new RpcExtensionWebSockets(ws, childLogger);
      const serverOutput = new ServerOutput(this.rpc, true);
      const youiEvents: YouiEvents = new ServerYouiEvents(this.rpc);

      this.yeomanui = new YeomanUI(
        this.rpc,
        youiEvents,
        serverOutput,
        childLogger,
        { filter: GeneratorFilter.create(), messages: backendMessages },
        createFlowPromise<void>().state,
      );
      this.yeomanui.registerCustomQuestionEventHandler("folder-browser", "getPath", this.mockFolderDialog.bind(this));
    });
  }
}

const wsServer = new YeomanUIWebSocketServer();
wsServer.init();
