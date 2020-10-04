var Generator = require('yeoman-generator');
var chalkPipe = require('chalk-pipe');
var Inquirer = require('inquirer');
var path = require('path');
var _ = require('lodash');
var types = require('@sap-devx/yeoman-ui-types');
const Datauri = require('datauri/sync');
const DEFAULT_IMAGE = require("./images/defaultImage");

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.vscode = opts.vscode;

    this.setPromptsCallback = fn => {
      if (this.prompts) {
        this.prompts.setCallback(fn);
      }
    };

    var prompts = [
      {name: "Basic Information", description: "Provide basic information to receive personalized service."},
      {name: "Main Dishes", description: "Select a main dish from the list."},
      {name: "Desserts", description: "How would you like to end your meal?"},
      {name: "Registration", description: "Thank you for your interest in our resturant.\nPlease enter credentials to register.\n(It should not take you more than 1 minute.)"}
    ];
    this.prompts = new types.Prompts(prompts);

    this.option('babel');
  }

  paths() {
    this.log(this.destinationRoot());
    // returns '~/projects'

    this.log(this.destinationPath('index.js'));
    // returns '~/projects/index.js'
  }

  async initializing() {
    this.composeWith(require.resolve("../app2"), { prompts: this.prompts });
  }

  async prompting() {
    let prompts = [
      {
        type: "confirm",
        name: "hungry",
        message: "Are you hungry?",
        store: true
      },
      {
        type: "confirm",
        name: "confirmHungry",
        message: (answers) => {
          return `You said you are ${(answers.hungry ? '' : 'not ')}hungry. Is this correct?`;
        },
        store: true,
        validate: (value, answers) => {
          return (value === true ? true : "You must be hungry");
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
          return response.hungry;
        },
        validate: (value, answers) => {
          this.fav_color = value;
          return (value.length > 1 ? true : "Enter at least 2 characters");
        },
        transformer: function (color, answers, flags) {
          const text = chalkPipe(color)(color);
          if (flags.isFinal) {
            return text + '!';
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
        message: "How many times have you been in this resturant?",
        guiOptions: {
          hint: "We hope you have been in our resturant many times",
		  applyDefaultWhenDirty: true,
		  mandatory: true
        },
      },
      {
        when: async response => {
          this.log(response.hungry);
          const that = this;
          return new Promise((resolve) => {
			that.log(`Purposely delaying response for 2 seconds.`, {type: "error", location: "prompt"});
			that.log(`Purposely delaying response for 2 seconds.`, {type: "error", location: "message"});
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
          { value: "jerk-chicken", name: "Pulled Jerk Chicken", description: "A slow cooked pulled chicken.", image: this._getImage(path.join(this.sourceRoot(), "../images/jerk-chicken.jpeg"))},
          { value: "lasagna", name: "Lasagna", description: "Layers of creamy ricotta, spinach, and tomato sauce, topped with Parmesan and mozzarella cheese. ", image: this._getImage(path.join(this.sourceRoot(), "../images/lasagna.jpeg"))},
          { value: "steak", name: "Rib Eye Steak", description: "Super traditional big rib eye with baked potatos.", image: this._getImage(path.join(this.sourceRoot(), "../images/steak.jpg"))},
          { value: "spaghetti", name: "Spaghetti Carbonara", description: "Classic spaghetti alla carbonara, made with pancetta and Italian-style bacon.", homepage: "https://www.allrecipes.com/recipe/11973/spaghetti-carbonara-ii/", image: DEFAULT_IMAGE },
        ],
        default: "junk-food"
      }
    ];

    this.answers_main_dish = await this.prompt(prompts);

    // currently not supported:
    const ui = new Inquirer.ui.BottomBar();

    ui.updateBottomBar("This is written to the bottom bar");

    prompts = [
      {
        when: () => {
			this.log(this.answers.confirmHungry, this.answers.hungerLevel, {type: "warn", location: "prompt"});
    		this.log(this.answers.confirmHungry, this.answers.hungerLevel, {type: "warn", location: "message"});
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
        default: "/"
      },
      {
        type: "input",
        guiOptions: {
          type: "folder-browser",
        },
        name: "dump",
        message: "Choose dump folder",
        default: "/"
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
	this.log("Hunger level", this.answers.hungerLevel, {type: "info", location: "prompt"});
    this.log("Hunger level", this.answers.hungerLevel, {type: "info", location: "message"});

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
          return (value !== 'private' ? true : "private repository is not supported");
        },
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
    this.log("Email", this.answers.email);
  }

  _requireLetterAndNumber(value) {
    if (/\w/.test(value) && /\d/.test(value)) {
      return true;
    }

    return 'The password must contain at least a letter and a number';
  }

  _getImage(imagePath) {
    let image;
    try {
      image = Datauri(imagePath).content;
    } catch (error) {
      image = DEFAULT_IMAGE;
      this.log("Error", error);
    }
    return image;
  }

  configuring() {
    this.log('in configuring');
    this.destinationRoot(path.join(this.destinationRoot(), _.get(this, "answers_main_dish.food", "")));
    this.log('destinationRoot: ' + this.destinationRoot());
  }

  writing() {
    this.log('in writing');
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
    this.npmInstall(['lodash'], { 'save-dev': true });
  }

  end() {
    this.log('in end');
    const showInformationMessage = _.get(this.vscode, "window.showInformationMessage");
    if (showInformationMessage) {
      showInformationMessage("FoodQ ended");
    }
  }
};
