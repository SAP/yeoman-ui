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
      :selectedGeneratorHeader="selectedGeneratorHeader"
      :stepName="prompts[promptIndex].name"
      :rpc="rpc"
      :isInVsCode="isInVsCode()"
    />
    <v-row class="main-row ma-0 pa-0">
      <v-col class="left-col ma-0 pa-0" cols="3">
        <Navigation v-if="prompts.length" :promptIndex="promptIndex" :prompts="prompts" />
      </v-col>
      <v-col cols="9" class="right-col">
        <v-col class="prompts-col" cols="12">
          <Done
            v-if="isDone"
            :doneMessage="doneMessage"
            :donePath="donePath"
          />
          <v-slide-x-transition v-else-if="prompts.length">
            <Step
              :key="transitionToggle"
              ref="step"
              :currentPrompt="currentPrompt"
              :selectGenerator="selectGenerator"
              @stepvalidated="onStepValidated"
              :updateQuestionsFromIndex="updateQuestionsFromIndex"
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
import Vue from "vue";
import Loading from "vue-loading-overlay";
import Header from "./components/Header.vue";
import Navigation from "./components/Navigation.vue";
import Step from "./components/Step.vue";
import Done from "./components/Done.vue";
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
import { RpcBrowserWebSockets } from "@sap-devx/webview-rpc/out.browser/rpc-browser-ws";
import * as _ from "lodash";

const FUNCTION = "__Function";
const LOADING = "loading...";
const PENDING = "pending";
const INSTALLING = "Installing dependencies...";

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
      generatorPrettyName: "",
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
      showBusyIndicator: false,
      transitionToggle: false
    };
  },
  computed: {
    isLoadingColor() {
      return (
        getComputedStyle(document.documentElement).getPropertyValue(
          "--vscode-progressBar-background"
        ) || "#0e70c0"
      );
    },
    selectedGeneratorHeader() {
      return this.generatorName ? this.messages.selected_generator + this.generatorPrettyName : "";
    },
    currentPrompt() {
      const prompt = _.get(this.prompts, "[" + this.promptIndex +"]")
      
      const answers = _.get(prompt, "answers", {})
      const questions = _.get(prompt, "questions", [])
      _.forEach(questions, question => {
        _.set(answers, [question.name], (question.isWhen === false ? undefined : question.answer))
      })
      _.set(prompt, "answers", answers)
      
      return prompt
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
    async updateQuestionsFromIndex(questionIndex) {
      const questions = _.get(this, "currentPrompt.questions", []);
      const relevantQuestionsToUpdate = _.slice(questions, questionIndex)
      
      let showBusy = true
      const finished = relevantQuestionsToUpdate.reduce((p, question) => {
        return p.then(() => this.updateQuestion(question)).catch(error => {
          // eslint-disable-next-line no-console
          console.error(error);
        });
      }, Promise.resolve()); 

      const that = this;
      setTimeout(() => {
        if (showBusy) {
          that.showBusyIndicator = true;
        }
      }, 1000)

      await finished
      showBusy = false
      this.showBusyIndicator = false;
    },
    setBusyIndicator() {
      this.showBusyIndicator =
        _.isEmpty(this.prompts) ||
        (this.currentPrompt.status === PENDING && !this.isDone);
    },
    async updateQuestion(question) {
      const newAnswers = this.currentPrompt.answers
      if (question.when === FUNCTION) {
        question.isWhen = await this.rpc.invoke("evaluateMethod", [
          [newAnswers],
          question.name,
          "when"
        ]);
      }

      if (question.isWhen === true) {
        if (question.filter === FUNCTION) {
          question.answer = await this.rpc.invoke("evaluateMethod", [
            [question.answer],
            question.name,
            "filter"
          ]);
        }
        if (question._default === FUNCTION) {
          question.default = await this.rpc.invoke("evaluateMethod", [
            [newAnswers],
            question.name,
            "default"
          ]);
          if (question.answer === undefined) {
            question.answer = question.default;
          }
        }
        if (question._message === FUNCTION) {
          question.message = await this.rpc.invoke("evaluateMethod", [
            [newAnswers],
            question.name,
            "message"
          ]);
        }
        if (question._choices === FUNCTION) {
          question.choices = await this.rpc.invoke("evaluateMethod", [
            [newAnswers],
            question.name,
            "choices"
          ]);
        }
        if (question.validate === FUNCTION) {
          const response = await this.rpc.invoke("evaluateMethod", [
            [question.answer, newAnswers],
            question.name,
            "validate"
          ]);
          question.isValid = _.isString(response) ? false : response;
          question.validationMessage = _.isString(response) ? response : undefined;
        }
      }
    },
    next() {
      if (this.resolve) {
        try {
          this.resolve(this.currentPrompt.answers);
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
      this.transitionToggle = !this.transitionToggle;
    },
    selectGenerator(generatorName, generatorPrettyName) {
      this.generatorName = generatorName;
      this.generatorPrettyName = generatorPrettyName;
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
                if (prompt.name && currentPrompt.name === this.messages.step_is_pending) {
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
      const questions = _.get(prompt, "questions", []);
      for (const question of questions) {
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
        this.$set(question, "answer", answer);
        this.$set(question, "isValid", true);
        this.$set(question, "validationMessage", true);
        this.$set(question, "isWhen", question.when !== FUNCTION);
      }
    },
    async showPrompt(questions, name) {
      const prompt = this.createPrompt(questions, name);
      // evaluate message property on server if it is a function
      this.setPrompts([prompt]);
      await this.updateQuestionsFromIndex(0);
      const promise =  new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
      
      return promise;
    },
    createPrompt(questions, name) {
      name = (name === "select_generator" ? this.messages.select_generator : name)
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
    generatorInstall() {
      if (this.isInVsCode()) {
        window.vscode.postMessage({
          command: "showInfoMessage",
          commandParams: [INSTALLING]
        });
      }
    },
    generatorDone(success, message, targetPath) {
      if (this.currentPrompt.status === PENDING) {
        this.currentPrompt.name = "Summary";
      }
      this.doneMessage = message;
      this.donePath = targetPath;
      this.isDone = true;
      if (this.isInVsCode()) {
        window.vscode.postMessage({
          command: "showDoneMessage",
          commandParams: [this.donePath]
        });
      }
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
