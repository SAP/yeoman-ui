var Generator = require('yeoman-generator');
var _ = require('lodash');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.prompts = opts.prompts;
    this.parentQuantity = this.prompts.size();

    this.dynamicAddressPrompt = {name: "Address", description: "Address Description"};

    const prompts = [
      {name: "Delivery", description: "Delivery Description"},
      this.dynamicAddressPrompt,
      {name: "Tip", description: "Tip Description"}];

    this.prompts.splice(this.parentQuantity, 0, prompts);
  }

  async prompting() {
    // isDelivery question appears twice in CLI: https://github.com/yeoman/generator/issues/1100
    let prompts = [
      {
        type: "confirm",
        name: "isDelivery",
        message: "Do you want to get food near your home?"
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

          let bWhen = false;
          if (answers.isDelivery) {
            // add address prompt if doesn't exist
            if (indexOfAddress === -1) {
              this.prompts.splice(this.parentQuantity + 1, 0, this.dynamicAddressPrompt);
            }
            bWhen = true;
          } else {
            // remove address prompt if exists
            if (indexOfAddress > -1) {
              this.prompts.splice(indexOfAddress, 1);
            }
          }

          return bWhen;
        }
      }
    ];

    this.answers = await this.prompt(prompts);

    if (this.answers.isDelivery) {
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
