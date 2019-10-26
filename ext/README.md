# Extension

## Project setup
```
npm install
```

## Running during development
Launch the WebSocket server configuration for development purposes. This will not launch vscode or a vscode extension, but still use the yeoman to run generators and communicate with a locally served Vue application.

## TODO
* send log output to vue application, specifically, the wiz-adapter logs and errors
* ensure callback of `Generator.run()` is called when user aborts during conflict resolution and when exceptions occur.
* error handling in general (e.g. promise rejects while performing rpc calls)
* support server/extension-side evaluation mid-prompt (e.g. `when()`, `choices` that are functions, etc). See [here](https://github.com/SBoudrias/Inquirer.js/blob/master/README.md#question) for more details on question properties that can be functions
  * Done: `when`, `choices` and `message`
  * Todo: `default`, `validate`, `filter` and `transformer` (also a choice with `new Separator()`)
* use `debounce` when watching changes to input fields
* support all inquirer question types
* support custom user interfaces for complex operations (e.g. choose odata source)
* provide yeoman generator best practice guide (also provide example)
* support back and start over
* support custom destination root
