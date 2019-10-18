import * as WebSocket from 'ws';
import { RpcExtenstionWebSockets } from '../rpc/rpc-extension-ws';
import { IPrompt, Yowiz } from '../yowiz';

class YowizTest {
  private rpc: RpcExtenstionWebSockets | undefined;
  private yowiz: Yowiz | undefined;

  init() {
    // web socket server
    const wss = new WebSocket.Server({ port: 8081 }, () => {
      console.log('websocket server is listening on port 8081');
    });

    wss.on('connection', (ws) => {
      console.log('new ws connection');

      this.rpc = new RpcExtenstionWebSockets(ws);
      this.yowiz = new Yowiz(this.rpc);
    });
  }
}

const yowizTest = new YowizTest();
yowizTest.init();
