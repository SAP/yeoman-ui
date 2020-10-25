var Generator = require('yeoman-generator');
var _ = require('lodash');
var path = require('path');
const Datauri = require('datauri/sync');
const DEFAULT_IMAGE = require("./images/defaultImage");
const types = require('@sap-devx/yeoman-ui-types');

module.exports = class extends Generator {
	constructor(args, opts) {
		super(args, opts);
		this.prompts = opts.prompts;
		this.appWizard = opts.appWizard;
		this.parentPromptsQuantity = this.prompts.size();

		//this.appWizard.showInformation("Initializing sub generator...", types.MessageType.prompt);

		this.dynamicAddressPrompt = { name: "Address", description: "Provide the address for delivery." };

		const prompts = [
			{ name: "Delivery", description: "Select your prefered delivery method." },
			this.dynamicAddressPrompt,
			{ name: "Tip", description: "You can include a tip for the delivery person." }];

		this.prompts.splice(this.parentPromptsQuantity, 0, prompts);
	}

	async prompting() {
		// isDelivery question appears twice in CLI: https://github.com/yeoman/generator/issues/1100
		const prompts = [
			{
				type: "confirm",
				name: "isDelivery",
				message: "Do you want the food delivered to your home?"
			},
			{
				type: "list",
				guiOptions: {
					type: "tiles",
					hint: "Select the preferred delivery method"
				},
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
					message: "Home address",
					filter: function (value) {
						return `(${value})`
					}
				}
			];
			this.answers = await this.prompt(addressPrompt);
		}

		const tipPrompt = [
			{
				type: "number",
				name: "tip",
				message: "How much would you like to tip?",
				default: "10"
			}
		];

		this.answers = await this.prompt(tipPrompt);
	}

	_getImage(imagePath) {
		try {
			return Datauri(imagePath).content;
		} catch (error) {
			this.log("Error", error);
			return DEFAULT_IMAGE;
		}
	}
};
