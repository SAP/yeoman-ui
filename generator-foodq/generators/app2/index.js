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
				message: "Do you want the food delivered to your home?",
				default: true
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
				validate: (value) => {
					if (value === "car") {
						this.appWizard.showWarning("Car delivery is not reliable.", types.MessageType.prompt);
					} else {
						this.appWizard.showInformation("Drone is very fast.", types.MessageType.prompt);
					}
					return true;
				},
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
			const answersDelivery = await this.prompt(addressPrompt);
			this.answers = Object.assign({}, this.answers, answersDelivery);
		}

		const tipPrompt = [
			{
				type: "number",
				name: "tip",
				message: "How much would you like to tip?",
				default: "10"
			}
		];

		const answersTip = await this.prompt(tipPrompt);
		this.answers = Object.assign({}, this.answers, answersTip);
	}

	writing() {
		!_.isNil(this.answers.tip) && this.log(`Tip = ${this.answers.tip}`);
		!_.isNil(this.answers.address) && this.log(`Address = ${this.answers.address}`);
		!_.isNil(this.answers.deliveryMethod) && this.log(`Delivery method = ${this.answers.deliveryMethod}`);
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
