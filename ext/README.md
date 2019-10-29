# Extension

## Project setup
```
npm install
```

## Running during development
Launch the WebSocket server configuration for development purposes. This will not launch vscode or a vscode extension, but still use the yeoman to run generators and communicate with a locally served Vue application.

## TODO
* disable next when not all answered or if some questions are invalid
* cleanup code
* send log output to vue application, specifically, the wiz-adapter logs and errors
* support show console (show the running npm i after yeoman)
* support console (collapsed) for output
* ensure callback of `Generator.run()` is called when user aborts during conflict resolution and when exceptions occur.
* error handling in general (e.g. promise rejects while performing rpc calls)
* support server/extension-side evaluation mid-prompt (e.g. `when()`, `choices` that are functions, etc). See [here](https://github.com/SBoudrias/Inquirer.js/blob/master/README.md#question) for more details on question properties that can be functions
  * Done: `when`, `choices` and `message`
  * Todo: `default`, `validate` (paritaliy done), `filter` and `transformer` (also a choice with `new Separator()`)
  * When support: what to do when "when" returns false. disabled? invisible? selected by generator?
* use `debounce` when watching changes to input fields
* support validate for none input type
* support all inquirer question types
* support custom question rendering: generator set the ui renderer, example: tiles instead of dropdown, radio buttons instead of dropdown, etc.
* support extensible question type custom user interfaces for complex operations (e.g. choose odata source)
* support async functions in generator
* provide yeoman generator best practice guide (also provide example)
* support back and start over
* support custom destination root
* support open workspace in destination
* support open readme.md file by default (with turn off setting)
* implement ability for yowiz to call methods in vscode extensions
* support hook for executing commands after finish

* CI
* testing

## Learning
* support all inquirer question types
* support validate for none input type
* disable next when not all answered or if some questions are invalid
