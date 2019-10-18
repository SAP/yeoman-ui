import { RpcCommon, IPromiseCallbacks } from './rpc-common';
import * as WebSocket from 'ws';

export class RpcExtenstionWebSockets extends RpcCommon {
  ws: WebSocket;

  constructor(ws: WebSocket) {
    super();
    this.ws = ws;
    this.ws.on('message', message => {
      // assuming message is a stringified JSON
      const messageObject: any = JSON.parse(message as string);
      switch (messageObject.command) {
        case "rpc-response":
          this.handleResponse(messageObject);
          break;
        case 'rpc-request':
          this.handleRequest(messageObject);
          break;
      }
    });
  }

  sendRequest(id: number, method: string, params: any[]) {
    // consider cancelling the timer if the promise if fulfilled before timeout is reached
    setTimeout(() => {
      const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(id);
      if (promiseCallbacks) {
        promiseCallbacks.reject("Request timed out");
        this.promiseCallbacks.delete(id);
      }
    }, this.timeout);

    const requestObject: any = {
      command: 'rpc-request',
      id: id,
      method: method,
      params: params
    };

    this.ws.send(JSON.stringify(requestObject));
  }

  sendResponse(id: number, response: any, success: boolean = true): void {
    const responseObject: any = {
      command: 'rpc-response',
      id: id,
      response: response,
      success: success
    };

    this.ws.send(JSON.stringify(responseObject));
  }
}