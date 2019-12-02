# Extension

## Project setup
```
npm install
```

## Running during development
Launch the WebSocket server configuration for development purposes. This will not launch vscode or a vscode extension, but still use Yeoman to run generators and communicate with a locally served Vue application.

Launch the *Run Dev Server* launch configuration.

Or use the command line:
```sh
# compile server code to out directory:
npm run compile
# run the websocket server: 
npm run ws:run
```

## Learning
* support all inquirer question types
* support validate for none input type
* disable next when not all answered or if some questions are invalid
