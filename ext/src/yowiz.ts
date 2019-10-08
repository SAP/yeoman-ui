import * as Environment from "yeoman-environment";
import { WizAdapter } from "./wiz-adapter";
import { Messaging } from "./messaging";
import { YowizPanel } from "./extension";

export interface IGeneratorChoice {
  name: string;
  message: string;
  imageUrl?: string;
}

export interface IGeneratorQuestion {
  type: string;
  message: string;
  choices: IGeneratorChoice[];
}

export interface IPrompt {
  name: string;
  questions: any[];
}

export class Yowiz {
  private _env: Environment;

  constructor(yowizPanel: YowizPanel) {
    const wizAdapter = new WizAdapter();
    const messaging = new Messaging(yowizPanel);
    wizAdapter.setMessaging(messaging);
    this._env = Environment.createEnv(undefined, undefined, wizAdapter);
  }

  public getGenerators(): Promise<IPrompt | undefined> {
    // optimization: looking up generators takes a long time, so if generators are already loaded don't bother
    // on the other hand, we never look for newly installed generators...

    const promise: Promise<IPrompt | undefined> = new Promise((resolve, reject) => {
      this._env.lookup((err) => {
        const generatorNames: string[] = this._env.getGeneratorNames();
        if (generatorNames.length > 0) {
          const generatorChoices: IGeneratorChoice[] = generatorNames.map((value, index, array) => {
            const choice: IGeneratorChoice = {
              name: value,
              message: "Some quick example text of the generator description. This is a long text so that the example will look good.",
            };
            // if (index !== 0) {
            choice.imageUrl = "https://yeoman.io/static/illustration-home-inverted.91b07808be.png";
            // }
            return choice;
          });
          const generatorQuestion: IGeneratorQuestion = {
            type: "generators",
            message: "Choose a generator",
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
    this._env.run(generatorName, { 'skip-install': true }, err => {
      if (err) {
        console.error(err);
      }
      console.log('done running yowiz');
    });
  }
}
