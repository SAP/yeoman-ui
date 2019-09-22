# yowiz

## Getting started
* Run `npm install`.
* From within a test directory, run `npm run launch <generator-name>`.
* Alternativly, modify the `args` and `cwd` in `.vscode/launch.json` with relevant values, and debug from within vscode.

## Notes
* Some generators save previous answers and show them as default answers using [yo storage](https://yeoman.io/authoring/storage.html)
* Some generators expect required initial input (`arguments`): [yo docs](https://yeoman.io/authoring/user-interactions.html)
* Some generators expect command line flags (`options`)
* Some generators use `composeWith()` to reuse other generators: [yo docs](https://yeoman.io/authoring/composability.html)
* Questions are likely asked in the `prompting` or `default` priority groups (but perhaps in other priority groups) [yo docs](https://yeoman.io/authoring/running-context.html)
* Use `yeoman-environment` to programmatically retrieve installed generators, register and run generators (see https://yeoman.github.io/environment/)
