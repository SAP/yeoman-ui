var Generator = require('yeoman-generator');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.getPrompts = function() {
      console.log('in getPrompts()');
      return [{name:"Prompt 1 app2"},{name: "Prompt 2 app2"}];
    }
  }

  async prompting() {
    let prompts = [
      {
        type: "confirm",
        name: "isTakeaway",
        message: "Do you want to take away?"
      },
      {
        when: (response)=>{
          return response.isTakeaway;
        },
        type: "input",
        name: "address",
        message: "Your Address"
      }
    ];

    this.answers = await this.prompt(prompts);

    let prompts2 = [
      {
        type: "number",
        name: "tip",
        message: "Do you want to give a tip?",
        default: "10"
      }
    ];

    this.answers = await this.prompt(prompts2);
  }
};
