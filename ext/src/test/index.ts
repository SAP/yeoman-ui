import * as WebSocket from 'ws';
import { RpcExtenstionWebSockets } from '../rpc/rpc-extension-ws';
import { IPrompt, Yowiz } from '../yowiz';
import { WizLog } from "../wiz-log";

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
      //TODO: Use RPC to send it to the browser log (as a collapsed pannel in Vue)
      let logger: WizLog = {
        log(str: string): void {
          console.log(`*** in log(): ${str}`);
        },
        writeln(str: string): void {
          console.log(`*** in writeln(): ${str}`);
        },
        create(str: string): void {
          console.log(`*** in create(): ${str}`);
        },
        force(str: string): void {
          console.log(`*** in force(): ${str}`);
        },
        conflict(str: string): void {
          console.log(`*** in conflict(): ${str}`);
        },
        identical(str: string): void {
          console.log(`*** in identical(): ${str}`);
        },
        skip(str: string): void {
          console.log(`*** in skip(): ${str}`);
        }
      };
      this.yowiz = new Yowiz(this.rpc, logger);
    });
  }
}

const yowizTest = new YowizTest();
yowizTest.init();
