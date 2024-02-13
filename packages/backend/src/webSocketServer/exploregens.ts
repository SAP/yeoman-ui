import * as WebSocket from "ws";
import { RpcExtensionWebSockets } from "@sap-devx/webview-rpc/out.ext/rpc-extension-ws";
import { IChildLogger } from "@vscode-logging/logger";
import { ExploreGens } from "../exploregens";
import { getConsoleWarnLogger } from "../logger/console-logger";
import { vscode } from "../utils/vscodeProxy";

class ExploreGensWebSocketServer {
  private rpc: RpcExtensionWebSockets | null = null;
  private exploreGens: ExploreGens | null = null;

  init() {
    // web socket server
    const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 8082;

    const wss = new WebSocket.Server({ port: port }, () => {
      console.log("started websocket server");
    });
    wss.on("listening", () => {
      console.log(`exploregens: listening to websocket on port ${port}`);
    });

    wss.on("error", (error) => {
      console.error(`exploregens: ${error}`);
    });

    wss.on("connection", (ws) => {
      console.log("exploregens: new ws connection");
      const childLogger: IChildLogger = getConsoleWarnLogger();
      this.rpc = new RpcExtensionWebSockets(ws, childLogger);

      this.exploreGens = new ExploreGens(childLogger, vscode.context);
      this.exploreGens.init(this.rpc);
    });
  }
}

const wsServer = new ExploreGensWebSocketServer();
wsServer.init();
