import * as WebSocket from 'ws';
import { RpcExtensionWebSockets } from '@sap-devx/webview-rpc/out.ext/rpc-extension-ws';
import { YeomanUI } from '../yeomanui';
import { ServerOutput } from './server-output';
import { ServerYouiEvents } from './server-youi-events';
import backendMessages from "../messages";
import { IChildLogger } from "@vscode-logging/logger";
import { YouiEvents } from '../youi-events';
import { GeneratorFilter } from '../filter';
import * as envUtils from "../env/utils";
import { getConsoleWarnLogger } from '../logger/logger-wrapper';

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

      this.rpc = new RpcExtensionWebSockets(ws, getConsoleWarnLogger());
      //TODO: Use RPC to send it to the browser log (as a collapsed pannel in Vue)
      const serverOutput = new ServerOutput(this.rpc, true);
      const childLogger = { debug: () => {/* do nothing */ }, error: () => {/* do nothing */ }, fatal: () => {/* do nothing */ }, warn: () => {/* do nothing */ }, info: () => {/* do nothing */ }, trace: () => {/* do nothing */ }, getChildLogger: () => { return {} as IChildLogger; } };
      const youiEvents: YouiEvents = new ServerYouiEvents(this.rpc);
      const gensMetaPromise = envUtils.getGeneratorsMeta();
      this.yeomanui = new YeomanUI(this.rpc, youiEvents, serverOutput, childLogger as IChildLogger,
        { filter: GeneratorFilter.create(), messages: backendMessages, gensMetaPromise }, undefined);
      this.yeomanui.registerCustomQuestionEventHandler("folder-browser", "getPath", this.mockFolderDialog.bind(this));
    });
  }
}

const wsServer = new YeomanUIWebSocketServer();
wsServer.init();
