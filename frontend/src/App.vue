<template>
  <v-app id="app" class="vld-parent">
    <loading :active.sync="showBusyIndicator"
             :is-full-page="true"
             :height="128"
             :width="128"
             :color="isLoadingColor"
             loader="dots">
    </loading>

    <Header
      v-if="prompts.length"
      :selectedGeneratorHeader="selectedGeneratorHeader"
      :stepName="prompts[promptIndex].name"
      :rpc="rpc"
      @parentShowConsole="toggleConsole"
    />
    <v-row class="main-row m-0 p-0">
      <v-col class="left-col m-0 p-0" lg="3" sm="auto">
        <Navigation v-if="prompts.length" :promptIndex="promptIndex" :prompts="prompts" />
      </v-col>
      <v-col class="right-col">
        <!-- <v-row class="right-row"> -->
        <v-col class="prompts-col" lg="12">
          <Done
            v-if="isDone"
            :doneMessage="doneMessage"
            :donePath="donePath"
            :isInVsCode="isInVsCode()"
          />
          <Step
            v-if="prompts.length"
            ref="step"
            :currentPrompt="currentPrompt"
            @generatorSelected="onGeneratorSelected"
            @stepvalidated="onStepValidated"
          />
        </v-col>
          <v-col v-if="prompts.length > 0 && !isDone" class="bottom-right-col" style="height: 4rem;" offset-lg="9" lg="3">
            <v-row  class="progress-buttons-row" align="center" justify="end">
              <v-btn :disabled="!stepValidated" @click="next">Next ></v-btn>
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
import Vue from "vue"
import Loading from 'vue-loading-overlay';
import Header from "./components/Header.vue"
import Navigation from "./components/Navigation.vue"
import Step from "./components/Step.vue"
import Done from "./components/Done.vue"
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
import { RpcBrowserWebSockets } from "@sap-devx/webview-rpc/out.browser/rpc-browser-ws";
import * as _ from "lodash";

const FUNCTION = "__Function"
const LOADING = "loading..."
const PENDING = 'pending'

export default {
  name: "app",
  components: {
    Header,
    Navigation,
    Step,
    Done,
    Loading
  },
  data() {
    return {
      generatorName: "",
      stepValidated: false,
      prompts: [],
      promptIndex: 0,
      index: 0,
      rpc: Object,
      resolve: Object,
      reject: Object,
      isDone: false,
      doneMessage: Object,
      consoleClass: "",
      logText: "",
      showConsole: false,
      messages: {},
      showBusyIndicator: false
    };
  },
  computed: {
    isLoadingColor() {
      return getComputedStyle(document.documentElement).getPropertyValue("--vscode-progressBar-background") || "#0e70c0"
    },
    selectedGeneratorHeader() {
      return this.messages.selected_generator + this.generatorName;
    },
    currentPrompt() {
      return _.get(this.prompts, "[" + this.promptIndex +"]")
    },
    currentPromptAnswers() {
      const answers = _.get(this.currentPrompt, "answers", {})
      const questions = _.get(this.currentPrompt, "questions", [])
      for(const question of questions) {
        _.set(answers, [question.name], (question.isWhen === false ? undefined : question.answer))
      }
      return answers
    },
    clonedAnswers() {
      return _.cloneDeep(this.currentPromptAnswers)
    }
  },
  watch: {
    "prompts": {
      handler(promptsVal) {
        this.setBusyIndicator(_.isEmpty(promptsVal))
      }
    },
    "currentPrompt.status": {
      handler(statusVal) {
        this.setBusyIndicator(statusVal === PENDING && !this.isDone)
      }
    },
    "isDone": {
      handler(isDoneVal) {
        this.setBusyIndicator(this.currentPrompt.status === PENDING && !isDoneVal)
      }
    },
    "clonedAnswers": {
      deep: true,
      async handler(newAnswers, oldAnswers) {
        // TODO: consider using debounce (especially for questions of type 'input') to limit roundtrips
        if (!_.isEmpty(newAnswers)) {
          const questions = _.get(this, "currentPrompt.questions", []);
          
          const questionWithNewAnswer = _.find(questions, question => {
            const oldAnswer = _.get(oldAnswers, [question.name])
            const newAnswer = _.get(newAnswers, [question.name])
            return !_.isEqual(newAnswer, oldAnswer)
          })

          let relevantQuestionsToUpdate = questions // go esover all questions for the first time
          if (questionWithNewAnswer) {
            const indexOfQuestionWithNewAnswer = _.indexOf(questions, questionWithNewAnswer)
            relevantQuestionsToUpdate = questions.slice(indexOfQuestionWithNewAnswer)
          } 
          
          let showBusy = true
          const that = this
          const finished = relevantQuestionsToUpdate.reduce((p, question) => {
            return p.then(() => that.updateQuestion(question, newAnswers))
          }, Promise.resolve()); // initial

          setTimeout(() => {
            if (showBusy) {
              that.showBusyIndicator = true
            }
          }, 1000)

          await finished
          showBusy = false
          this.showBusyIndicator = false
        }
      }
    }
  },
  methods: {
    setBusyIndicator(showBusyIndicator) {
      this.showBusyIndicator = showBusyIndicator
    },
    async updateQuestion(question, newAnswers) {
      if (question.when === FUNCTION) {
        question.isWhen = await this.rpc.invoke("evaluateMethod", [[newAnswers], question.name, "when"])
      }

      if (question.isWhen === true) {
        if (question.filter === FUNCTION) {
          question.answer = await this.rpc.invoke("evaluateMethod", [[question.answer], question.name, "filter"])
        }
        if (question._default === FUNCTION) {
          question.default = await this.rpc.invoke("evaluateMethod", [[newAnswers], question.name, "default"])
          if (question.answer === undefined) {
            question.answer = question.default
          }
        }
        if (question._message === FUNCTION) {
          question.message = await this.rpc.invoke("evaluateMethod", [[newAnswers], question.name, "message"])
        }
        if (question._choices === FUNCTION) {
          question.choices = await this.rpc.invoke("evaluateMethod", [[newAnswers], question.name, "choices"])
        }
        if (question.validate === FUNCTION) {
          const response = await this.rpc.invoke("evaluateMethod", [[question.answer, newAnswers], question.name, "validate"])
          question.isValid = (_.isString(response) ? false : response)
          question.validationMessage = (_.isString(response) ? response : undefined)
        }
      }
    },
    next() {
      if (this.resolve) {
        try {
          this.resolve(this.clonedAnswers);
        } catch (e) {
          this.reject(e);
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
      this.promptIndex++;
      this.prompts[this.promptIndex - 1].active = false;
      this.prompts[this.promptIndex].active = true;
    },
    onGeneratorSelected(generatorName) {
      this.generatorName = generatorName;
    },
    onStepValidated(stepValidated) {
      this.stepValidated = stepValidated;
    },
    setMessages(messages) {
      this.messages = messages;
    },
    setPrompts(prompts) {
      // TODO:
      //   if prompt name is provided, find an existing prompt based on key or name:
      //     if found then update it
      //     if not found then create a prompt
      //   if no prompt name is provided, assign incoming question to current prompt
      const currentPrompt = this.currentPrompt;
      if (prompts) {
        _.forEach(prompts, (prompt, index) => {
          if (index === 0) {
            if (prompt.status === PENDING) {
              // new pending prompt
              this.prompts.push(prompt);
            } else {
              if (currentPrompt) {
                currentPrompt.questions = prompt.questions;
                if (
                  prompt.name &&
                  currentPrompt.name === this.messages.step_is_pending
                ) {
                  currentPrompt.name = prompt.name;
                }
                // if questions are provided, remote the pending status
                if (prompt.questions.length > 0) {
                  delete currentPrompt.status;
                }
              } else {
                // first prompt (Select Generator)
                prompt.active = true;
                this.prompts.push(prompt);
              }
            }
          } else {
            // multiple prompts provided -- simply add them
            this.prompts.push(prompt);
          }
        });
      }
    },
    setQuestionProps(prompt) {
      const questions = _.get(prompt, "questions", [])
      for(const question of questions) {
        if (question.default === FUNCTION) {
          question.default = undefined;
          this.$set(question, "_default", FUNCTION);
        }
        if (question.message === FUNCTION) {
          question.message = LOADING;
          this.$set(question, "_message", FUNCTION);
        }
        if (question.choices === FUNCTION) {
          question.choices = [LOADING];
          this.$set(question, "_choices", FUNCTION);
        }

        let answer = question.default;
        if (question.default === undefined && question.type !== "confirm") {
          answer = "";
        }
        this.$set(question, "answer", answer)
        this.$set(question, "isValid", true)
        this.$set(question, "validationMessage", true)

        this.$set(question, "isWhen", question.when !== FUNCTION)
      }
    },
    showPrompt(questions, name) {
      const prompt = this.createPrompt(questions, name);
      // evaluate message property on server if it is a function
      this.setPrompts([prompt]);
      const promise = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
      return promise;
    },
    createPrompt(questions, name) {
      name =
        name === "select_generator" ? this.messages.select_generator : name;
      const prompt = Vue.observable({
        questions: questions,
        name: name,
        answers: {},
        active: true
      });
      this.setQuestionProps(prompt);
      return prompt;
    },
    log(log) {
      this.logText += log;
      return true;
    },
    generatorDone(success, message, targetPath) {
      if (this.currentPrompt.status === "pending") {
        this.currentPrompt.name = "Confirmation";
      }
      this.doneMessage = message;
      this.donePath = targetPath;
      this.isDone = true;
      // TODO: remove return value once this change is published to npm: https://github.com/SAP/vscode-webview-rpc-lib/pull/5
      return true;
    },
    runGenerator(generatorName) {
      this.rpc.invoke("runGenerator", [generatorName]);
    },
    isInVsCode() {
      return typeof acquireVsCodeApi !== "undefined";
    },
    setupRpc() {
      if (this.isInVsCode()) {
        // eslint-disable-next-line
        window.vscode = acquireVsCodeApi();
        this.rpc = new RpcBrowser(window, window.vscode);
        this.initRpc();
      } else {
        const ws = new WebSocket("ws://127.0.0.1:8081");
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
    }
  },
  mounted() {
    this.setupRpc();
    //todo: add validate support
    this.yeomanName = "<no generator selected>";
    this.prompts = [];
    this.isInVsCode()
      ? (this.consoleClass = "consoleClassHidden")
      : (this.consoleClass = "consoleClassVisible");
  }
};
</script>

<style>
@import './../node_modules/vue-loading-overlay/dist/vue-loading.css';
#app {
  height: 100%;
  color: var(--vscode-foreground, #cccccc);
  background-color: var(--vscode-editor-background, #1e1e1e);
  font-family: var(--vscode-font-family);
  font-weight: var(--vscode-font-weight);
  font-size: var(--vscode-font-size);
}
.yeoman-ui *:focus {
  outline-color: transparent;
}
div.v-application .primary {
  background-color: var(--vscode-editorCodeLens-foreground, #898989) !important;
}
html,
body {
  height: 100%;
  background-color: var(--vscode-editor-background, #1e1e1e);
}
v-container {
  margin: 0px;
  padding: 0px;
}
v-row {
  margin: 0px;
}
.theme--light {
  color: var(--vscode-foreground, #cccccc) !important;
}
.loading {
  color: var(--vscode-foreground, white);
  margin: 1.5rem;
  font-size: 1.5rem;
}
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
  background-color: var(--vscode-menu-background, #252426);
}
.prompts-col {
  overflow-y: scroll;
  padding-right: 30px !important;
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

div.bottom-right-col 
  .theme--light.v-btn:not(.v-btn--flat):not(.v-btn--text):not(.v-btn--outlined) {
  background-color: var(--vscode-button-background, #0e639c);
  border-color: var(--vscode-button-background, #0e639c);
  color: #cccccc !important;
  border-radius: 0px;
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  width: 7rem;
  height: 2rem;
}
div.bottom-right-col
  .theme--light.v-btn:not(.v-btn--flat):not(.v-btn--text):not(.v-btn--outlined):hover {
  background-color: var(--vscode-button-hoverBackground, #1177bb);
  border-color: var(--vscode-button-hoverBackground, #1177bb);
}
div.bottom-right-col .progress-buttons-row  {
  padding-right: 15px;
  padding-top:4px;
}
</style>
