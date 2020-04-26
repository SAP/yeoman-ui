[![CircleCI](https://circleci.com/gh/SAP/yeoman-ui.svg?style=svg)](https://circleci.com/gh/SAP/yeoman-ui)
![GitHub license](https://img.shields.io/badge/license-Apache_2.0-blue.svg)

# Yeoman UI

![](screenshot.png)

## Description
Provide rich user experience for Yeoman generators using VSCode extension or the browser.
The repository contains three main packages:
* **Frontend** - The Yeoman UI as a standalone vue.js application.
* **Backend** - The backend part which communicate with Yeoman and the system. Runs as a VSCode extension or node.js application.
* **Yeoman example generator** - Example generator to show usages and test the platform.

## Requirements
* [node.js](https://www.npmjs.com/package/node) version 10 or higher.
* [VSCode](https://code.visualstudio.com/) 1.39.2 or higher or [Theia](https://www.theia-ide.org/) 0.12 or higher.

## Download and Installation
To test run the framework you only need to build & install the backend package, which will automatically build & run the UI.
### installation
* Clone this repository
* cd into the backend folder
    ```bash
    cd backend
    ```
* To install, compile and prepare the static resources run the following commands:
    ```bash
    npm run backend
    npm run frontend
    ```
### Usage & Development
#### Run the dev mode
Dev mode allows you to run the framework in the browser, using vue cli for fast development cycles, and easy debug tools.
To run it do the following:
* In the backend folder run webpack or webpack-dev, then run the server.
    ```bash
    npm run webpack-dev
    npm run ws:run
    ```
* In the frontend folder run serve
    ```bash
    npm run serve
    ```
* Open the broswer on localhost:8080 to access the framework.

#### Run the VSCode extension
* Start VSCode on your local machine, and click on open workspace. Select this repo folder.
* On the debug panel choose "Run Extension", and click on the "Run" button.

#### Advanced scenarios
To develop and contribute you can build & install each package seperatly. Instruction on each package in the dedicated readme.md file.
* [Build & install the client](frontend/README.md)
* [Build & install the backend](backend/README.md)
* [Build & install the yeoman example generator](generator-foodq/README.md)

## Known Issues
* inquirer.js plugins not supported.
* transformer function not supported.

## How to obtain support
To get more help, support and information please open a github [issue](https://github.com/SAP/yeoman-ui/issues).

## Contributing
Contributing information can be found in the [CONTRIBUTING.md](CONTRIBUTING.md) file.

## TODO
* implement ability for yeoman-ui to call methods in vscode extensions
    * support hook for executing commands after finish
    * support open readme.md file by default (with turn off setting)

* support extensible question type custom user interfaces for complex operations (e.g. choose odata source)
* support inquirer plugins (e.g. date/time)


## License
Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved. This file is licensed under the Apache Software License, v. 2 except as noted otherwise in the [LICENSE]() file.
