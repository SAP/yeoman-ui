import * as WebSocket from 'ws';
import { RpcExtenstionWebSockets } from '@sap-devx/webview-rpc/out.ext/rpc-extension-ws';
import { IPrompt, YeomanUI } from '../yeomanui';
import { YouiLog } from "../youi-log";
import { ServerLog } from './server-log';

class YeomanUITest {
  private rpc: RpcExtenstionWebSockets | undefined;
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

      this.rpc = new RpcExtenstionWebSockets(ws);
      //TODO: Use RPC to send it to the browser log (as a collapsed pannel in Vue)
      const logger: YouiLog = new ServerLog(this.rpc);
      this.yeomanui = new YeomanUI(this.rpc, logger);
    });
  }
}

const yeomanuiTest = new YeomanUITest();
yeomanuiTest.init();
