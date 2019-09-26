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

  public getGenerators(): Promise<string[]> {
    // optimization: looking up generators takes a long time, so if generators are already loaded don't bother
    // on the other hand, we never look for newly installed generators...
    if (this._env.getGeneratorNames().length > 0) {
      return Promise.resolve(this._env.getGeneratorNames());
    }

    const promise: Promise<string[]> = new Promise((resolve) => {
      // setTimeout() is a hack to overcome the fact that yeoman-environment lookup() is synchronous
      setTimeout(() => {
        this._env.lookup(() => {
          resolve(this._env.getGeneratorNames());
        });
      }, 100);
    });
    return promise;
  }

  public run(generatorName: string) {
    this._env.run(generatorName, {'skip-install': true}, err => {
      if (err) {
        console.error(err);
      }
      console.log('done running yowiz');
    });
  }
}
