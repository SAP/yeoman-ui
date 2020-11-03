[![CircleCI](https://circleci.com/gh/SAP/yeoman-ui.svg?style=svg)](https://circleci.com/gh/SAP/yeoman-ui)
[![Coverage Status](https://coveralls.io/repos/github/SAP/yeoman-ui/badge.svg?branch=master)](https://coveralls.io/github/SAP/yeoman-ui?branch=master)
![GitHub license](https://img.shields.io/badge/license-Apache_2.0-blue.svg)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP/yeoman-ui)](https://api.reuse.software/info/github.com/SAP/yeoman-ui)
[![dependentbot](https://api.dependabot.com/badges/status?host=github&repo=SAP/yeoman-ui)](https://dependabot.com/)

# Application Wizard

![](screenshot.png)

## Description
With the Application Wizard extension, you can benefit from a rich user experience for yeoman generators. This extension allows developers to reuse existing yeoman generators and provide wizard-like experience with no development efforts.
The repository contains three main packages:
* **Frontend** - The Application Wizard as a standalone vue.js application.
* **Backend** - The backend part which communicates with Yeoman and the system. Runs as a VSCode extension or node.js application.
* **Yeoman example generator** - Example generator to show usages and test the platform.

## Requirements
* [node.js](https://www.npmjs.com/package/node) version 10 or higher.
* [VSCode](https://code.visualstudio.com/) 1.39.2 or higher or [Theia](https://www.theia-ide.org/) 0.12 or higher.

## Download and Installation
To test run the framework you only need to build and install the backend package, which will automatically build and run the UI.
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
To develop and contribute you can build and install each package separately. Instruction on each package in the dedicated readme.md file.
* [Build & install the client](frontend/README.md)
* [Build & install the backend](backend/README.md)
* [Build & install the yeoman example generator](generator-foodq/README.md)

## How to obtain support
To get more help, support, and information please open a github [issue](https://github.com/SAP/yeoman-ui/issues).

## Contributing
Contributing information can be found in the [CONTRIBUTING.md](CONTRIBUTING.md) file.
