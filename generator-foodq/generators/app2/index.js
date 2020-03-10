var Generator = require('yeoman-generator');
var _ = require('lodash');
var types = require('../../../types');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.prompts = opts.prompts;
    this.parentQuantity = this.prompts.size();

    this.dynamicAddressPrompt = new types.Prompt({name: "Address", description: "Address Description"});

    const prompts = [
      new types.Prompt({name: "Take Away", description: "Take Away Description"}),
      this.dynamicAddressPrompt,
      new types.Prompt({name: "Tip", description: "Tip Description"})];

    this.prompts.splice(this.parentQuantity, 0, prompts);
  }

  async prompting() {
    // isTakeaway question appears twice in CLI: https://github.com/yeoman/generator/issues/1100
    let prompts = [
      {
        type: "confirm",
        name: "isTakeaway",
        message: "Do you want to take away?"
      },
      {
        type: "list",
        name: "deliveryMethod",
        message: "Delivery method",
        choices: [
          "Car",
          "Drone"
        ],
        when: answers => {
          const indexOfAddress = _.findIndex(this.prompts.items, prompt => {
            return prompt.name === this.dynamicAddressPrompt.name;
          });

          if (answers.isTakeaway) {
            // add address prompt if doesn't exist
            if (indexOfAddress === -1) {
              this.prompts.splice(this.parentQuantity + 1, 0, this.dynamicAddressPrompt);
            }
          } else {
            // remove address prompt if exists
            if (indexOfAddress > -1) {
              this.prompts.splice(indexOfAddress, 1);
            }
          }

          return true;
        }
      }
    ];

    this.answers = await this.prompt(prompts);

    if (this.answers.isTakeaway) {
      let addressQuestions = [
        {
          type: "input",
          name: "address",
          message: "Your Address"
        }
      ];
      this.answers = await this.prompt(addressQuestions);
    }

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
