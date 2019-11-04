<template>
  <div id="app">
    <div v-if="!prompts.length" class="loading">Yowiz is loading...</div>

    <Header
      v-if="prompts.length"
      :currentPrompt="promptIndex+1"
      :numOfSteps="prompts.length"
      :generatorName="generatorName"
      :stepName="prompts[promptIndex].name"
      :rpc="rpc"
    />
    <b-container class="bv-example-row p-0 mx-1 mt-10">
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
              v-on:generatorSelected="onGeneratorSelected"
            />
            <div class="navigation" v-if="prompts.length > 0 && !isDone">
              <b-button class="mr-2 btn" @click="next"
              >Next</b-button>
              <!-- disable when invalid answers -->
                <!-- :disabled="!currentPrompt.allAnswered" -->
            </div>
          </b-container>
        </b-col>
      </b-row>
    </b-container>
    <div>
      <div id="terminal"></div>
    
    <b-collapse visible id="showLogId" v-model="showLog">
        <b-form-textarea
      id="logTextarea"
      placeholder="No log entry"
      v-model="logText"
      rows="6"
    ></b-form-textarea>
    </b-collapse>
    
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
      prompts: [],
      promptIndex: 0,
      index: 0,
      rpc: Object,
      resolve: Object,
      reject: Object,
      isDone: false,
      doneMessage: Object,
      showLog: false,
      logText: ""
    };
  },
  computed: {
    currentPrompt: function() {
      const response = this.prompts[this.promptIndex];
      if (response) {
        const answers = response.answers || {};
        response.questions.forEach(value => {
          answers[value.name] = value.answer;
        });
        response.answers = answers;
      }
      return response;
    }
  },
  watch: {
    'currentPrompt.answers': {
      deep: true,
      immediate: true,
      handler() {
        if (this.currentPrompt) {
          // TODO: consider using debounce (especially for questions of type 'input') to limit roundtrips
          // TODO: detect other functions (e.g. filter, choices that call functions, etc.)
          // TODO: handle multiple questions with same property as function

          const questionWithWhen = this.currentPrompt.questions.find((question) => {
            return (question.when);
          });
          if (questionWithWhen) {
            this.rpc.invoke("evaluateMethod", [[this.currentPrompt.answers], questionWithWhen.name, "when"]).then((response) => {
              questionWithWhen.isWhen = response;
            });
          }

          const questionWithMessage = this.currentPrompt.questions.find((question) => {
            return (question._message === '__Function');
          });
          if (questionWithMessage) {
            this.rpc.invoke("evaluateMethod", [[this.currentPrompt.answers], questionWithMessage.name, "message"]).then((response) => {
              questionWithMessage.message = response;
            });
          }

          const questionWithChoices = this.currentPrompt.questions.find((question) => {
            return (question._choices === '__Function');
          });
          if (questionWithChoices) {
            this.rpc.invoke("evaluateMethod", [[this.currentPrompt.answers], questionWithChoices.name, "choices"]).then((response) => {
              questionWithChoices.choices = response;
            });
          }

          const questionWithValidate = this.currentPrompt.questions.find((question) => {
            return (question.validate === '__Function');
          });
          if (questionWithValidate) {
            this.rpc.invoke("evaluateMethod", [[questionWithValidate.answer, this.currentPrompt.answers], questionWithValidate.name, "validate"]).then((response) => {
              questionWithValidate.isValid = (typeof response === 'string' ? false : response);
              questionWithValidate.validationMessage = (typeof response === 'string' ? response : undefined);
            });
          }
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
      this.prompts[this.promptIndex-1].active = false;
      this.prompts[this.promptIndex].active = true;
    },
    onGeneratorSelected: function(generatorName) {
      this.generatorName = generatorName;
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
                if (prompt.name && currentPrompt.name === 'Pending...') {
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
        if (question.message === '__Function') {
          question.message = 'loading...';
          this.$set(question, "_message", '__Function');
        }

        if (question.choices === '__Function') {
          question.choices = ['loading...'];
          this.$set(question, "_choices", '__Function');
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
        allAnswered: false,
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
      if (this.currentPrompt.status === 'pending') {
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
    // var term = new Terminal();
    //     term.open(document.getElementById('terminal'));
    //     term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
    this.setupRpc();

    //todo: add validate support

    this.yeomanName = "<no generator selected>";
    this.prompts = [];
  }
};
</script>

<style>
#app {
  color: var(--vscode-foreground, white);
  background-color: var(--vscode-panel-background, #303031);
  font-family: var(--vscode-font-family);
  font-weight: var(--vscode-font-weight);
  font-size: var(--vscode-font-size);
}

html,
body {
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

.bv-example-row {
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
</style>
