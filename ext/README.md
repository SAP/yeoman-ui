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
* support server/extension-side evaluation mid-prompt (e.g. `when()`, `choices` that are functions, etc)
