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
		this.parentPromptsQuantity = _.size(this.prompts);

		this.option("np", { type: Boolean });
		const np = opts.np || _.get(this.options, "np", false);
		
		this.argument("isDelivery", { type: Boolean, required: false, default: (np ? true : undefined) });
		this.argument("deliveryMethod", { type: Array, required: false, default: (np ? "Drone" : undefined) });
		this.argument("address", { type: String, required: false, default: (np ? "the best street" : undefined) });
		this.argument("tip", { type: Number, required: false, default: (np ? 20 : undefined) });

		this.dynamicAddressPrompt = { name: "Address", description: "Provide the address for delivery." };

		const prompts = [{
			name: "Delivery", description: "Select your prefered delivery method."
		},
		this.dynamicAddressPrompt,
		{
			name: "Tip", description: "You can include a tip for the delivery person."
		}];

		if (this.prompts) {
			this.prompts.splice(this.parentPromptsQuantity, 0, prompts);
		}
	}

	_getAnswer(name, res) {
		return this._getOption(name) || _.get(res, `[${name}]`);
	}

	_getOption(name) {
		return _.get(this.options, `[${name}]`);
	}

	async prompting() {
		// isDelivery question appears twice in CLI: https://github.com/yeoman/generator/issues/1100
		const prompts = [{
			type: "confirm",
			name: "isDelivery",
			message: "Do you want the food delivered to your home?",
			default: true,
			when: () => _.isNil(this._getOption("isDelivery"))
		}, {
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
			validate: value => {
				if (value === "car") {
					this.appWizard.showWarning("Car delivery is not reliable.", types.MessageType.prompt);
				} else {
					this.appWizard.showInformation("Drone is very fast.", types.MessageType.prompt);
				}
				return true;
			},
			when: answers => {
				if (_.isNil(this._getOption("deliveryMethod"))) {
					const indexOfAddress = _.findIndex(_.get(this.prompts, "items"), prompt => {
						return prompt.name === this.dynamicAddressPrompt.name;
					});

					let bWhen = false;
					if (this._getAnswer("isDelivery", answers)) {
						// add address prompt if doesn't exist
						if (indexOfAddress === -1 && this.prompts) {
							this.prompts.splice(this.parentPromptsQuantity + 1, 0, this.dynamicAddressPrompt);
						}
						bWhen = true;
					} else {
						// remove address prompt if exists
						if (indexOfAddress > -1 && this.prompts) {
							this.prompts.splice(indexOfAddress, 1);
						}
					}

					return bWhen;
				}
				return false;
			},
		}];

		this.answers = await this.prompt(prompts);
		this.answers.isDelivery = this._getAnswer("isDelivery", this.answers);
		this.answers.deliveryMethod = this._getAnswer("deliveryMethod", this.answers);

		if (this._getAnswer("isDelivery", this.answers)) {
			const addressPrompt = [{
				type: "input",
				name: "address",
				message: "Home address",
				filter: function (value) {
					return `(${value})`
				},
				when: () => _.isNil(this._getOption("address"))
			}];
			const answersDelivery = await this.prompt(addressPrompt);
			answersDelivery.address = this._getAnswer("address", answersDelivery);
			this.answers = Object.assign({}, this.answers, answersDelivery);
		}

		const tipPrompt = [{
			type: "number",
			name: "tip",
			message: "How much would you like to tip?",
			default: "10",
			when: () => _.isNil(this._getOption("tip"))
		}];

		const answersTip = await this.prompt(tipPrompt);
		answersTip.tip = this._getAnswer("tip", answersTip);
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
