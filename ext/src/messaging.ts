'use strict';
import { Adapter } from "yeoman-environment";
import * as inquirer from "inquirer";
import { RpcCommon } from "./rpc/rpc-common";
import { IPrompt, Yowiz } from "./yowiz";

/**
 * @constructor
 */
export class Messaging {
	private _rpc: RpcCommon | undefined;
  private _yowiz: Yowiz | undefined;

  public setRpc(rpc: RpcCommon) {
    this._rpc = rpc;
		this._rpc.setResponseTimeout(3600000);
		this._rpc.registerMethod({ func: this.receiveIsWebviewReady, thisArg: this });
		this._rpc.registerMethod({ func: this.runGenerator, thisArg: this });
  }

  public setYowiz(yowiz: Yowiz) {
    this._yowiz = yowiz;
  }

  public async receiveIsWebviewReady() {
		// TODO: loading generators takes a long time; consider prefetching list of generators
    if (this._yowiz && this._rpc) {
      const generators: IPrompt | undefined = await this._yowiz.getGenerators();

      const response: any = await this._rpc.invoke("receiveQuestions", [
        (generators ? generators.questions : []),
        (generators ? generators.name : "")
      ]);
      this.runGenerator(response.name);
    }
	}

	public runGenerator(generatorName: string): void {
    if (this._yowiz) {
      this._yowiz.run(generatorName);
    }
	}

  public async askQuestions(questions: Adapter.Questions<any>): Promise<inquirer.Answers> {
    if (this._rpc) {
      return this._rpc.invoke("receiveQuestions", [questions, "Step"]).then((response => {
        return Promise.resolve(response);
      }));
    } else {
      return Promise.resolve({});
    }
  }
}
