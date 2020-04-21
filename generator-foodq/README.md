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
If you write your own generator and you want it to render well in the wizard, follow these guidelines:
* Group several questions into a single prompt – all questions in the same prompt will render as a single Yeoman UI step.
* You can guide the user by showing the prompts in advance. To do so, follow these guidelines:

**In main generator**

    1. add dependency to yeoman-ui-types in generator package.json: 

```javascript
  "dependencies": {
    ...
    "@sap-devx/yeoman-ui-types": "^0.0.1"
  }
```

    2. set callback method for yeoman-ui framework
    3. set list of all virtual prompts
    4. save the propmpts in a variable

    See example: https://github.com/SAP/yeoman-ui/blob/master/generator-foodq/generators/app/index.js



```javascript
module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.setPromptsCallback = fn => { // set callback method for yeoman-ui framework
      if (this.prompts) {
        this.prompts.setCallback(fn);
      }
    };

    var prompts = [ // set list of all virtual prompts
      {name: "First Prompt Name", description: "First Prompt Description"},
      {name: "Second Prompt Name", description: "Second Prompt Description"},
      {name: "Third Prompt Name", description: "Third Prompt Description"}
    ];
    this.prompts = new types.Prompts(prompts); // save the propmpts in a variable
  }
  ...
  ```


**In each sub-generator**

    1. get list of all parent prompts
    2. save initial quantity of parent promts
    3. create all dynamic prompts (name and description only)
    4. create list of all sub-generator prompts
    5. add sub-generator prompts to the parent generator prompts

```javascript
module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.prompts = opts.prompts; // get list of all parent prompts
    this.parentPromptsQuantity = this.prompts.size(); // save initial quantity of parent promts
    // create all dynamic prompts (name and description only)
    this.dynamicAddressPrompt = {name: "Dynamic Prompt Name", description: "Dynamic Prompt N Description"}; 

    const prompts = [
      {name: "First SubGen Prompt Name", description: "First SubGen Prompt Description"},
      this.dynamicAddressPrompt,
      {name: "Second SubGen Prompt Name", description: "Second SubGen Prompt Description"}];

    // add sub-generator prompts to the parent generator prompts
    this.prompts.splice(this.parentPromptsQuantity, 0, prompts);
  }
...
```


    6. in a question that located before a dynamic promp decide whether you need to remove a dynamic prompt or add it back to the list

    See example: https://github.com/SAP/yeoman-ui/blob/master/generator-foodq/generators/app2/index.js


* Update the target folder (your project root path) in the 'configuring()' method 

```javascript
configuring() {
    this.destinationRoot(path.join(this.destinationRoot(), _.get(this, "answers.food", "")));
}
```

* Place a `yeoman.png` file in the same location as your `package.json` file, and Yeoman UI will show it when it shows the user the list of all available generators. 
