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
            <Navigation v-if="steps.length" :currentStep="stepIndex" :steps="steps" />
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
      numTotal: 0,
      rpc: Object
    };
  },
  methods: {
    next() {
      this.stepIndex++;
    },

    receiveGeneratorName(name) {
      this.yeomanName = name;
    },
    receiveGenerators(generators) {
      // TODO: render generator tiles
      // eslint-disable-next-line
      console.dir(generators);
      // generators.forEach(element => {
      //   this.generators.push({
      //     name : element,
      //     description: "Some quick example text of the generator description. This is a long text so that the example will look good.",
      //     imageUrl : "https://picsum.photos/600/300/?image=22"
      //   })
      // });
      return "received generators";
    },
    receiveQuestions(questions, name) {
      // eslint-disable-line no-unused-vars
      // eslint-disable-next-line
      console.dir(questions);
      // eslint-disable-next-line
      console.log("received questions");
      const prompt = { questions: questions, name: name };
      this.prompts.push(prompt);
      return "received questions";
    },
    runGenerator(generatorName) {
      // TODO: call this method after user chose which generator to run
      this.rpc.invoke("runGenerator", [generatorName]);
    },
    initRpc() {
      // eslint-disable-line no-undef
      // eslint-disable-next-line
      // eslint-disable-next-line
      if (typeof acquireVsCodeApi !== 'undefined' && typeof acquireVsCodeApi === 'function') {
        // eslint-disable-line no-undef
        // eslint-disable-next-line
        const vscode = acquireVsCodeApi();
        const rpc = new RpcBrowser(window, vscode);
        this.rpc = rpc;
        rpc.registerMethod({
          func: this.receiveGenerators,
          thisArg: this,
          name: "receiveGenerators"
        });
        rpc.registerMethod({
          func: this.receiveQuestions,
          thisArg: this,
          name: "receiveQuestions"
        });
        rpc.registerMethod({
          func: this.receiveGeneratorName,
          thisArg: this,
          name: "receiveGeneratorName"
        });
        rpc.invoke("receiveIsWebviewReady", []);
      }
    }
  },
  mounted() {
    this.initRpc();
    let generatorChoice1 = {
        name: "SAP Fiori List Report Object Page FE V2",
        message: "Create an SAP Fiori Elements application which is based on a List Report Page abd Object Page Fiori elements in V2",
        imageUrl: "https://picsum.photos/600/300/?image=11"
      
    };

    let generatorChoice2 = {
        name: "SAP Fiori List Report Object Page FE V2",
        message: "Create an SAP Fiori Elements application which is based on a List Report Page abd Object Page Fiori elements in V4",
        imageUrl: "https://picsum.photos/600/300/?image=22"
      
    };

    let generatorChoice3 = {
        name: "CRUD Master Detail",
        message: "A worklist displays a collection of items that a user needs to process. Working through the list usually involves reviewing details of the items and taking actions. In most cases the user has to either complete a work item or delegate it.",
        imageUrl: "https://picsum.photos/600/300/?image=33"
      
    };

    let gensQuestion1 = {
      type: "generators",
      message: "Choose a generator",
      choices: [generatorChoice1, generatorChoice2, generatorChoice3]
    };
    let gensPrompt = {
      name: "generators prompt",
      questions: [gensQuestion1]
    };
    this.prompts.push(gensPrompt);

    //todo: add validate support
    this.yeomanName = "yeoman generator";
    let checkboxQ = {
      type: "checkbox",
      message: "checkbox: what is checkbox?",
      choices: ["a", "b", "c", "d"]
    };
    let inputQ = {
      type: "input",
      default_answer: "input: default answer",
      message: "input: what is input?"
    };
    let listQ = {
      type: "list",
      default: 1,
      message: "list: what is list?",
      choices: ["a", "b", "c", "d"]
    };
    let confirmQ = {
      type: "confirm",
      default: "yes",
      message: "confirm: what is list?"
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

    this.yeomanName = "<no generator selected>";
    this.steps = this.prompts;

    this.questions = [gensPrompt];
    this.questions = [];
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
  /* margin-top: 60px; */
  color: var(--vscode-foreground);
  background-color: var(--vscode-panel-background);
  font-family: var(--vscode-font-family);
  font-weight: var(--vscode-font-weight);
  font-size: var(--vscode-font-size);
}

html,
body {
  background-color: var(--vscode-panel-background);
}

.list-group-item.selected {
  background-color: var(--vscode-list-active-selection-background);
}

.form-control {
  color: var(--vscode-input-foreground);
  background-color: var(--vscode-input-background);
}
</style>
