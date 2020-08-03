import { YouiEvents } from "../youi-events";
import { RpcCommon } from "@sap-devx/webview-rpc/out.ext/rpc-common";

export class ServerYouiEvents implements YouiEvents {
    private readonly rpc: RpcCommon;

    constructor(rpc: RpcCommon) {
        this.rpc = rpc;        
    }
    
    selectFolder(): void {
        this.rpc.invoke("selectOutputFolder");
    }

    doGeneratorDone(suceeded: boolean, message: string, targetPath = ""): void {
        this.rpc.invoke("generatorDone", [suceeded, message, targetPath]);
    }

    public doGeneratorInstall(): void {
        this.rpc.invoke("generatorInstall");
    }
}
