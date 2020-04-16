var Generator = require('yeoman-generator');
var _ = require('lodash');
var path = require('path');
const datauri = require("datauri");
const DEFAULT_IMAGE = require("./images/defaultImage");

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.prompts = opts.prompts;
    this.parentPromptsQuantity = this.prompts.size();

    this.dynamicAddressPrompt = {name: "Address", description: "Address Description"};

    const prompts = [
      {name: "Delivery", description: "Delivery Description"},
      this.dynamicAddressPrompt,
      {name: "Tip", description: "Tip Description"}];

    this.prompts.splice(this.parentPromptsQuantity, 0, prompts);
  }

  async prompting() {
    // isDelivery question appears twice in CLI: https://github.com/yeoman/generator/issues/1100
    const prompts = [
      {
        type: "confirm",
        name: "isDelivery",
        message: "Do you want to get food near your home?"
      },
      {
        type: "list",
        guiType: "tiles",
        name: "deliveryMethod",
        message: "Delivery method",
        choices: [
          { value: "car", name: "Car", image: this._getImage(path.join(this.sourceRoot(), "../images/car.png")) },
          { value: "drone", name: "Drone", image: this._getImage(path.join(this.sourceRoot(), "../images/drone.png")) }
        ],
        when: answers => {
          const indexOfAddress = _.findIndex(this.prompts.items, prompt => {
            return prompt.name === this.dynamicAddressPrompt.name;
          });

          let bWhen = false;
          if (answers.isDelivery) {
            // add address prompt if doesn't exist
            if (indexOfAddress === -1) {
              this.prompts.splice(this.parentPromptsQuantity + 1, 0, this.dynamicAddressPrompt);
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
      const addressPrompt = [
        {
          type: "input",
          name: "address",
          message: "Your Address"
        }
      ];
      this.answers = await this.prompt(addressPrompt);
    }

    const tipPrompt = [
      {
        type: "number",
        name: "tip",
        message: "Do you want to give a tip?",
        default: "10"
      }
    ];

    this.answers = await this.prompt(tipPrompt);
  }

  _getImage(imagePath) {
    let image;
    try {
      image = datauri.sync(imagePath);
    } catch (error) {
      image = DEFAULT_IMAGE;
      this.log("Error", error);
    }
    return image;
  }

};
