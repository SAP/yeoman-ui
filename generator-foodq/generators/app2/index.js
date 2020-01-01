var Generator = require('yeoman-generator');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.getPrompts = () => {
      this.log('in app2 getPrompts()');
      return [{name:"Take Away"},{name: "Tip"}];
    }
  }

  async prompting() {
    let prompts = [
      {
        when: false,
        name: "__promptName",
        message: "Take Away"
      },
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
        when: false,
        name: "__promptName",
        message: "Tip"
      },
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
