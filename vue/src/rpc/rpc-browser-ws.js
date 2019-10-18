// must specify ".js" for import in browser to locate rpc-common.js
// see: https://github.com/microsoft/TypeScript/issues/16577#issuecomment-343610106
import { RpcCommon } from './rpc-common.js';
export class RpcBrowserWebSockets extends RpcCommon {
    constructor(ws) {
        super();
        this.ws = ws;
        this.ws.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            switch (message.command) {
                case "rpc-response":
                    this.handleResponse(message);
                    break;
                case 'rpc-request':
                    this.handleRequest(message);
                    break;
            }
        });
    }
    sendRequest(id, method, params) {
        // TODO: consider cancelling the timer if the promise if fulfilled before timeout is reached
        setTimeout(() => {
            const promiseCallbacks = this.promiseCallbacks.get(id);
            if (promiseCallbacks) {
                promiseCallbacks.reject("Request timed out");
                this.promiseCallbacks.delete(id);
            }
        }, this.timeout);
        // TODO: find an alternative to appending vscode to the global scope (perhaps providing vscode as parameter to constructor)
        const requestBody = {
            command: 'rpc-request',
            id: id,
            method: method,
            params: params
        };
        this.ws.send(JSON.stringify(requestBody));
    }
    sendResponse(id, response, success = true) {
        const responseBody = {
            command: 'rpc-response',
            id: id,
            response: response,
            success: success
        };
        this.ws.send(JSON.stringify(responseBody));
    }
}
//# sourceMappingURL=rpc-browser-ws.js.map