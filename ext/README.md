# Extension

## Project setup
```
npm install
```

## Running during development
Launch the WebSocket server configuration for development purposes. This will not launch vscode or a vscode extension, but still use the yeoman to run generators and communicate with a locally served Vue application.

## TODO
* disable next when not all answered or if some questions are invalid
* layout
    * move next button to flush with bottom of page
    * navbar (replace?)
* cleanup code
    * remove redundant css
* send log output to vue application
    * specifically, the wiz-adapter logs and errors
    * support show console (show the running npm i after yeoman)
    * support console (collapsed) for output
* error handling
    * promise rejects while performing rpc calls
    * ensure callback of `Generator.run()` is called when user aborts during conflict resolution and when exceptions occur.
* provide better handling of timoutes in rpc 
* upload rpc to npm
* support server/extension-side evaluation mid-prompt (e.g. `when()`, `choices` that are functions, etc). See [here](https://github.com/SBoudrias/Inquirer.js/blob/master/README.md#question) for more details on question properties that can be functions
  * Done: `when`, `choices` and `message`
  * Todo: `default`, `validate` (paritaliy done), `filter` and `transformer` (also a choice with `new Separator()`)
* suport for `validate()`
    * support `validate()` for none input type
    * do not show indication when input is valid
* when `when()` returns false, hide instead of disable
* use `debounce` when watching changes to input fields
* support all inquirer question types
  * questions types required by devx in Q4
  * support custom question rendering: generator set the ui renderer, example: tiles instead of dropdown, radio buttons instead of dropdown, etc.
  * support extensible question type custom user interfaces for complex operations (e.g. choose odata source)
  * support inquirer plugins (e.g. date/time)
* support async functions in generator
* provide yeoman generator best practice guide (also provide example)
* provide reference yeoman generator
* support back
* support start over
* enable configuring destination root
* implement ability for yowiz to call methods in vscode extensions
    * support hook for executing commands after finish
    * show ouput in conolse (see separate backlog item)
    * support open workspace in destination
    * support open readme.md file by default (with turn off setting)
* automation
    * CI
    * linter
    * tests
    * build
* make it run in theia
    * ensure styles match vscode themes
* support 3 default themes (vscode-black, vscode-white, non-vscode)
* check gaps when running fiori generator
* align with mockup

## Learning
* support all inquirer question types
* support validate for none input type
* disable next when not all answered or if some questions are invalid
