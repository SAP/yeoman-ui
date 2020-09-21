<template>
  <v-app id="app" class="vld-parent">
    <loading
      :active.sync="showBusyIndicator"
      :is-full-page="true"
      :height="64"
      :width="64"
      :color="isLoadingColor"
      background-color="transparent"
      loader="spinner"
    ></loading>

    <Header
      v-if="prompts.length"
      :headerTitle="headerTitle"
      :stepName="(promptIndex < prompts.length ? prompts[promptIndex].name : '')"
      :rpc="rpc"
      :isInVsCode="isInVsCode()"
      :isGeneric="isGeneric"
      @parentShowConsole="toggleConsole"
    />

    <v-row class="main-row ma-0 pa-0">
      <v-col class="left-col ma-0 pa-0" cols="3">
        <Navigation
          v-if="prompts.length"
          :promptIndex="promptIndex"
          :prompts="prompts"
          @onGotoStep="gotoStep"
        />
      </v-col>
      <v-col cols="9" class="right-col">
        <v-row class="prompts-col">
          <v-col>
            <Done
              v-if="isDone"
              :doneStatus="doneStatus"
              :doneMessage="doneMessage"
              :donePath="donePath"
            />

            <PromptInfo v-if="currentPrompt && !isDone" :currentPrompt="currentPrompt" />
            <v-slide-x-transition>
              <Form
                ref="form"
                :questions="currentPrompt ? currentPrompt.questions : []"
                @answered="onAnswered"
              />
            </v-slide-x-transition>
            <Info
              v-if="isNoGenerators"
              :infoMessage="messages ? messages.select_generator_not_found : ``"
              :infoUrl="'https://wwww.sap.com'"
            />
          </v-col>
        </v-row>
        <v-row v-if="prompts.length > 0 && !isDone && showButtons" style="height: 4rem; margin: 0;" sm="auto">
			<div v-if="toShowPromptMessage" :style="promptMessageStyle">{{promptMessageToDisplay}}</div>
			<div class="bottom-right-col" style="flex:1;"></div>
				<div class="diagonal"></div>
				<div class="bottom-buttons-col" style="display:flex;align-items: center;">
					<v-btn
						id="back"
						:disabled="promptIndex<1 || isReplaying"
						@click="back"
						v-show="promptIndex > 0"
							style="min-width:90px;"
						>
						<v-icon left>mdi-chevron-left</v-icon>Back
					</v-btn>
					<v-btn id="next" :disabled="!stepValidated" @click="next" style="min-width:90px;">
						{{nextButtonText}}
						<v-icon right v-if="nextButtonText !== `Finish`">mdi-chevron-right</v-icon>
					</v-btn>
			</div>
        </v-row>
      </v-col>
    </v-row>

    <!-- TODO Handle scroll of above content when console is visible. low priority because it is for localhost console only -->
    <v-card :class="consoleClass" v-show="showConsole">
      <v-footer absolute class="font-weight-medium" style="max-height: 300px; overflow-y: auto;">
        <v-col class cols="12">
          <div id="logArea" placeholder="No log entry">{{logText}}</div>
        </v-col>
      </v-footer>
    </v-card>
  </v-app>
</template>

<script>
import Vue from "vue";
import Loading from "vue-loading-overlay";
import Header from "./components/Header.vue";
import Navigation from "./components/Navigation.vue";
import Done from "./components/Done.vue";
import Info from "./components/Info.vue";
import PromptInfo from "./components/PromptInfo.vue";
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
import { RpcBrowserWebSockets } from "@sap-devx/webview-rpc/out.browser/rpc-browser-ws";
import * as _ from "lodash";
import FileBrowserPlugin from "@sap-devx/inquirer-gui-file-browser-plugin";
import FolderBrowserPlugin from "@sap-devx/inquirer-gui-folder-browser-plugin";
import LoginPlugin from "@sap-devx/inquirer-gui-login-plugin";
import TilesPlugin from "@sap-devx/inquirer-gui-tiles-plugin";

const FUNCTION = "__Function";
const PENDING = "pending";
const EVALUATING = "evaluating";
const INSTALLING = "Installing dependencies...";

function initialState() {
  return {
    generatorName: "",
    generatorPrettyName: "",
    stepValidated: false,
    prompts: [],
    promptIndex: 0,
    rpc: Object,
    resolve: Object,
    reject: Object,
    isDone: false,
    doneMessage: Object,
    doneStatus: false,
    consoleClass: "",
    logText: "",
    showConsole: false,
    messages: {},
    showBusyIndicator: false,
    promptsInfoToDisplay: [],
    isReplaying: false,
    numOfSteps: 1,
	isGeneric: false,
	isWriting: false,
	showButtons: true,
	promptMessageToDisplay: "",
	toShowPromptMessage: false,
	promptMessageStyle: ""
  };
}

export default {
  name: "app",
  components: {
    Header,
    Navigation,
    Done,
    Info,
    PromptInfo,
    Loading
  },
  data() {
    return initialState();
  },
  computed: {
    nextButtonText() {
		if (this.promptIndex > 0 && this.promptIndex === _.size(this.promptsInfoToDisplay) || this.isWriting) {
			return "Finish";
		} 

		return "Next";
	},
    isLoadingColor() {
      return (
        getComputedStyle(document.documentElement).getPropertyValue(
          "--vscode-progressBar-background"
        ) || "#0e70c0"
      );
    },
    headerTitle() {
      const titleSuffix = _.isEmpty(this.generatorPrettyName)
        ? ""
        : ` - ${this.generatorPrettyName}`;
      return `${this.messages.yeoman_ui_title}${titleSuffix}`;
    },
    currentPrompt() {
      return _.get(this.prompts, "[" + this.promptIndex + "]");
    },
    isNoGenerators() {
      const promptName = _.get(this.currentPrompt, "name");
      const message = _.get(this.messages, "select_generator_name", "");
      if (promptName && promptName === message) {
        const questions = _.compact(_.get(this.currentPrompt, "questions"));
        const generatorQuestion = _.find(questions, (question) => {
          return _.get(question, "name") === "generator";
        });
        return _.isEmpty(_.get(generatorQuestion, "choices"));
      }
      return false;
    },
  },
  watch: {
    prompts: {
      handler() {
        this.setBusyIndicator();
      }
    },
    "currentPrompt.status": {
      handler() {
        this.setBusyIndicator();
      }
    },
    isDone: {
      handler() {
        this.setBusyIndicator();
      }
    }
  },
  methods: {
	showPromptMessage(message, type) {
		this.promptMessageToDisplay = message;
		this.toShowPromptMessage = true;
		let promptMessageColor = "red";
		if (type === "error") {
			promptMessageColor = "red";
		} else if (type === "info") {
			promptMessageColor = "green";
		} else if (type === "warn") {
			promptMessageColor = "orange";
		}
		this.promptMessageStyle = `font-size: 12px;padding-left: 12px;color: ${promptMessageColor};`;
		// eslint-disable-next-line no-console
		console.error(type);
	},
    setBusyIndicator() {
      this.showBusyIndicator =
        _.isEmpty(this.prompts) ||
        (this.currentPrompt &&
          (this.currentPrompt.status === PENDING ||
            this.currentPrompt.status === EVALUATING) &&
          !this.isDone);
    },
    back() {
      this.gotoStep(1); // go 1 step back
    },
    gotoStep(numOfSteps) {
      // go numOfSteps step back
      try {
        this.isReplaying = true;
        this.numOfSteps = numOfSteps;
        const answers = this.currentPrompt.answers;
        if (this.promptIndex - numOfSteps > 0) {
          this.rpc.invoke("back", [answers, numOfSteps]);
        } else {
          this.reload();
        }
      } catch (error) {
        this.rpc.invoke("logError", [error]);
        this.reject(error);
      }
    },
    setGenInWriting(value) {
		this.isWriting = value;
		this.showButtons = !this.isWriting;
		if (this.currentPrompt) {
			this.currentPrompt.name = this.getInProgressStepName();
		}
	},
	getInProgressStepName() {
		return this.isWriting ? _.get(this.messages, "step_is_generating") : _.get(this.messages, "step_is_pending");
	},
    next() {
      if (this.resolve) {
        try {
          this.resolve(this.currentPrompt.answers);
        } catch (error) {
          this.rpc.invoke("logError", [error]);
          this.reject(error);
          return;
        }
      }
      if (this.promptIndex >= _.size(this.prompts) - 1) {
        const prompt = {
          questions: [],
          name: this.getInProgressStepName(),
          status: PENDING,
        };
        this.setPrompts([prompt]);
      }
      this.stepValidated = false;
      this.promptIndex++;
      this.prompts[this.promptIndex - 1].active = false;
      this.prompts[this.promptIndex].active = true;
    },
    onAnswered(answers, issues) {
      this.stepValidated = issues === undefined;
      const currentPrompt = this.currentPrompt;
      if (currentPrompt) {
        currentPrompt.answers = answers;
        if (currentPrompt.status === EVALUATING) {
          currentPrompt.status = undefined;
        }
      }
    },
    setPromptList(prompts) {
      let promptIndex = this.promptIndex;
      if (this.isReplaying) {
        // TODO: is 1st prompt always Generator Selection?
        this.prompts = [this.prompts[0]];
        promptIndex = 0;
      }
      prompts = prompts || [];
      this.promptsInfoToDisplay = _.cloneDeep(prompts);
      // replace all existing prompts except 1st (generator selction) and current prompt
      const startIndex = promptIndex + 1;
      const deleteCount = _.size(this.prompts) - promptIndex;
      const itemsToInsert = prompts.splice(promptIndex, _.size(prompts));
      this.prompts.splice(startIndex, deleteCount, ...itemsToInsert);
    },
    setPrompts(prompts) {
      const firstIncomingPrompt = _.get(prompts, "[0]");
      if (firstIncomingPrompt) {
        let startIndex = this.promptIndex;
        let deleteCount = prompts.length;
        if (!this.currentPrompt || firstIncomingPrompt.status === PENDING) {
          startIndex = this.promptIndex + 1;
          deleteCount = 0;
        }
        this.prompts.splice(startIndex, deleteCount, ...prompts);
      }
    },
    prepQuestions(questions) {
      if (this.currentPrompt) {
        this.currentPrompt.status = EVALUATING;
      }

      for (let question of questions) {
        for (let prop in question) {
          if (question[prop] === FUNCTION) {
            const that = this;
            question[prop] = async (...args) => {
              if (this.currentPrompt) {
                this.currentPrompt.status = EVALUATING;
              }

              try {
                return await that.rpc.invoke("evaluateMethod", [
                  args,
                  question.name,
                  prop
                ]);
              } catch (e) {
                that.showBusyIndicator = false;
                throw e;
              }
            };
          }
        }
      }

      if (this.currentPrompt) {
        this.currentPrompt.status = undefined;
      }
    },

    async updateGeneratorsPrompt(questions) {
      const generatorsPrompt = _.get(this.prompts, "[0]");
      if (generatorsPrompt) {
        generatorsPrompt.questions = questions;
      }
	},

    async showPrompt(questions, name) {
		this.prepQuestions(questions);
		if (this.isReplaying) {
			this.promptIndex -= this.numOfSteps;
			this.isReplaying = false;
		}
		const prompt = this.createPrompt(questions, name);
		this.setPrompts([prompt]);
		if (this.isWriting) {
			this.showButtons = true;
		}
		const promise = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});

		promise.then(() => {
			if (this.isWriting) {
				this.showButtons = false;
			}
		});

		return promise;
    },
    createPrompt(questions, name) {
      let promptDescription = "";
      let promptName = name;
      if (name === "select_generator") {
        promptDescription = this.messages.select_generator_description;
        promptName = this.messages.select_generator_name;
      } else {
        const promptToDisplay = _.get(
          this.promptsInfoToDisplay,
          "[" + (this.promptIndex - 1) + "]"
        );
        promptDescription = _.get(promptToDisplay, "description", "");
        promptName = _.get(promptToDisplay, "name", name);
      }

      const prompt = Vue.observable({
        questions: questions,
        name: promptName,
        description: promptDescription,
        answers: {},
        active: true,
        status: _.get(this.currentPrompt, "status")
      });
      return prompt;
    },
    log(log) {
      this.logText += log;
      return true;
    },
    generatorInstall() {
      this.currentPrompt.name = "Installing";
      this.doneMessage = INSTALLING;
      this.donePath = "";
      this.doneStatus = true;
      this.isDone = true;
    },
    generatorDone(succeeded, message, targetPath) {
      this.currentPrompt.name = "Summary";
      this.doneMessage = message;
      this.donePath = targetPath;
      this.doneStatus = succeeded;
      this.isDone = true;
    },
    runGenerator(generatorName) {
      this.rpc.invoke("runGenerator", [generatorName]);
    },
    isInVsCode() {
      return typeof acquireVsCodeApi !== "undefined";
    },
    getVsCodeApi() {
      if (this.isInVsCode()) {
        if (!window.vscode) {
          // eslint-disable-next-line
          window.vscode = acquireVsCodeApi();
        }

        return window.vscode;
      }
    },
    setupRpc() {
      /* istanbul ignore if */
      if (this.isInVsCode()) {
        this.rpc = new RpcBrowser(window, this.getVsCodeApi());
        this.initRpc();
      } else {
        const ws = new WebSocket("ws://127.0.0.1:8081");
        /* istanbul ignore next */
        ws.onopen = () => {
          this.rpc = new RpcBrowserWebSockets(ws);
          this.initRpc();
        };
      }
    },
    initRpc() {
      const functions = [
        "showPrompt",
        "setPromptList",
        "generatorInstall",
        "generatorDone",
        "log",
        "updateGeneratorsPrompt",
		"setGenInWriting",
		"showPromptMessage"
      ];
      _.forEach(functions, (funcName) => {
        this.rpc.registerMethod({
          func: this[funcName],
          thisArg: this,
          name: funcName
        });
      });

      this.displayGeneratorsPrompt();
    },
    async setMessagesAndSaveState() {
		const uiOptions = await this.rpc.invoke("getState");
		this.messages = uiOptions.messages;
		this.isGeneric = _.get(this.messages, "panel_title") === "Yeoman UI";
		const vscodeApi = this.getVsCodeApi();
		if (vscodeApi) {
			vscodeApi.setState(uiOptions);
		}
    },
    async displayGeneratorsPrompt() {
      await this.setMessagesAndSaveState();
      await this.rpc.invoke("receiveIsWebviewReady", []);
    },
    toggleConsole() {
      this.showConsole = !this.showConsole;
    },
    registerPlugin(plugin) {
      const options = {};
      Vue.use(plugin, options);
      if (options.plugin) {
        const registerPluginFunc = _.get(this.$refs, "form.registerPlugin");
        registerPluginFunc(options.plugin);
      }
    },
    init() {
      // register custom inquirer-gui plugins
      this.registerPlugin(FileBrowserPlugin);
      this.registerPlugin(FolderBrowserPlugin);
      this.registerPlugin(LoginPlugin);
      this.registerPlugin(TilesPlugin);

      this.isInVsCode()
        ? (this.consoleClass = "consoleClassHidden")
        : (this.consoleClass = "consoleClassVisible");
    },
    reload() {
      const dataObj = initialState();
      dataObj.rpc = this.rpc;
      Object.assign(this.$data, dataObj);
      this.init();

      this.displayGeneratorsPrompt();
    }
  },
  created() {
    this.setupRpc();
  },
  mounted() {
    this.init();
  }
};
</script>
<style scoped>
@import "./../node_modules/vue-loading-overlay/dist/vue-loading.css";
.consoleClassVisible {
  visibility: visible;
}
.consoleClassHidden {
  visibility: hidden;
}
div.consoleClassVisible .v-footer {
  background-color: var(--vscode-editor-background, #1e1e1e);
  color: var(--vscode-foreground, #cccccc);
}
#logArea {
  font-family: monospace;
  word-wrap: break-word;
  white-space: pre-wrap;
}
.left-col {
  background-color: var(--vscode-editorWidget-background, #252526);
}
.prompts-col {
  overflow-y: auto;
  margin: 0px;
}
.main-row,
.prompts-col {
  height: calc(100% - 4rem);
}
.left-col,
.right-col,
.right-row,
#step-component-div,
#QuestionTypeSelector,
#QuestionTypeSelector > .col,
#QuestionTypeSelector > .col > div {
  height: 100%;
}
.right-col {
  padding: 0 !important;
}
.diagonal {
  width: 80px;
  background: linear-gradient(
    120deg,
    var(--vscode-editor-background, #1e1e1e) 0%,
    var(--vscode-editor-background, #1e1e1e) 50%,
    transparent 50%
  );
  background-color: var(--vscode-editorWidget-background, #252526);
}
.bottom-right-col {
  background: var(--vscode-editor-background, #1e1e1e);
  overflow: hidden;
  margin: 0px;
}
.bottom-buttons-col {
  background-color: var(--vscode-editorWidget-background, #252526);
  padding-right: 25px;
}
.bottom-buttons-col > .v-btn:not(:last-child) {
  margin-right: 10px !important;
}
</style>
