var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class RpcCommon {
    constructor() {
        this.timeout = 15000; // timeout for response from remote in milliseconds
        this.promiseCallbacks = new Map();
        this.methods = new Map();
        this.registerMethod({ func: this.listLocalMethods, thisArg: this });
    }
    setResponseTimeout(timeout) {
        this.timeout = timeout;
    }
    registerMethod(method) {
        this.methods.set((method.name ? method.name : method.func.name), method);
    }
    unregisterMethod(method) {
        this.methods.delete((method.name ? method.name : method.func.name));
    }
    listLocalMethods() {
        return Array.from(this.methods.keys());
    }
    listRemoteMethods() {
        return this.invoke("listLocalMethods");
    }
    invoke(method, params) {
        // TODO: change to something more unique (or check to see if id doesn't alreday exist in this.promiseCallbacks)
        const id = Math.random();
        const promise = new Promise((resolve, reject) => {
            this.promiseCallbacks.set(id, { resolve: resolve, reject: reject });
        });
        this.sendRequest(id, method, params);
        return promise;
    }
    handleResponse(message) {
        const promiseCallbacks = this.promiseCallbacks.get(message.id);
        if (promiseCallbacks) {
            if (message.success) {
                promiseCallbacks.resolve(message.response);
            }
            else {
                promiseCallbacks.reject(message.response);
            }
            this.promiseCallbacks.delete(message.id);
        }
    }
    handleRequest(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.methods.get(message.method);
            if (method) {
                const func = method.func;
                const thisArg = method.thisArg;
                try {
                    let response = func.call(thisArg, ...message.params);
                    // if response is a promise, delay the response until the promise is fulfilled
                    if (typeof response.then === 'function') {
                        response = yield response;
                    }
                    this.sendResponse(message.id, response);
                }
                catch (err) {
                    this.sendResponse(message.id, err, false);
                }
            }
        });
    }
}
//# sourceMappingURL=rpc-common.js.map