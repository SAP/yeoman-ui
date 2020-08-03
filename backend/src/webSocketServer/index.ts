import * as WebSocket from 'ws';
import { RpcExtensionWebSockets } from '@sap-devx/webview-rpc/out.ext/rpc-extension-ws';
import { YeomanUI } from '../yeomanui';
import { YouiLog } from "../youi-log";
import { ServerLog } from './server-log';
import { ServerYouiEvents } from './server-youi-events';
import backendMessages from "../messages";
import { IChildLogger } from "@vscode-logging/logger";
import { YouiEvents } from '../youi-events';
import { GeneratorFilter } from '../filter';

class YeomanUIWebSocketServer {
  private rpc: RpcExtensionWebSockets | undefined;
  private yeomanui: YeomanUI | undefined;
  private async mockFolderDialog() {
    return "mock path";
  }

  init() {
    // web socket server
    const port = (process.env.PORT ? Number.parseInt(process.env.PORT) : 8081);
    const wss = new WebSocket.Server({ port: port }, () => {
      console.log('started websocket server');
    });
    wss.on('listening', () => {
      console.log(`listening to websocket on port ${port}`);
    });

    wss.on('error', (error) => {
      console.error(error);
    });

    wss.on('connection', (ws) => {
      console.log('new ws connection');

      this.rpc = new RpcExtensionWebSockets(ws);
      //TODO: Use RPC to send it to the browser log (as a collapsed pannel in Vue)
      const logger: YouiLog = new ServerLog(this.rpc);
      const childLogger = {debug: () => {/* do nothing */}, error: () => {/* do nothing */}, fatal: () => {/* do nothing */}, warn: () => {/* do nothing */}, info: () => {/* do nothing */}, trace: () => {/* do nothing */}, getChildLogger: () => {return {} as IChildLogger;}};
      const youiEvents: YouiEvents = new ServerYouiEvents(this.rpc);
      this.yeomanui = new YeomanUI(this.rpc, youiEvents, logger, childLogger as IChildLogger, {genFilter: GeneratorFilter.create(), messages: backendMessages});
      this.yeomanui.registerCustomQuestionEventHandler("folder-browser", "getPath", this.mockFolderDialog.bind(this));
    });
  }
}

const wsServer = new YeomanUIWebSocketServer();
wsServer.init();
