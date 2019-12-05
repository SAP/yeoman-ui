# Sample Yeoman Generator for yeoman-ui
[yeoman-ui](https://github.com/SAP/yeoman-ui) is a graphical user interface for running Yeoman generators. It runs as a [Visual Studio Code extension](https://code.visualstudio.com/api), or as a standalone web application for *development* purposes.

This repo contains a sample Yeoman generator that includes different Yeoman capabilities, including different Inquirer [prompt types](https://github.com/SBoudrias/Inquirer.js/blob/master/README.md#prompt-types), [question properties](https://github.com/SBoudrias/Inquirer.js/blob/master/README.md#question).

Specifically, it includes dynamic questions (`message`, `when()`, `validate()`, etc.).

## Running Locally
In the terminal type:
```sh
# install yeoman
npm install -g yo
# install dependencies of this generator
npm install
# make this generator available locally
npm link
# run this generator
yo foodq
```

## Debugging in VS Code
Run the *Foodq* launch configuration.

## Best practices
If you write your own generator and you want it to render well in Yeoman UI, follow these guidelines:
* Group several questions into a single prompt – all questions in the same prompt will render in a single Yeoman UI step.
* You can guide the user by showing the prompts in advance. To do so add a method to your generator in its constructor:

```js
this.getPrompts = function() {
    return [{name:"Prompt 1"},{name: "Prompt 2"},{name: "Registration"}];
}
```

* Place a `yeoman.png` file in the same location as your `package.json` file, and Yeoman UI will show it when it shows the user the list of all available generators. 