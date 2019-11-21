var Generator = require('yeoman-generator');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }

  async prompting() {
    let prompts = [
      {
        type: "input",
        name: "name",
        message: "Your name",
        default: "Me"
      }
    ];

    this.answers = await this.prompt(prompts);
  }
};
