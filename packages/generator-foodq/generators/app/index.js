const Generator = require("yeoman-generator");
const chalkPipe = require("chalk-pipe");
const Inquirer = require("inquirer");
const path = require("path");
const _ = require("lodash");
const types = require("@sap-devx/yeoman-ui-types");
const Datauri = require("datauri/sync");
const DEFAULT_IMAGE = require("./images/defaultImage");

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.data = opts.data;

    this.appWizard = types.AppWizard.create(opts);

    this.option("silent", { type: Boolean });

    const silent = _.get(this.options, "silent", false);

    this.argument("food", {
      type: String,
      required: false,
      default: silent ? "lasagna" : undefined,
    });
    this.argument("hungry", {
      type: Boolean,
      required: false,
      default: silent ? true : undefined,
    });
    this.argument("confirmHungry", {
      type: Boolean,
      required: false,
      default: silent ? true : undefined,
    });
    this.argument("favColor", {
      type: String,
      required: false,
      default: silent ? "green" : undefined,
    });
    this.argument("number", {
      type: Number,
      required: false,
      default: silent ? 12 : undefined,
    });
    this.argument("beers", {
      type: Array,
      required: false,
      default: silent ? ["Allagash White Ale", "St. Feuillien Blonde"] : undefined,
    });
    this.argument("hungerLevel", {
      type: String,
      required: false,
      default: silent ? "A bit hungry" : undefined,
    });
    this.argument("dessert", {
      type: Array,
      required: false,
      default: silent ? ["ice-cream"] : undefined,
    });
    this.argument("uploadMenu", {
      type: String,
      required: false,
      default: silent ? "/" : undefined,
    });
    this.argument("dump", {
      type: String,
      required: false,
      default: silent ? "/" : undefined,
    });
    this.argument("enjoy", {
      type: String,
      required: false,
      default: silent ? "ok" : undefined,
    });
    this.argument("comments", {
      type: String,
      required: false,
      default: silent ? "hello\nmy friend\n" : undefined,
    });
    this.argument("repotype", {
      type: String,
      required: false,
      default: silent ? "GitLab" : undefined,
    });
    this.argument("repoperms", {
      type: String,
      required: false,
      default: silent ? "public" : undefined,
    });
    this.argument("email", {
      type: String,
      required: false,
      default: silent ? "myUsername" : undefined,
    });
    this.argument("password", {
      type: String,
      required: false,
      default: silent ? "password123" : undefined,
    });

    this.setPromptsCallback = (fn) => {
      if (this.prompts) {
        this.prompts.setCallback(fn);
      }
    };

    var prompts = [
      {
        name: "Basic Information",
        description: "Provide basic information to receive personalized service.",
      },
      { name: "Main Dishes", description: "Select a main dish from the list." },
      { name: "Desserts", description: "How would you like to end your meal?" },
      {
        name: "Registration",
        description:
          "Thank you for your interest in our resturant.\nPlease enter credentials to register.\n(It should not take you more than 1 minute.)",
      },
    ];
    this.prompts = new types.Prompts(prompts);

    this.option("babel");
  }

  _getAnswer(name, res) {
    return this._getOption(name) || _.get(res, `[${name}]`);
  }

  _getOption(name) {
    return _.get(this.options, `[${name}]`);
  }

  async initializing() {
    const silent = this._getOption("silent");
    this.composeWith(require.resolve("../app2"), {
      prompts: this.prompts,
      appWizard: this.appWizard,
      silent,
    });
  }

  async prompting() {
    let prompts = [
      {
        type: "confirm",
        name: "hungry",
        message: "Are you hungry?",
        labelTrue: "Yes, I am",
        labelFalse: "No, I am not",
        guiOptions: {
          breadcrumb: "Hungry",
        },
        default: true,
        when: () => _.isNil(this._getOption("hungry")),
      },
      {
        type: "confirm",
        name: "confirmHungry",
        message: (answers) => {
          const isHungry = this._getAnswer("hungry", answers);
          return `You said you are ${isHungry ? "" : "not "}hungry. Is this correct?`;
        },
        guiOptions: {
          breadcrumb: "Really hungry",
        },
        store: true,
        validate: (value) => {
          if (value) {
            this.appWizard.showInformation("Good news !! You are hungry !!!", types.MessageType.prompt);
            return true;
          }
          this.appWizard.showError("You must be hungry", types.MessageType.prompt);
          return "You must be hungry";
        },
        when: () => _.isNil(this._getOption("confirmHungry")),
      },
      {
        type: "input",
        guiOptions: {
          type: "radio",
          hint: "No picky eaters allowed—our chef takes it personally.",
        },
        name: "diningStyle",
        message: "What’s the best way to describe your dining style?",
        orientation: "vertical",
        choices: ["Slow Eater", "Speed Eater", "Social Eater",{ value: "Picky Eater", disabled: true}],
        default: "cat",
      },
      {
        type: "input",
        name: "favColor",
        message: "What's your favorite napkin color?",
        placeholder: "Drake's Neck Green",
        guiOptions: {
          hint: "Our recommendation is green",
          breadcrumb: "Napkin color",
        },
        additionalMessages: (input, answers) => {
          if (input === "warn") {
            return {
              message: "Some warning message",
              severity: 1,
            };
          }
          if (input === "blue" && answers["confirmHungry"] === false) {
            return {
              message: `Some conditional warning message (Confirm hungry: ${answers["confirmHungry"]})`,
              severity: 1,
            };
          }
          if (input === "infolong") {
            return {
              message:
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." +
                "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." +
                "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
              severity: 2,
            };
          }
          if (input === "info") {
            return {
              message: "Some info message",
              severity: 2,
            };
          }
          if (input === "error") {
            return {
              message: "Some error message (consider using a validation message)",
              severity: 0,
            };
          }
        },
        when: (response) => {
          if (_.isNil(this._getOption("favColor"))) {
            const hungry = this._getAnswer("hungry", response);
            if (hungry) {
              this.appWizard.showInformation("Our recommendation for color is green", types.MessageType.notification);
            }

            return hungry;
          }
          return false;
        },
        validate: (value) => {
          this.favColor = value;
          return value.length > 1 ? true : "Enter at least 2 characters";
        },
        transformer: function (color, answers, flags) {
          const text = chalkPipe(color)(color);
          if (flags.isFinal) {
            return `${text}!`;
          }
          return text;
        },
      },
      {
        default: (answers) => {
          const favColor = this._getAnswer("favColor", answers);
          return favColor === "green" ? "11" : favColor === "red" ? "44" : "5";
        },
        validate: (value) => {
          return value > 10 ? true : "Enter a number > 10";
        },
        type: "number",
        name: "number",
        message: "How many times have you been in this restaurant?",
        guiOptions: {
          hint: "We hope you have been in our restaurant many times",
          applyDefaultWhenDirty: true,
          mandatory: true,
          breadcrumb: "Restaurant visits",
        },
        when: () => _.isNil(this._getOption("number")),
      },
      {
        when: async (response) => {
          if (_.isNil(this._getOption("beers"))) {
            // eslint-disable-next-line no-undef
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(this._getAnswer("hungry", response));
              }, 2000);
            });
          }
          return false;
        },
        type: "checkbox",
        guiOptions: {
          breadcrumb: "Beer",
        },
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
          "Augustiner Hell",
        ],
      },
    ];

    this.answers = await this.prompt(prompts);
    this.answers.hungry = this._getAnswer("hungry", this.answers);
    this.answers.confirmHungry = this._getAnswer("confirmHungry", this.answers);
    this.answers.favColor = this._getAnswer("favColor", this.answers);
    this.answers.number = this._getAnswer("number", this.answers);
    this.answers.beers = this._getAnswer("beers", this.answers);

    prompts = [
      {
        name: "food",
        type: "list",
        message: "Choose dish",
        guiOptions: {
          type: "tiles",
          breadcrumb: true,
        },
        choices: [
          {
            value: "junk-food",
            name: "Junk Food",
            description: "It is the best food, but long term, junk food can increase the risk of a heart attack.",
            homepage: "https://www.betterhealthsolutions.org/junk-food-ruining-body/",
            image: this._getImage(path.join(this.sourceRoot(), "../images/junk-food.jpg")),
          },
          {
            value: "jerk-chicken",
            name: "Pulled Jerk Chicken",
            description: "A slow cooked pulled chicken.",
            image: this._getImage(path.join(this.sourceRoot(), "../images/jerk-chicken.jpeg")),
          },
          {
            value: "lasagna",
            name: "Lasagna",
            description:
              "Layers of creamy ricotta, spinach, and tomato sauce, topped with Parmesan and mozzarella cheese. ",
            image: this._getImage(path.join(this.sourceRoot(), "../images/lasagna.jpeg")),
          },
          {
            value: "steak",
            name: "Rib Eye Steak",
            description: "Super traditional big rib eye with baked potatos.",
            image: this._getImage(path.join(this.sourceRoot(), "../images/steak.jpg")),
          },
          {
            value: "spaghetti",
            name: "Spaghetti Carbonara",
            description: "Classic spaghetti alla carbonara, made with pancetta and Italian-style bacon.",
            homepage: "https://www.allrecipes.com/recipe/11973/spaghetti-carbonara-ii/",
            image: DEFAULT_IMAGE,
          },
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
        },
        when: () => _.isNil(this._getOption("food")),
      },
    ];

    this.answers_main_dish = await this.prompt(prompts);
    this.answers_main_dish.food = this._getAnswer("food", this.answers_main_dish);

    // currently not supported:
    const ui = new Inquirer.ui.BottomBar();

    ui.updateBottomBar("This is written to the bottom bar");

    prompts = [
      {
        when: () => {
          if (_.isNil(this._getOption("hungerLevel"))) {
            return this._getAnswer("confirmHungry", this.answers);
          }
          return false;
        },
        type: "list",
        name: "hungerLevel",
        message: "How hungry are you?",
        choices: () => [
          {
            name: "Very hungry",
          },
          {
            name: "A bit hungry",
          },
          {
            name: "Not hungry at all",
          },
        ],
      },
      {
        type: "checkbox",
        name: "dessert",
        message: "Which desserts would you like?",
        validate: (answer) => {
          if (answer.length < 1) {
            return "You must choose at least one dessert.";
          }
          return true;
        },
        choices: [
          {
            name: "Buttery Raspberry Crumble Bars",
            value: "includeSass",
            checked: false,
          },
          {
            name: "Mint Oreo Cake",
            value: "includeBootstrap",
            checked: true,
          },
          {
            name: "Ultimate Gooey Brownies",
            value: "includeModernizr",
            checked: true,
          },
        ],
        when: () => _.isNil(this._getOption("dessert")),
      },
      {
        type: "input",
        guiOptions: {
          type: "file-browser",
        },
        name: "uploadMenu",
        message: "Upload menu",
        default: _.get(this.data, "folder", "/"),
        when: () => _.isNil(this._getOption("uploadMenu")),
      },
      {
        type: "input",
        guiOptions: {
          type: "folder-browser",
        },
        name: "dump",
        message: "Choose dump folder",
        when: () => _.isNil(this._getOption("dump")),
      },
      {
        type: "list",
        name: "enjoy",
        message: "Did you enjoy your meal?",
        default: (answers) => {
          return this._getAnswer("hungerLevel", answers) === "A bit hungry" ? "ok" : "michelin";
        },
        choices: [
          {
            name: "Not at all",
            value: "no",
          },
          {
            name: "It was ok",
            value: "ok",
          },
          {
            name: "Three Michelin stars",
            value: "michelin",
          },
        ],
        validate: (answer) => {
          if (answer === "no") {
            return "That's not a possible option.";
          }
          return true;
        },
        when: () => _.isNil(this._getOption("enjoy")),
      },
      {
        type: "editor",
        name: "comments",
        message: "Comments",
        validate: (text) => {
          if (!text || text.split("\n").length < 2) {
            return "Must be at least 2 lines.";
          }
          return true;
        },
        when: () => _.isNil(this._getOption("comments")),
      },
    ];

    const answers = await this.prompt(prompts);
    answers.hungerLevel = this._getAnswer("hungerLevel", answers);
    answers.dessert = this._getAnswer("dessert", answers);
    answers.uploadMenu = this._getAnswer("uploadMenu", answers);
    answers.dump = this._getAnswer("dump", answers);
    answers.enjoy = this._getAnswer("enjoy", answers);
    answers.comments = this._getAnswer("comments", answers);

    this.answers = Object.assign({}, this.answers, answers);

    prompts = [
      {
        type: "rawlist",
        guiOptions: {
          hint: "Select the repository type",
          link: {
            text: "Preferences",
            command: {
              id: "workbench.action.openSettings",
              params: ["ApplicationWizard.Workspace"],
            },
          },
        },
        name: "repotype",
        message: "Git repository type",
        choices: [
          "Github",
          "GitLab",
          new Inquirer.Separator(),
          "Bitbucket",
          new Inquirer.Separator("Text separator"),
          "Gitea",
        ],
        when: () => _.isNil(this._getOption("repotype")),
      },
      {
        type: "expand",
        guiOptions: {
          hint: "Select the repository permissions",
        },
        name: "repoperms",
        message: "Git repository permissions",
        choices: [
          {
            key: "u",
            name: "Public",
            value: "public",
          },
          {
            key: "r",
            name: "Private",
            value: "private",
          },
        ],
        validate: (value) => {
          if (value === "private") {
            this.appWizard.showError("Private repository is not supported", types.MessageType.notification);
          }
          return value !== "private" ? true : "private repository is not supported";
        },
        when: () => _.isNil(this._getOption("repoperms")),
      },
      {
        guiOptions: {
          hint: "Enter your user name",
          link: {
            text: "Browse repository",
            url: "https://github.com/SAP/yeoman-ui",
          },
          mandatory: true,
        },
        name: "email",
        message: "GitHub user name",
        store: true,
        validate: (value) => {
          return value.length > 0 ? true : "Mandatory field";
        },
        when: () => _.isNil(this._getOption("email")),
      },
      {
        type: "password",
        guiOptions: {
          type: "login",
          hint: "Enter your password",
          mandatory: true,
        },
        name: "password",
        message: "GitHub password",
        mask: "*",
        validate: this._requireLetterAndNumber.bind(this),
        when: (response) => {
          if (_.isNil(this._getOption("password"))) {
            return this._getAnswer("email", response) !== "root";
          }
          return false;
        },
      },
    ];

    const answers_login = await this.prompt(prompts);
    answers_login.repotype = this._getAnswer("repotype", answers_login);
    answers_login.repoperms = this._getAnswer("repoperms", answers_login);
    answers_login.email = this._getAnswer("email", answers_login);
    answers_login.password = this._getAnswer("password", answers_login);
    this.answers = Object.assign({}, this.answers, answers_login);
  }

  _requireLetterAndNumber(value) {
    if (/\w/.test(value) && /\d/.test(value)) {
      return true;
    }
    this.appWizard.showWarning(
      "The password must contain at least a letter and a number",
      types.MessageType.notification,
    );
    return "The password must contain at least a letter and a number";
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
    this.log("FoodQ is in configuring stage.");
    this.destinationRoot(path.join(this.destinationRoot(), _.get(this, "answers_main_dish.food", "")));
    this.log(`Destination Root = ${this.destinationRoot()}`);
  }

  writing() {
    this.log("FoodQ is in writing stage.");
    this.appWizard.showProgress("Generating the FoodQ project.");

    this.log("The following choices were chosen:");
    !_.isNil(this.answers.hungry) && this.log(`Hungry = ${this.answers.hungry}`);
    !_.isNil(this.answers.confirmHungry) && this.log(`Confirm Hungry = ${this.answers.confirmHungry}`);
    !_.isNil(this.answers_main_dish.food) && this.log(`Main dish = ${this.answers_main_dish.food}`);
    !_.isEmpty(this.answers.beers) && this.log(`Beers = ${this.answers.beers}`);
    !_.isNil(this.answers.favColor) && this.log(`Favorite napkin color = ${this.answers.favColor}`);
    !_.isNil(this.answers.number) && this.log(`Times you have been in this restaurant = ${this.answers.number}`);

    this.fs.copyTpl(this.templatePath("index.html"), this.destinationPath("public/index.html"), {
      title: "Templating with Yeoman",
      hungry: this.answers.hungry,
      confirmHungry: this.answers.confirmHungry,
      food: this.answers_main_dish.food,
      beers: this.answers.beers,
      favColor: this.answers.favColor,
      number: this.answers.number,

      hungerLevel: this.answers.hungerLevel,
      dessert: this.answers.dessert,
      enjoy: this.answers.enjoy,
      comments: this.answers.comments,

      repotype: this.answers.repotype,
      repoperms: this.answers.repoperms,
      email: this.answers.email,
      password: this.answers.password,
    });

    this.fs.copy(this.templatePath("README.md"), this.destinationPath("README.md"));

    const pkgJson = {
      devDependencies: {
        eslint: "^3.15.0",
      },
      dependencies: {
        react: "^16.2.0",
      },
    };
    // Extend or create package.json file in destination path
    this.fs.extendJSON(this.destinationPath("package.json"), pkgJson);
  }

  install() {
    this.log("FoodQ is installing dependencies.");
    this.npmInstall(["lodash"], { "save-dev": true }, { stdio: ["inherit", "ignore", "ignore"] });
  }

  end() {
    this.log("FoodQ completed to install dependencies.");
    this.log("FoodQ generation completed.");
  }
};
