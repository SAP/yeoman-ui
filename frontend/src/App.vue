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
      :stepName="prompts[promptIndex].name"
      :rpc="rpc"
      :isInVsCode="isInVsCode()"
      @parentShowConsole="toggleConsole"
      @parentReload="reload"
    />
    <v-row class="main-row ma-0 pa-0">
      <v-col class="left-col ma-0 pa-0" cols="3">
        <Navigation v-if="prompts.length" :promptIndex="promptIndex" :prompts="prompts" />
      </v-col>
      <v-col cols="9" class="right-col">
        <v-col class="prompts-col" cols="12">
          <Done
            v-if="isDone"
            :doneStatus="doneStatus"
            :doneMessage="doneMessage"
            :donePath="donePath"
          />
          <PromptInfo v-if="currentPrompt && !isDone" :currentPrompt="currentPrompt" />
          <GeneratorSelection
            v-if="shouldShowGeneratorSelection()"
            @generatorSelected="selectGenerator"
            :currentQuestion="currentPrompt.questions[0]"
          />
          <v-slide-x-transition>
            <Form
              ref="form"
              :questions="currentPrompt ? currentPrompt.questions : []"
              v-show="!shouldShowGeneratorSelection()"
              @answered="onAnswered"
            />
          </v-slide-x-transition>
        </v-col>
        <v-col
          v-if="prompts.length > 0 && !isDone"
          class="bottom-right-col"
          style="height: 4rem;"
          offset-xl="9"
          offset-lg="9"
          offset-md="9"
          offset-sm="8"
          offset-xs="8"
          xl="3"
          lg="3"
          md="3"
          sm="4"
          xs="4"
        >
          <v-row class="progress-buttons-row" align="center" justify="end">
            <v-btn :disabled="!stepValidated" @click="next">
              Next<v-icon right>mdi-chevron-right</v-icon>
            </v-btn>
          </v-row>
        </v-col>
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
import GeneratorSelection from "./components/GeneratorSelection.vue";
import Done from "./components/Done.vue";
import PromptInfo from "./components/PromptInfo.vue";
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
import { RpcBrowserWebSockets } from "@sap-devx/webview-rpc/out.browser/rpc-browser-ws";
import * as _ from "lodash";
import RemoteFileBrowserPlugin from "@sap-devx/inquirer-gui-remote-file-browser-plugin";
import LoginPlugin from "@sap-devx/inquirer-gui-login-plugin";

const FUNCTION = "__Function";
const PENDING = "pending";
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
    transitionToggle: false,
    promptsInfoToDisplay: []
  };
}

export default {
  name: "app",
  components: {
    Header,
    Navigation,
    GeneratorSelection,
    Done,
    PromptInfo,
    Loading
  },
  data() {
    return initialState();
  },
  computed: {
    isLoadingColor() {
      return (
        getComputedStyle(document.documentElement).getPropertyValue(
          "--vscode-progressBar-background"
        ) || "#0e70c0"
      );
    },
    headerTitle() {
      const titleSuffix = _.isEmpty(this.generatorPrettyName) ? "" : ` - ${this.generatorPrettyName}`;
      return `${this.messages.yeoman_ui_title}${titleSuffix}`;
    },
    currentPrompt() {
      const prompt = _.get(this.prompts, "[" + this.promptIndex + "]");

      const answers = _.get(prompt, "answers", {});
      const questions = _.get(prompt, "questions", []);
      _.forEach(questions, question => {
        _.set(
          answers,
          [question.name],
          question.isWhen === false ? undefined : question.answer
        );
      });
      _.set(prompt, "answers", answers);

      return prompt;
    }
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
    shouldShowGeneratorSelection() {
      return this.currentPrompt && 
        this.currentPrompt.questions &&
        this.currentPrompt.questions[0] &&
        this.currentPrompt.questions[0].type==='generators';
    },
    setBusyIndicator() {
      this.showBusyIndicator =
        _.isEmpty(this.prompts) ||
        (this.currentPrompt.status === PENDING && !this.isDone);
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
          name: this.messages.step_is_pending,
          status: PENDING
        };
        this.setPrompts([prompt]);
      }
      this.stepValidated = false;
      this.promptIndex++;
      this.prompts[this.promptIndex - 1].active = false;
      this.prompts[this.promptIndex].active = true;
      this.transitionToggle = !this.transitionToggle;
    },
    selectGenerator(generatorName, generatorPrettyName) {
      this.stepValidated = true;
      const currentPrompt = this.currentPrompt;
      if (currentPrompt) {
        currentPrompt.answers.name = generatorName;
      }
      this.generatorName = generatorName;
      this.generatorPrettyName = generatorPrettyName;
    },
    onAnswered(answers, issues) {
      this.stepValidated = issues === undefined;
      const currentPrompt = this.currentPrompt;
      if (currentPrompt) {
        currentPrompt.answers = answers;
      }
    },
    setMessages(messages) {
      this.messages = messages;
    },
    setPromptList(prompts) {
      prompts = prompts || [];
      this.promptsInfoToDisplay = _.cloneDeep(prompts);
      // replace all existing prompts except 1st (generator selction) and current prompt
      const startIndex = this.promptIndex + 1;
      const deleteCount = _.size(this.prompts) - this.promptIndex;
      const itemsToInsert = prompts.splice(this.promptIndex, _.size(prompts));
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
      for (let question of questions) {
        for (let prop in question) {
          if (question[prop] === FUNCTION) {
            var that = this;
            question[prop] = async (...args) => {
              let showBusy = true;
              setTimeout(() => {
                if (showBusy) {
                  that.showBusyIndicator = true;
                }
              }, 1000);

              try {
                const response = await that.rpc.invoke("evaluateMethod", [
                  args,
                  question.name,
                  prop
                ]);
                showBusy = false;
                that.showBusyIndicator = false;

                return response;
              } catch(e) {
                showBusy = false;
                that.showBusyIndicator = false;
                throw(e);
              }
            };
          }
        }
      }
    },

    async showPrompt(questions, name) {
      this.prepQuestions(questions);
      const prompt = this.createPrompt(questions, name);
      this.setPrompts([prompt]);

      const promise = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
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
        const promptToDisplay = _.get(this.promptsInfoToDisplay, "[" + (this.promptIndex - 1) +"]");
        promptDescription = _.get(promptToDisplay, "description", "");
        promptName = _.get(promptToDisplay, "name", name);
      }

      const prompt = Vue.observable({
        questions: questions,
        name: promptName,
        description: promptDescription,
        answers: {},
        active: true
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
    setupRpc() {
      /* istanbul ignore if */
      if (this.isInVsCode()) {
        // eslint-disable-next-line
        window.vscode = acquireVsCodeApi();
        this.rpc = new RpcBrowser(window, window.vscode);
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
        "setPrompts",
        "setPromptList",
        "generatorInstall",
        "generatorDone",
        "log",
        "setMessages"
      ];
      _.forEach(functions, funcName => {
        this.rpc.registerMethod({
          func: this[funcName],
          thisArg: this,
          name: funcName
        });
      });

      this.rpc.invoke("receiveIsWebviewReady", []);
    },
    toggleConsole() {
      this.showConsole = !this.showConsole;
    },
    init() {
      // register custom inquirer-gui plugins
      let options = {};
      Vue.use(RemoteFileBrowserPlugin, options);
      if (options.plugin) {
        this.$refs.form.registerPlugin(options.plugin);
      }

      options = {};
      Vue.use(LoginPlugin, options);
      if (options.plugin) {
        this.$refs.form.registerPlugin(options.plugin);
      }

      this.isInVsCode()
        ? (this.consoleClass = "consoleClassHidden")
        : (this.consoleClass = "consoleClassVisible");
    },
    reload() {
      const dataObj = initialState();
      dataObj.rpc = this.rpc;
      dataObj.messages = this.messages;
      Object.assign(this.$data, dataObj);
      this.init();
      this.rpc.invoke("receiveIsWebviewReady", []);
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
  overflow-y: scroll;
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
.bottom-right-col {
  background: var(--vscode-editorWidget-background, #252526);
  position: relative;
  overflow: hidden;
}
.bottom-right-col:before {
  height: 100%;
  width: 100%;
  background-color: var(--vscode-editor-background, #1e1e1e);
  position: absolute;
  content: "";
  transform: rotate(-60deg);
  transform-origin: bottom left;
}
div.bottom-right-col .progress-buttons-row {
  padding-right: 24px;
  padding-top: 4px;
}

</style>
