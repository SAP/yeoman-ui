import { WizLog } from "../wiz-log";
import { RpcCommon } from "../rpc/rpc-common";

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
        this._rpc.invoke("log", [str]);
    }
    writeln(str: string): void {
        this._rpc.invoke("log", [str]);
    }
    create(str: string): void {
        this._rpc.invoke("log", [str]);
    }
    force(str: string): void {
        this._rpc.invoke("log", [str]);
    }
    conflict(str: string): void {
        this._rpc.invoke("log", [str]);
    }
    identical(str: string): void {
        this._rpc.invoke("log", [str]);
    }
    skip(str: string): void {
        this._rpc.invoke("log", [str]);
    }
    showLog(): boolean {
        this.isLogVisible = !this.isLogVisible;
        return !this.isLogVisible;
    }
}