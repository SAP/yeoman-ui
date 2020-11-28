import * as WebSocket from 'ws';
import { RpcExtensionWebSockets } from '@sap-devx/webview-rpc/out.ext/rpc-extension-ws';
import { IChildLogger } from "@vscode-logging/logger";
import { ExploreGens } from '../exploregens';

class ExploreGensWebSocketServer {
  private rpc: RpcExtensionWebSockets;
  private exploreGens: ExploreGens;
 
  init() {
    // web socket server
    const port = (process.env.PORT ? Number.parseInt(process.env.PORT) : 8082);
    
    const wss = new WebSocket.Server({ port: port}, () => {
      console.log('started websocket server');
    });
    wss.on('listening', () => {
      console.log(`exploregens: listening to websocket on port ${port}`);
    });

    wss.on('error', (error) => {
      console.error(`exploregens: ${error}`);
    });

    wss.on('connection', (ws) => {
      console.log('exploregens: new ws connection');

      this.rpc = new RpcExtensionWebSockets(ws);
      //TODO: Use RPC to send it to the browser log (as a collapsed pannel in Vue)
      const childLogger = { debug: () => {/* do nothing */}, error: () => {/* do nothing */}, fatal: () => {/* do nothing */}, warn: () => {/* do nothing */}, info: () => {/* do nothing */}, trace: () => {/* do nothing */}, getChildLogger: () => { return {} as IChildLogger; } };
      const context = {
        globalState: {
          get: () => true,
          update: () => true
        }
      };
      const vscode = {
        window: {
          showErrorMessage: () => true,
          showInformationMessage: () => true,
          setStatusBarMessage: () => {
            return {
              dispose: () => true
            };
          }
        },
        workspace: {
          getConfiguration: () => {
            return {
              get: () => ""
            };
          }
        },
        commands: {
          getCommands: async () => {
            [];
          }
        }
	  };
	  
      this.exploreGens = new ExploreGens(childLogger as IChildLogger, false, context, vscode);
      this.exploreGens.init(this.rpc);
    });
  }
}

const wsServer = new ExploreGensWebSocketServer();
wsServer.init();
