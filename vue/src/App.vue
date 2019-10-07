<template>
  <div id="app">
    <Header
      v-if="steps.length"
      :currentStep="stepIndex+1"
      :numOfSteps="steps.length"
      :yeomanName="yeomanName"
      :stepName="steps[stepIndex].name"
    />

    <b-container class="bv-example-row">
      <b-row>
        <b-col sm="auto">
          <b-container>
            <Navigation
              v-if="steps.length"
              :currentStep="stepIndex"
              :steps="steps"
            />
          </b-container>
        </b-col>
        <b-col>
          <b-container>
            <Step v-if="steps.length" :currentStep="steps[stepIndex]" :next="next" />
            <div class="navigation">
              <b-button @click="next" variant="success" :disabled="stepIndex===steps.length-1">Next</b-button>
              <b-button variant="primary" :disabled="stepIndex<steps.length-1">Finish</b-button>
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
      steps: [],
      questions: [],
      stepIndex: 0,
      index: 0,
      numTotal: 0
    };
  },
  methods: {
    next() {
      this.stepIndex++;
    }
  },
  mounted() {
    if (acquireVsCodeApi && typeof acquireVsCodeApi === 'function') {
      const vscode = acquireVsCodeApi();
      const rpc = new RpcBrowser(window, vscode);
      rpc.invoke("showMessage", ["message from yowiz webview"]);
    }

    //todo: add validate support
    document.body.className = "vscode-dark";
    this.yeomanName = "yeoman generator";
    let checkboxQ = {
      type: "checkbox",
      question: "checkbox: what is checkbox?",
      answers: ["a", "b", "c", "d"]
    };
    let inputQ = {
      type: "input",
      default_answer: "input: default answer",
      question: "input: what is input?"
    };
    let listQ = {
      type: "list",
      defaultAnswer: 1,
      question: "list: what is list?",
      answers: ["a", "b", "c", "d"]
    };
    let confirmQ = {
      type: "confirm",
      defaultAnswer: "yes",
      question: "confirm: what is list?"
    };

    let prompt1 = {
      name: "prompt 1",
      questions: [checkboxQ, confirmQ, inputQ, listQ]
    };
    let prompt2 = {
      name: "prompt 2",
      questions: [checkboxQ, confirmQ, inputQ, listQ]
    };
    this.prompts.push(prompt1);
    this.prompts.push(prompt2);

    this.steps = this.prompts;

    this.questions = [checkboxQ, confirmQ, inputQ, listQ];
    this.numTotal = this.questions.length;
  }
};
</script>

<style>
#app {
  /* font-family: "Avenir", Helvetica, Arial, sans-serif; */
  /* -webkit-font-smoothing: antialiased; */
  /* -moz-osx-font-smoothing: grayscale; */
  /* text-align: center; */
  /* color: #2c3e50; */
  margin-top: 60px;
  background-color: var(--vscode-editor-foreground);
  font-family: var(--vscode-editor-font-family);
  font-weight: var(--vscode-editor-font-weight);
  font-size: var(--vscode-editor-font-size);
}
</style>
