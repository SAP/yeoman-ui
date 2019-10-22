<template>
  <div id="app">
    <div v-if="!prompts.length" class="loading">Yowiz is loading...</div>

    <Header
      v-if="prompts.length"
      :currentStep="stepIndex+1"
      :numOfSteps="prompts.length"
      :yeomanName="yeomanName"
      :stepName="prompts[stepIndex].name"
    />
    <b-container class="bv-example-row p-0 mx-1 mt-10">
      <b-row class="m-0 p-0">
        <b-col class="m-0 p-0" sm="auto">
          <b-container class="m-0 p-0">
            <Navigation v-if="prompts.length" :currentStep="stepIndex" :prompts="prompts" />
          </b-container>
        </b-col>
        <b-col class="m-0 p-0">
          <b-container>
            <Step
              v-if="prompts.length"
              ref="step"
              :currentStep="prompts[stepIndex]"
              :next="next"
              v-on:generatorSelected="onGeneratorSelected"
            />
            <div class="navigation" v-if="prompts.length > 0">
              <b-button
                class="mr-2 btn"
                @click="next"
                :disabled="stepIndex < prompts.length - 1 && !prompts[stepIndex].allAnswered"
              >Next</b-button>
              <!-- stepIndex = {{stepIndex}}
              prompts.length - 1 = {{prompts.length - 1}}
              !prompts[stepIndex].allAnswered = {{!prompts[stepIndex].allAnswered}} -->
              <b-button :disabled="stepIndex<prompts.length-1" @click="next">Finish</b-button>
            </div>
          </b-container>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
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
      yeomanName: Object,
      prompts: [],
      stepIndex: 0,
      index: 0,
      rpc: Object,
      resolve: Object,
      reject: Object
    };
  },
  computed: {
    currentPrompt: function() {
      const response = this.prompts[this.stepIndex];
      if (response) {
        const answers = {};
        response.questions.forEach((value) => {
          answers[value.name] = value.answer;
        });
        response.answers = answers;
      }
      return response;
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
      if (this.stepIndex >= this.prompts.length - 1) {
        const prompt = { questions: [], name: "Step", status: "pending" };
        this.addPrompt(prompt);
      }
      this.stepIndex++;
    },
    onGeneratorSelected: function(generatorName) {
      this.yeomanName = generatorName;
    },
    addPrompt(prompt) {
      // TODO:
      //   if step/prompt name is provided, find an existing prompt based on key or name:
      //     if found then update it
      //     if not found then create a step/prompts
      //   if no step/prompt name is provided, assign incoming question to current prompt
      const currentPrompt = this.currentPrompt;
      if (currentPrompt && currentPrompt.status === "pending") {
        currentPrompt.questions = prompt.questions;
        currentPrompt.name = prompt.name;
        delete currentPrompt.status;
      } else {
        this.$set(prompt, "allAnswered", false);
        prompt.questions.forEach(question => {
          this.$set(question, "answer", undefined);
        });
        this.prompts.push(prompt);
      }
    },
    receiveQuestions(questions, name) {
      const prompt = { questions: questions, name: name };
      this.addPrompt(prompt);
      const promise = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
      return promise;
    },
    runGenerator(generatorName) {
      // TODO: call this method after user chose which generator to run
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
        }
      }
    },
    initRpc() {
      this.rpc.registerMethod({
        func: this.receiveQuestions,
        thisArg: this,
        name: "receiveQuestions"
      });
      this.rpc.invoke("receiveIsWebviewReady", []);
    }
  },
  mounted() {
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
