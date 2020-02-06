import * as WebSocket from 'ws';
import { RpcExtensionWebSockets } from '@sap-devx/webview-rpc/out.ext/rpc-extension-ws';
import { YeomanUI } from '../yeomanui';
import { YouiLog } from "../logger/youi-log";
import { ServerLog } from './server-log';
import backendMessages from "../messages";

class YeomanUIWebSocketServer {
  private rpc: RpcExtensionWebSockets | undefined;
  private yeomanui: YeomanUI | undefined;

  init() {
    // web socket server
    const wss = new WebSocket.Server({ port: 8081 }, () => {
      console.log('websocket server is listening on port 8081');
    });
    wss.on('listening', () => {
      console.log('listening to websocket on port 8081');
    });

    wss.on('error', (error) => {
      console.error(error);
    });

    wss.on('connection', (ws) => {
      console.log('new ws connection');

      this.rpc = new RpcExtensionWebSockets(ws);
      const logger: YouiLog = new ServerLog(this.rpc);
      this.yeomanui = new YeomanUI(this.rpc, logger);
      this.yeomanui.setMessages(backendMessages);
    });
  }
}

const wsServer = new YeomanUIWebSocketServer();
wsServer.init();
