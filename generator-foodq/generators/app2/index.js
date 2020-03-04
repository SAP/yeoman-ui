var Generator = require('yeoman-generator');
var _ = require('lodash');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.prompts = opts.prompts;
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
        when: async (answers) => {
          let indexOfAddress = -1;
          for await (let [i, prompt] of this.prompts.items.entries()) {
            if (prompt && prompt.name === "Address") {
              indexOfAddress = i;
            }
          }

          const parentQuantity = _.size(this.prompts.items);
          if (answers.isTakeaway) {
            // add address prompt if doesn't exist
            if (indexOfAddress === -1) {
              this.prompts.splice(parentQuantity, 0, { name: "Address", description: "Address Description" });
            }
          } else {
            // remove address prompt if exists
            if (indexOfAddress > -1) {
              this.prompts.splice(parentQuantity, 1);
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
