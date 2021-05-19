import { RpcCommon } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import stripAnsi = require("strip-ansi");
import { Output } from "../output";

export class ServerOutput implements Output {
  private isVisible: boolean;
  private readonly rpc: RpcCommon;

  constructor(rpc: RpcCommon, isOutputVisible: boolean) {
    this.rpc = rpc;
    this.isVisible = isOutputVisible;
  }

  public show() {
    this.isVisible = !this.isVisible;
  }

  public append(value: string) {
    return this.rpc.invoke("log", [stripAnsi(value) + "\n"]);
  }

  public appendLine(value: string) {
    return this.rpc.invoke("log", [stripAnsi(value) + "\n"]);
  }
}
