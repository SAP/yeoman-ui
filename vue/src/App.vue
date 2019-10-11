<template>
  <div id="app">
    <div v-if="!steps.length" class=loading>Yowiz is loading...</div>

    <Header
      v-if="steps.length"
      :currentStep="stepIndex+1"
      :numOfSteps="steps.length"
      :yeomanName="yeomanName"
      :stepName="steps[stepIndex].name"
    />

    <b-container class="bv-example-row p-0 mx-1 mt-10">
      <b-row class="m-0 p-0">
        <b-col class="m-0 p-0" sm="auto">
          <b-container class="m-0 p-0">
            <Navigation v-if="steps.length" :currentStep="stepIndex" :steps="steps" />
          </b-container>
        </b-col>
        <b-col class="m-0 p-0">
          <b-container>
            <Step
              v-if="steps.length"
              :currentStep="steps[stepIndex]"
              :next="next"
              v-on:generatorSelected="selectGenerator"
            />
            <div class="navigation" v-if="steps.length > 0">
              <b-button
                class="mr-2 btn"
                @click="next"
                :disabled="stepIndex !== 0 && stepIndex===steps.length-1"
              >Next</b-button>
              <b-button :disabled="stepIndex<steps.length-1">Finish</b-button>
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
      rpc: Object,
      resolve: Object,
      reject: Object,
      currentGenerator: Object
    };
  },
  methods: {
    next() {
      this.stepIndex++;
      if (this.resolve) {
        this.resolve(this.currentGenerator);
      }
    },
    selectGenerator: function(generatorName) {
      this.currentGenerator = generatorName;
      this.yeomanName = generatorName;
    },
    receiveGeneratorName(name) {
      this.yeomanName = name;
    },
    receiveQuestions(questions, name) {
      // eslint-disable-next-line
      console.dir(questions);
      // eslint-disable-next-line
      console.log("received questions");
      const prompt = { questions: questions, name: name };
      this.prompts.push(prompt);
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
      // eslint-disable-next-line
      return typeof acquireVsCodeApi !== "undefined";
    },
    initRpc() {
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
    },
    loadMocks() {
      let generatorChoice1 = {
        name: "SAP Fiori List Report Object Page FE V2",
        message:
          "Create an SAP Fiori Elements application which is based on a List Report Page abd Object Page Fiori elements in V2",
        imageUrl: "https://picsum.photos/600/300/?image=11"
      };

      let generatorChoice2 = {
        name: "SAP Fiori List Report Object Page FE V2",
        message:
          "Create an SAP Fiori Elements application which is based on a List Report Page abd Object Page Fiori elements in V4",
        imageUrl: "https://picsum.photos/600/300/?image=22"
      };

      let generatorChoice3 = {
        name: "CRUD Master Detail",
        message:
          "A worklist displays a collection of items that a user needs to process. Working through the list usually involves reviewing details of the items and taking actions. In most cases the user has to either complete a work item or delegate it.",
        imageUrl: "https://picsum.photos/600/300/?image=33"
      };

      let gensQuestion1 = {
        type: "generators",
        message: "",
        choices: [generatorChoice1, generatorChoice2, generatorChoice3]
      };
      let gensPrompt = {
        name: "Generators",
        questions: [gensQuestion1]
      };
      this.prompts.push(gensPrompt);

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
        name: "Step 1",
        questions: [checkboxQ, confirmQ, inputQ, listQ]
      };
      let prompt2 = {
        name: "Step 2",
        questions: [checkboxQ, confirmQ, inputQ, listQ]
      };
      this.prompts.push(prompt1);
      this.prompts.push(prompt2);
      this.questions = [gensPrompt];
    }
  },
  mounted() {
    if (this.isInVsCode()) {
      this.initRpc();
    } else {
      this.loadMocks();
    }

    //todo: add validate support

    this.yeomanName = "<no generator selected>";
    this.steps = this.prompts;

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
