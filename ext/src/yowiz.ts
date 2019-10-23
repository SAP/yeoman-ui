import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as Environment from "yeoman-environment";
import * as inquirer from "inquirer";
import { WizAdapter } from "./wiz-adapter";
import { RpcCommon } from "./rpc/rpc-common";
import Generator = require("yeoman-generator");

export interface IGeneratorChoice {
  name: string;
  message: string;
  imageUrl?: string;
}

export interface IGeneratorQuestion {
  type: string;
  name: string;
  message: string;
  choices: IGeneratorChoice[];
}

export interface IPrompt {
  name: string;
  questions: any[];
}

export class Yowiz {
  private _rpc: RpcCommon;
  private _genMeta: { [namespace: string]: Environment.GeneratorMeta };
  private _wizAdapter: WizAdapter;
  private _gen: Generator | undefined;
  private _promptCount: number;

  constructor(rpc: RpcCommon) {
    this._rpc = rpc;
		this._rpc.setResponseTimeout(3600000);
		this._rpc.registerMethod({ func: this.receiveIsWebviewReady, thisArg: this });
		this._rpc.registerMethod({ func: this.runGenerator, thisArg: this });
    this._wizAdapter = new WizAdapter();
    this._wizAdapter.setYowiz(this);
    this._promptCount = 0;
    this._genMeta = {};
  }

  public getGenerators(): Promise<IPrompt | undefined> {
    // optimization: looking up generators takes a long time, so if generators are already loaded don't bother
    // on the other hand, we never look for newly installed generators...

    const promise: Promise<IPrompt | undefined> = new Promise((resolve, reject) => {
      const env = Environment.createEnv();
      env.lookup((err) => {
        const generatorNames: string[] = env.getGeneratorNames();
        this._genMeta = env.getGeneratorsMeta();
        if (generatorNames.length > 0) {
          const generatorChoices: IGeneratorChoice[] = generatorNames.map((value, index, array) => {
            const choice: IGeneratorChoice = {
              name: value,
              message: "Some quick example text of the generator description. This is a long text so that the example will look good.",
            };
            choice.imageUrl = "https://yeoman.io/static/illustration-home-inverted.91b07808be.png";
            return choice;
          });
          const generatorQuestion: IGeneratorQuestion = {
            type: "generators",
            name: "name",
            message: "name",
            choices: generatorChoices
          };
          resolve({ name: "Choose Generator", questions: [generatorQuestion] });
        } else {
          return resolve(undefined);
        }
      });
    });
    return promise;
  }

  public runGenerator(generatorName: string) {

    // TODO: ensure generatorName is a valid dir name
    const destinationRoot: string = path.join(os.homedir(), "projects", generatorName);

    // TODO: wait for dir to be created
    fs.mkdir(destinationRoot, { recursive: true }, (err) => {
      if (err) {
        console.error(err);
      }
    });

    // TODO: should create and set target dir only after user has selected a generator;
    //  see issue: https://github.com/yeoman/environment/issues/55
    //  process.chdir() doesn't work after environment has been created

    const env: Environment = Environment.createEnv(undefined, {}, this._wizAdapter);
    try {
      let meta: Environment.GeneratorMeta = this._genMeta[`${generatorName}:app`];
      // TODO: support sub-generators
      env.register(meta.resolved);
      const gen: any = env.create(`${generatorName}:app`, {});
      if ((gen as any)["getPrompts"] !== undefined) {
        const promptNames: Object[] = (gen as any)["getPrompts"]();
        const prompts: IPrompt[] = promptNames.map((value)=> {
          let prompt: IPrompt = Object.assign({questions:[], name:""}, value);
          return prompt;
        });
        this.sendPrompts(prompts);
      }

      this._promptCount = 0;
      this._gen = <Generator>gen;
      this._gen.destinationRoot(destinationRoot);
      this._gen.run((err) => {
        let message: string;
        if (err) {
          console.error(err);
          message = `${generatorName} failed: ${err}.`;
          this._rpc.invoke("generatorDone", [true, message]);
        }
        console.log('done running yowiz');
        message = `${generatorName} is done. Destination directory is ${destinationRoot}`;
        this._rpc.invoke("generatorDone", [true, message]);
      });
    } catch (err) {
      console.error(err);
    }
  }

  public async receiveIsWebviewReady() {
		// TODO: loading generators takes a long time; consider prefetching list of generators
    if (this._rpc) {
      const generators: IPrompt | undefined = await this.getGenerators();

      const response: any = await this._rpc.invoke("showPrompt", [
        (generators ? generators.questions : []),
        (generators ? generators.name : "")
      ]);
      this.runGenerator(response.name);
    }
	}

  public async showPrompt(questions: Environment.Adapter.Questions<any>): Promise<inquirer.Answers> {
    if (this._rpc) {
      this._promptCount++;
      let promptName: string = `Step ${this._promptCount}`;
      if (Array.isArray(questions) && questions.length === 1) {
        promptName = questions[0].name.replace(/(.)/,(match: string, p1: string)=>{return p1.toUpperCase()});
      }
      return this._rpc.invoke("showPrompt", [questions, promptName]).then((response => {
        return Promise.resolve(response);
      }));
    } else {
      return Promise.resolve({});
    }
  }

  private sendPrompts(prompts: IPrompt[]): Promise<void> {
    if (this._rpc) {
      return this._rpc.invoke("setPrompts", [prompts]);
    } else {
      return Promise.resolve();
    }
  }
}
