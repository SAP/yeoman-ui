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
            <GeneratorSelection v-if="selectedGenerator" :generators="generators" />
            <Step v-if="!selectedGenerator && steps.length" :currentStep="steps[stepIndex]" :next="next" />
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
import GeneratorSelection from "./components/GeneratorSelection.vue";
import Navigation from "./components/Navigation.vue";
import Step from "./components/Step.vue";
import { RpcBrowser } from "./rpc/rpc-browser.js";

export default {
  name: "app",
  components: {
    Header,
    GeneratorSelection,
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
      selectedGenerator: true,
      generators: []
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
      return "received generators";
    },
    receiveQuestions(questions) {
      // eslint-disable-line no-unused-vars
      // eslint-disable-next-line
      console.dir(questions);
      // eslint-disable-next-line
      console.log("received questions");
      const prompt = { questions: questions, name: Math.random() };
      this.prompts.push(prompt);
      return "received questions";
    },
    runGenerator(generatorName) {
      // TODO: call this method after user chose which generator to run
      this.rpc.invoke("runGenerator", [generatorName]);
    },
    initRpc() {
      if (window.acquireVsCodeApi && typeof window.acquireVsCodeApi === "function") {
        const vscode = window.acquireVsCodeApi();
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

    let generator1 = {
      name: "generator 1",
      description: "Some quick example text of the generator description. This is a long text so that the example will look good.",
      imageUrl : "https://picsum.photos/600/300/?image=11"
    }

    let generator2 = {
      name: "generator 2",
      description: "Some quick example text of the generator description. This is a long text so that the example will look good.",
      imageUrl : "https://picsum.photos/600/300/?image=22"
    }

    let generator3 = {
      name: "generator 3",
      description: "Some quick example text of the generator description. This is a long text so that the example will look good.",
      imageUrl : "https://picsum.photos/600/300/?image=33"
    }

    this.generators = [generator1, generator2, generator3];

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
  /* margin-top: 60px; */
  color: var(--vscode-foreground);
  background-color: var(--vscode-panel-background);
  font-family: var(--vscode-font-family);
  font-weight: var(--vscode-font-weight);
  font-size: var(--vscode-font-size);
}

html, body {
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
