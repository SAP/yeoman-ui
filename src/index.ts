import * as yeoman from "yeoman-environment";
import { WizAdapter } from "./wiz-adapter";

const wizAdapter = new WizAdapter();
let env = yeoman.createEnv(undefined, undefined, wizAdapter);

const generatorName = process.argv[2];
if (generatorName === undefined) {
  console.error(`usage: must pass generator name is argument`);
  process.abort();
}

// The #lookup() method will search the user computer for installed generators.
// The search if done from the current working directory.
env.lookup(() => {
  env.run(generatorName, {'skip-install': true}, err => {
    if (err) {
      console.error(err);
    }
    console.log('done running yowiz');
  });
});
