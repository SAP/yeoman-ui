import { YouiEvents } from "../youi-events";
import { RpcCommon } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { AppWizard } from "@sap-devx/yeoman-ui-types";

export class ServerYouiEvents implements YouiEvents {
  private readonly rpc: RpcCommon;

  constructor(rpc: RpcCommon) {
    this.rpc = rpc;
  }

  executeCommand(): Thenable<any> {
    return Promise.resolve();
  }

  getAppWizard(): AppWizard {
    return null;
  }

  selectFolder(): void {
    void this.rpc.invoke("selectOutputFolder");
  }

  doGeneratorDone(suceeded: boolean, message: string, selectedWorkspace: string, type: string, targetPath = ""): void {
    void this.rpc.invoke("generatorDone", [suceeded, message, selectedWorkspace, type, targetPath]);
  }

  public doGeneratorInstall(): void {
    void this.rpc.invoke("generatorInstall");
  }

  public showProgress(): void {
    void this.rpc.invoke("showProgress");
  }
}
