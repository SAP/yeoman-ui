const Generator = require('yeoman-generator');
const chalkPipe = require('chalk-pipe');
const Inquirer = require('inquirer');
const path = require('path');
const _ = require('lodash');
const types = require('@sap-devx/yeoman-ui-types');
const Datauri = require('datauri/sync');
const DEFAULT_IMAGE = require("./images/defaultImage");

module.exports = class extends Generator {
	constructor(args, opts) {
		super(args, opts);

		this.data = opts.data;

		this.appWizard = types.AppWizard.create(opts);

		this.setPromptsCallback = fn => {
			if (this.prompts) {
				this.prompts.setCallback(fn);
			}
		};

		var prompts = [
			{ name: "Basic Information", description: "Provide basic information to receive personalized service." },
			{ name: "Main Dishes", description: "Select a main dish from the list." },
			{ name: "Desserts", description: "How would you like to end your meal?" },
			{ name: "Registration", description: "Thank you for your interest in our resturant.\nPlease enter credentials to register.\n(It should not take you more than 1 minute.)" }
		];
		this.prompts = new types.Prompts(prompts);

		this.option('babel');
	}

	async initializing() {
		this.composeWith(require.resolve("../app2"), { prompts: this.prompts, appWizard: this.appWizard });
	}

	async prompting() {
		let prompts = [
			{
				type: "confirm",
				name: "hungry",
				message: "Are you hungry?",
				default: true
			},
			{
				type: "confirm",
				name: "confirmHungry",
				message: (answers) => {
					return `You said you are ${(answers.hungry ? '' : 'not ')}hungry. Is this correct?`;
				},
				store: true,
				validate: (value, answers) => {
					if (value) {
						this.appWizard.showInformation("Good news !! You are hungry !!!", types.MessageType.prompt);
						return true;
					}
					this.appWizard.showError("You must be hungry", types.MessageType.prompt);
					return "You must be hungry";
				},
			},
			{
				type: 'input',
				name: 'fav_color',
				message: "What's your favorite napkin color?",
				guiOptions: {
					hint: "Our recommendation is green"
				},
				when: (response) => {
					if (response.hungry) {
						this.appWizard.showInformation("Our recommendation for color is green", types.MessageType.notification);
					}
				
					return response.hungry;
				},
				validate: (value, answers) => {
					this.fav_color = value;
					return (value.length > 1 ? true : "Enter at least 2 characters");
				},
				transformer: function (color, answers, flags) {
					const text = chalkPipe(color)(color);
					if (flags.isFinal) {
						return `${text}!`;
					}
					return text;
				}
			},
			{
				default: (answers) => {
					return (answers.fav_color === "green" ? "11" : answers.fav_color === "red" ? "44" : "5");
				},
				validate: (value, answers) => {
					return (value > 10 ? true : "Enter a number > 10");
				},
				type: "number",
				name: "number",
				message: "How many times have you been in this restaurant?",
				guiOptions: {
					hint: "We hope you have been in our restaurant many times",
					applyDefaultWhenDirty: true,
					mandatory: true
				},
			},
			{
				when: async response => {
					return new Promise(resolve => {
						setTimeout(() => {
							resolve(response.hungry);
						}, 2000);
					});
				},
				type: "checkbox",
				name: "beers",
				message: "Which beer would you like?",
				choices: [
					"Chimay Trappist Ales",
					"Paulaner Salvator Doppel Bock",
					"Weihenstephaner Korbinian",
					"Hoegaarden Belguim White",
					"Allagash White Ale",
					"St. Feuillien Blonde",
					"Houblon Chouffe Dobbelen IPA Tripel",
					"Augustiner Hell"
				]
			}
		];

		this.answers = await this.prompt(prompts);

		prompts = [
			{
				name: "food",
				type: "list",
				message: "Choose dish",
				guiOptions: {
					type: "tiles",
				},
				choices: [
					{ value: "junk-food", name: "Junk Food", description: "It is the best food, but long term, junk food can increase the risk of a heart attack.", homepage: "https://www.betterhealthsolutions.org/junk-food-ruining-body/", image: this._getImage(path.join(this.sourceRoot(), "../images/junk-food.jpg")) },
					{ value: "jerk-chicken", name: "Pulled Jerk Chicken", description: "A slow cooked pulled chicken.", image: this._getImage(path.join(this.sourceRoot(), "../images/jerk-chicken.jpeg")) },
					{ value: "lasagna", name: "Lasagna", description: "Layers of creamy ricotta, spinach, and tomato sauce, topped with Parmesan and mozzarella cheese. ", image: this._getImage(path.join(this.sourceRoot(), "../images/lasagna.jpeg")) },
					{ value: "steak", name: "Rib Eye Steak", description: "Super traditional big rib eye with baked potatos.", image: this._getImage(path.join(this.sourceRoot(), "../images/steak.jpg")) },
					{ value: "spaghetti", name: "Spaghetti Carbonara", description: "Classic spaghetti alla carbonara, made with pancetta and Italian-style bacon.", homepage: "https://www.allrecipes.com/recipe/11973/spaghetti-carbonara-ii/", image: DEFAULT_IMAGE },
				],
				default: "junk-food",
				validate: (value) => {
					if (_.includes(["jerk-chicken", "steak"], value)) {
						this.appWizard.showWarning("You are a vegan, aren't you ?");
					} else if (value === "junk-food") {
						this.appWizard.showError("Think twice !!");
					} else {
						this.appWizard.showInformation("Good choice.");
					}
					return true;
				}
			}
		];

		this.answers_main_dish = await this.prompt(prompts);

		// currently not supported:
		const ui = new Inquirer.ui.BottomBar();

		ui.updateBottomBar("This is written to the bottom bar");

		prompts = [{
				when: () => {
					return this.answers.confirmHungry;
				},
				type: "list",
				name: "hungerLevel",
				message: "How hungry are you?",
				choices: () => [
					{ name: "Very hungry" },
					{ name: "A bit hungry" },
					{ name: "Not hungry at all" }
				]
			},
			{
				type: "checkbox",
				name: "dessert",
				message: "Which desserts would you like?",
				validate: (answer) => {
					if (answer.length < 1) {
						return 'You must choose at least one dessert.'
					}
					return true
				},
				choices: [{
					name: "Buttery Raspberry Crumble Bars",
					value: "includeSass",
					checked: false
				}, {
					name: "Mint Oreo Cake",
					value: "includeBootstrap",
					checked: true
				}, {
					name: "Ultimate Gooey Brownies",
					value: "includeModernizr",
					checked: true
				}]
			},
			{
				type: "input",
				guiOptions: {
					type: "file-browser",
				},
				name: "uploadMenu",
				message: "Upload menu",
				default: _.get(this.data, "folder", "/")
			},
			{
				type: "input",
				guiOptions: {
					type: "folder-browser",
				},
				name: "dump",
				message: "Choose dump folder",
				default: _.get(this.data, "folder", "/")
			},
			{
				type: 'list',
				name: 'enjoy',
				message: 'Did you enjoy your meal?',
				default: (answers) => {
					return (answers.hungerLevel === "A bit hungry" ? "ok" : "michelin");
				},
				choices: [
					{ name: 'Not at all', value: 'no' },
					{ name: 'It was ok', value: 'ok' },
					{ name: 'Three Michelin stars', value: 'michelin' },
				],
				validate: (answer) => {
					if (answer === 'no') {
						return "That's not a possible option."
					}
					return true
				}
			},
			{
				type: 'editor',
				name: 'comments',
				message: 'Comments',
				validate: function (text) {
					if (!text || text.split('\n').length < 2) {
						return 'Must be at least 2 lines.';
					}
					return true;
				}
			}
		];

		const answers = await this.prompt(prompts);

		this.answers = Object.assign({}, this.answers, answers);

		prompts = [
			{
				type: 'rawlist',
				guiOptions: {
					hint: "Select the repository type"
				},
				name: 'repotype',
				message: 'Git repository type',
				choices: [
					'Github',
					'GitLab',
					new Inquirer.Separator(),
					'Bitbucket',
					new Inquirer.Separator("Text separator"),
					'Gitea'
				]
			},
			{
				type: 'expand',
				guiOptions: {
					hint: "Select the repository permissions"
				},
				name: 'repoperms',
				message: 'Git repository permissions',
				choices: [
					{
						key: 'u',
						name: 'Public',
						value: 'public'
					},
					{
						key: 'r',
						name: 'Private',
						value: 'private'
					}
				],
				validate: (value, answers) => {
					if (value === "private") {
						this.appWizard.showError("Private repository is not supported", types.MessageType.notification);
					}
					return (value !== 'private' ? true : "private repository is not supported");
				}
			},
			{
				guiOptions: {
					hint: "Enter your user name",
					mandatory: true
				},
				name: "email",
				message: "GitHub user name",
				store: true,
				validate: (value, answers) => {
					return (value.length > 0 ? true : "Mandatory field");
				}
			},
			{
				type: "password",
				guiOptions: {
					type: "login",
					hint: "Enter your password",
					mandatory: true
				},
				name: "password",
				message: "GitHub password",
				mask: '*',
				validate: this._requireLetterAndNumber,
				when: (response) => {
					return response.email !== "root";
				}
			}
		];

		const answers_login = await this.prompt(prompts);
		this.answers = Object.assign({}, this.answers, answers_login);
	}

	_requireLetterAndNumber(value) {
		if (/\w/.test(value) && /\d/.test(value)) {
			return true;
		}
		this.appWizard.showWarning('The password must contain at least a letter and a number', types.MessageType.notification);
		return 'The password must contain at least a letter and a number';
	}

	_getImage(imagePath) {
		let image;
		try {
			image = Datauri(imagePath).content;
		} catch (error) {
			image = DEFAULT_IMAGE;
			this.log(`Error = ${error}`);
		}

		return image;
	}

	configuring() {
		this.log('FoodQ is in configuring stage.');
		this.destinationRoot(path.join(this.destinationRoot(), _.get(this, "answers_main_dish.food", "")));
		this.log(`Destination Root = ${this.destinationRoot()}`);
	}

	writing() {
		this.log('FoodQ is in writing stage.');
		this.appWizard.showProgress("Generating the FoodQ project.");

		this.log('The following choices were chosen:');
		!_.isNil(this.answers.hungry) && this.log(`Hungry = ${this.answers.hungry}`);
		!_.isNil(this.answers.confirmHungry) && this.log(`Confirm Hungry = ${this.answers.confirmHungry}`);
		!_.isNil(this.answers_main_dish.food) && this.log(`Main dish = ${this.answers_main_dish.food}`);
		!_.isEmpty(this.answers.beers) && this.log(`Beers = ${this.answers.beers}`);
		!_.isNil(this.answers.fav_color) && this.log(`Favorite napkin color = ${this.answers.fav_color}`);
		!_.isNil(this.answers.number) && this.log(`Times you have been in this restaurant = ${this.answers.number}`);

		this.fs.copyTpl(this.templatePath('index.html'),
			this.destinationPath('public/index.html'), {
			title: 'Templating with Yeoman',
			hungry: this.answers.hungry,
			confirmHungry: this.answers.confirmHungry,
			food: this.answers_main_dish.food,
			beers: this.answers.beers,
			fav_color: this.answers.fav_color,
			number: this.answers.number,

			hungerLevel: this.answers.hungerLevel,
			dessert: this.answers.dessert,
			enjoy: this.answers.enjoy,
			comments: this.answers.comments,

			repotype: this.answers.repotype,
			repoperms: this.answers.repoperms,
			email: this.answers.email,
			password: this.answers.password
		}
		);
		this.fs.copy(
			this.templatePath('README.md'),
			this.destinationPath('README.md')
		);

		const pkgJson = {
			devDependencies: {
				eslint: '^3.15.0'
			},
			dependencies: {
				react: '^16.2.0'
			}
		};
		// Extend or create package.json file in destination path
		this.fs.extendJSON(this.destinationPath('package.json'), pkgJson);
	}

	install() {
		this.log('FoodQ is installing dependencies.');
		this.npmInstall(['lodash'], { 'save-dev': true });
	}

	end() {
		this.log('FoodQ completed to install dependencies.');
		this.log('FoodQ generation completed.');
	}
};
