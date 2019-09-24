import * as Environment from "yeoman-environment";
import { WizAdapter } from "./wiz-adapter";
import { Messaging } from "./messaging";
import { YowizPanel } from "./extension";

export class Yowiz {
  private _env: Environment;

  constructor(yowizPanel: YowizPanel) {
    const wizAdapter = new WizAdapter();
    const messaging = new Messaging(yowizPanel);
    wizAdapter.setMessaging(messaging);
    this._env = Environment.createEnv(undefined, undefined, wizAdapter);
  }

  public async getGenerators(): Promise<string[]> {
    const promise: Promise<string[]> = new Promise((resolve, reject) => {
      this._env.lookup(() => {
        resolve(this._env.getGeneratorNames());
      });
    });
    return promise;
  }

  public run(generatorName: string) {
    // The #lookup() method will search the user computer for installed generators.
    // The search if done from the current working directory.
    const genNames = this._env.getGeneratorNames();
    console.log(genNames);
    this._env.lookup(() => {
      this._env.run(generatorName, {'skip-install': true}, err => {
        if (err) {
          console.error(err);
        }
        console.log('done running yowiz');
      });
    });
  }
}
