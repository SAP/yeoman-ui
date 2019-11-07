export interface IRpc {
  invoke(method: string, params: any): Promise<any>;
  sendRequest(id: number, method: string, params?: any[]): void;
  sendResponse(id: number, response: any, success?: boolean): void;
  handleResponse(message: any): void;
  handleRequest(message: any): void;
}

export interface IPromiseCallbacks {
  resolve: Function;
  reject: Function;
}

export interface IMethod {
  func: Function;
  thisArg?: any;
  name?: string;
}

export abstract class RpcCommon implements IRpc {
  protected promiseCallbacks: Map<number, IPromiseCallbacks>; // promise resolve and reject callbacks that are called when returning fron the webview
  protected methods: Map<string, IMethod>;
  protected timeout: number = 15000; // timeout for response from remote in milliseconds

  constructor() {
    this.promiseCallbacks = new Map();
    this.methods = new Map();
    this.registerMethod({ func: this.listLocalMethods, thisArg: this });
  }

  public abstract sendRequest(id: number, method: string, params?: any[]): void;
  public abstract sendResponse(id: number, response: any, success?: boolean): void;
  

  public setResponseTimeout(timeout: number) {
    this.timeout = timeout;
  }

  public registerMethod(method: IMethod): void {
    this.methods.set((method.name ? method.name : method.func.name), method);
  }

  public unregisterMethod(method: IMethod): void {
    this.methods.delete((method.name ? method.name : method.func.name));
  }

  public listLocalMethods(): string[] {
    return Array.from(this.methods.keys());
  }

  public listRemoteMethods(): Promise<string[]> {
    return this.invoke("listLocalMethods");
  }

  public invoke(method: string, params?: any[]): Promise<any> {
    // TODO: change to something more unique (or check to see if id doesn't alreday exist in this.promiseCallbacks)
    const id = Math.random();
    const promise = new Promise((resolve, reject) => {
      this.promiseCallbacks.set(id, { "resolve": resolve, "reject": reject });
    });

    this.sendRequest(id, method, params);
    return promise;
  }

  public handleResponse(message: any): void {
    const promiseCallbacks: IPromiseCallbacks | undefined = this.promiseCallbacks.get(message.id);
    if (promiseCallbacks) {
      if (message.success) {
        promiseCallbacks.resolve(message.response);
      } else {
        promiseCallbacks.reject(message.response);
      }
      this.promiseCallbacks.delete(message.id);
    }
  }

  public async handleRequest(message: any): Promise<void> {
    const method: IMethod | undefined = this.methods.get(message.method);
    if (method) {
      const func: Function = method.func;
      const thisArg: any = method.thisArg;
      try {
        let response: any = func.call(thisArg, ...message.params);
        // if response is a promise, delay the response until the promise is fulfilled
        if (typeof response.then === 'function') {
          response = await response;
        }
        this.sendResponse(message.id, response);
      } catch (err) {
        this.sendResponse(message.id, err, false);
      }
    }
  }
}
