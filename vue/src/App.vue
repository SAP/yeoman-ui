<template>
  <div id="app" class="d-flex flex-column">
    <div v-if="!prompts.length" class="loading">Yowiz is loading...</div>

    <Header
      v-if="prompts.length"
      :currentPrompt="promptIndex+1"
      :numOfSteps="prompts.length"
      :generatorName="generatorName"
      :stepName="prompts[promptIndex].name"
      :rpc="rpc"
    />
    <b-container class="content mb-auto p-0 mx-1 mt-10">
      <b-row class="m-0 p-0">
        <b-col class="m-0 p-0" sm="auto">
          <b-container class="m-0 p-0">
            <Navigation v-if="prompts.length" :promptIndex="promptIndex" :prompts="prompts" />
          </b-container>
        </b-col>
        <b-col class="m-0 p-0">
          <b-container>
            <div v-if="isDone" class="loading">{{doneMessage}}</div>
            <Step
              v-if="prompts.length"
              ref="step"
              :currentPrompt="currentPrompt"
              @generatorSelected="onGeneratorSelected"
              @stepvalidated="onStepValidated"
            />
            <div class="navigation" v-if="prompts.length > 0 && !isDone" >
              <b-button class="mr-2 btn" :disabled="!stepValidated" @click="next">Next</b-button>
            </div>
          </b-container>
        </b-col>
      </b-row>
    </b-container>
    <div>
      <div :class="consoleClass">
        <b-collapse id="showLogId" style="height: 100px; overflow-y: auto;" class="mt-auto">
          <hr />
          <div id="logArea" placeholder="No log entry">{{logText}}</div>
        </b-collapse>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import Header from "./components/Header.vue";
import Navigation from "./components/Navigation.vue";
import Step from "./components/Step.vue";
import { RpcBrowser } from "./rpc/rpc-browser.js";
import { RpcBrowserWebSockets } from "./rpc/rpc-browser-ws.js";
import * as _ from "lodash";
export default {
  name: "app",
  components: {
    Header,
    Navigation,
    Step
  },
  data() {
    return {
      generatorName: "<none>",
      stepValidated:false,
      prompts: [],
      promptIndex: 0,
      index: 0,
      rpc: Object,
      resolve: Object,
      reject: Object,
      isDone: false,
      doneMessage: Object,
      consoleClass: "",
      logText: ""
    };
  },
  computed: {
    currentPrompt: function() {
      const response = this.prompts[this.promptIndex];
      if (response) {
        const answers = _.get(response, "answers", {});
        response.questions.forEach(value => {
          answers[value.name] = !_.has(value, "isWhen") ? value.answer : value.isWhen === true ? value.answer : undefined;
        });
        response.answers = answers;
      }
      return response;
    }
  },
  watch: {
    "currentPrompt.answers": {
      deep: true,
      immediate: true,
      handler() {
        if (this.currentPrompt) {
          // TODO: consider using debounce (especially for questions of type 'input') to limit roundtrips
          _.forEach(this.currentPrompt.questions, question => {
            if (question.default === "__Function") {
              this.rpc.invoke("evaluateMethod", [[this.currentPrompt.answers], question.name, "default"]).then(response => {
                question.answer = response;
              });
            }
            if (question.when === "__Function") {
              this.rpc.invoke("evaluateMethod", [[this.currentPrompt.answers], question.name, "when"]).then(response => {
                question.isWhen = response;
              });
            }
            if (question._message === "__Function") {
              this.rpc.invoke("evaluateMethod", [[this.currentPrompt.answers], question.name, "message"]).then(response => {
                question.message = response;
              });
            }
            if (question._choices === "__Function") {
              this.rpc.invoke("evaluateMethod", [[this.currentPrompt.answers], question.name, "choices"]).then(response => {
                question.choices = response;
              });
            }
            if (question.filter === "__Function") {
              this.rpc.invoke("evaluateMethod", [[question.answer], question.name, "filter"]).then(response => {
                question.answer = response;
              });
            }
            if (question.validate === "__Function") {
              this.rpc.invoke("evaluateMethod", [[question.answer, this.currentPrompt.answers], question.name, "validate"]).then(response => {
                question.isValid = (typeof response === 'string' ? false : response);
                question.validationMessage = (typeof response === 'string' ? response : undefined);
              });
            }
          });
        }
      }
    }
  },
  methods: {
    next() {
      if (this.resolve) {
        try {
          this.resolve(this.currentPrompt.answers);
        } catch (e) {
          this.reject(e);
        }
      }
      if (this.promptIndex >= this.prompts.length - 1) {
        const prompt = { questions: [], name: "Pending...", status: "pending" };
        this.setPrompts([prompt]);
      }
      this.promptIndex++;
      this.prompts[this.promptIndex - 1].active = false;
      this.prompts[this.promptIndex].active = true;
    },
    onGeneratorSelected: function(generatorName) {
      this.generatorName = generatorName;
    },
    onStepValidated: function(stepValidated) {
      this.stepValidated = stepValidated;
    },
    setPrompts(prompts) {
      // TODO:
      //   if prompt name is provided, find an existing prompt based on key or name:
      //     if found then update it
      //     if not found then create a prompt
      //   if no prompt name is provided, assign incoming question to current prompt
      const currentPrompt = this.currentPrompt;
      if (prompts) {
        prompts.forEach((prompt, index) => {
          if (index === 0) {
            if (prompt.status === "pending") {
              // new pending prompt
              this.prompts.push(prompt);
            } else {
              if (currentPrompt) {
                currentPrompt.questions = prompt.questions;
                if (prompt.name && currentPrompt.name === "Pending...") {
                  currentPrompt.name = prompt.name;
                }
                // if questions are provided, remote the pending status
                if (prompt.questions.length > 0) {
                  delete currentPrompt.status;
                }
              } else {
                // first prompt (choose generator)
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
      prompt.questions.forEach(question => {
        if (question.message === "__Function") {
          question.message = "loading...";
          this.$set(question, "_message", "__Function");
        }
        if (question.choices === "__Function") {
          question.choices = ["loading..."];
          this.$set(question, "_choices", "__Function");
        }
        this.$set(question, "answer", question.default);
        this.$set(question, "isWhen", true);
        this.$set(question, "isValid", true);
        this.$set(question, "validationMessage", true);
      });
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
    generatorDone(success, message) {
      if (this.currentPrompt.status === "pending") {
        this.currentPrompt.name = "Done";
      }
      this.doneMessage = message;
      this.isDone = true;
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
        const vscode = acquireVsCodeApi();
        this.rpc = new RpcBrowser(window, vscode);
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
      this.rpc.registerMethod({
        func: this.showPrompt,
        thisArg: this,
        name: "showPrompt"
      });
      this.rpc.registerMethod({
        func: this.setPrompts,
        thisArg: this,
        name: "setPrompts"
      });
      this.rpc.registerMethod({
        func: this.generatorDone,
        thisArg: this,
        name: "generatorDone"
      });
      this.rpc.registerMethod({
        func: this.log,
        thisArg: this,
        name: "log"
      });
      this.rpc.invoke("receiveIsWebviewReady", []);
    }
  },
  mounted() {
    this.setupRpc();
    //todo: add validate support
    this.yeomanName = "<no generator selected>";
    this.prompts = [];
    this.isInVsCode() ? this.consoleClass = "consoleClassHidden" : this.consoleClass = "consoleClassVisible";
  }
};
</script>

<style>
#app {
  height: 100%;
  color: var(--vscode-foreground, white);
  background-color: var(--vscode-panel-background, #303031);
  font-family: var(--vscode-font-family);
  font-weight: var(--vscode-font-weight);
  font-size: var(--vscode-font-size);
}
html,
body {
  height: 100%;
  background-color: var(--vscode-panel-background, #303031);
  padding: 0px;
}
.list-group-item.selected {
  background-color: var(--vscode-list-active-selection-background);
}
.form-control {
  color: var(--vscode-input-foreground);
  background-color: var(--vscode-input-background);
}
.content {
  margin: 0px;
  margin-top: 1rem;
  padding: 0px;
}
b-container {
  margin: 0px;
  padding: 0px;
}
b-row {
  margin: 0px;
}
button.btn {
  background-color: var(--vscode-button-background, #0e639c);
  border-color: var(--vscode-button-background, #0e639c);
  color: var(--vscode-button-foreground, white);
  border-radius: 0px;
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
}
button.btn:hover {
  background-color: var(--vscode-button-hoverBackground, #1177bb);
  border-color: var(--vscode-button-hoverBackground, #1177bb);
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
#logArea {
  font-family: monospace;
  word-wrap: break-word;
  white-space: pre-wrap;
}
</style>