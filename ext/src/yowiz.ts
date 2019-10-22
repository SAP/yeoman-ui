import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as Environment from "yeoman-environment";
import { WizAdapter } from "./wiz-adapter";
import { Messaging } from "./messaging";
import { RpcCommon } from "./rpc/rpc-common";

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

  constructor(rpc: RpcCommon) {
    this._rpc = rpc;
    this._wizAdapter = new WizAdapter();
    const messaging = new Messaging();
    messaging.setRpc(this._rpc);
    messaging.setYowiz(this);
    this._wizAdapter.setMessaging(messaging);

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

  public run(generatorName: string) {

    // TODO: ensure generatorName is a valid dir name
    const cwd: string = path.join(os.homedir(), "projects", generatorName);

    // TODO: wait for dir to be created
    fs.mkdir(cwd, { recursive: true }, (err) => {
      if (err) {
        console.error(err);
      }
    });

    // TODO: should create and set target dir only after user has selected a generator;
    //  see issue: https://github.com/yeoman/environment/issues/55
    //  process.chdir() doesn't work after environment has been created

    const env: Environment = Environment.createEnv(undefined, { cwd: cwd }, this._wizAdapter);
    try {
      let meta: Environment.GeneratorMeta = this._genMeta[`${generatorName}:app`];
      // TODO: support sub-generators
      env.register(meta.resolved);
      const gen = env.create(`${generatorName}:app`, {});
      if ((gen as any)["getPrompts"] !== undefined) {
        const prompts: Object[] = (gen as any)["getPrompts"]();
      }

      env.run(generatorName, { 'skip-install': true }, err => {
        if (err) {
          console.error(err);
        }
        console.log('done running yowiz');
      });
    } catch (err) {
      console.error(err);
    }
  }
}
