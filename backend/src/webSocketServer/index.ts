import * as WebSocket from 'ws';
import { RpcExtenstionWebSockets } from '@sap-devx/webview-rpc/out.ext/rpc-extension-ws';
import { Yowiz } from '../yowiz';
import { WizLog } from "../wiz-log";
import { ServerLog } from './server-log';

class YowizWebSocketServer {
  private rpc: RpcExtenstionWebSockets | undefined;
  private yowiz: Yowiz | undefined;

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

      this.rpc = new RpcExtenstionWebSockets(ws);
      //TODO: Use RPC to send it to the browser log (as a collapsed pannel in Vue)
      const logger: WizLog = new ServerLog(this.rpc);
      this.yowiz = new Yowiz(this.rpc, logger);
    });
  }
}

const yowizTest = new YowizWebSocketServer();
yowizTest.init();
