import { WizLog } from "../wiz-log";
import { RpcCommon } from "../rpc/rpc-common";
const stripAnsi = require("strip-ansi");

export class ServerLog implements WizLog {
    private _rpc: RpcCommon;
    /**
     *
     */
    constructor(rpc : RpcCommon) {
        this._rpc = rpc;        
    }
    private isLogVisible: boolean = false;
    log(str: string): void {
        this._rpc.invoke("log", [stripAnsi(str)]);
    }
    writeln(str: string): void {
        this._rpc.invoke("log", [stripAnsi(str)]);
    }
    create(str: string): void {
        this._rpc.invoke("log", [stripAnsi(str)]);
    }
    force(str: string): void {
        this._rpc.invoke("log", [stripAnsi(str)]);
    }
    conflict(str: string): void {
        this._rpc.invoke("log", [stripAnsi(str)]);
    }
    identical(str: string): void {
        this._rpc.invoke("log", [stripAnsi(str)]);
    }
    skip(str: string): void {
        this._rpc.invoke("log", [stripAnsi(str)]);
    }
    showLog(): boolean {
        this.isLogVisible = !this.isLogVisible;
        return !this.isLogVisible;
    }
}