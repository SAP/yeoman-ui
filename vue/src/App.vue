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
      reject: Object,
      currentGenerator: Object
    };
  },
  methods: {
    next() {
      if (this.stepIndex >= this.prompts.length - 1) {
        const prompt = { questions: [], name: "Step" };
        this.prompts.push(prompt);
      }
      this.stepIndex++;
      if (this.resolve) {
        try {
          this.resolve(this.$refs["step"].$data.answers);
        } catch (e) {
          this.reject(e);
        }
      }
    },
    onGeneratorSelected: function(generatorName) {
      this.yeomanName = generatorName;
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
    },
    loadMocks() {
      const retPrompts = [];

      let generatorChoice1 = {
        name: "Generator 1",
        message: "Create an SAP project",
        imageUrl: "https://picsum.photos/600/300/?image=11"
      };

      let generatorChoice2 = {
        name: "Generator 2",
        message: "Create an SAP project",
        imageUrl: "https://picsum.photos/600/300/?image=22"
      };

      let generatorChoice3 = {
        name: "Generator 3",
        message: "Create an SAP project",
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
      retPrompts.push(gensPrompt);

      let checkboxQ = {
        type: "checkbox",
        name: "cb1",
        message: "checkbox: what is checkbox?",
        choices: ["a", "b", "c", "d"]
      };
      let inputQ = {
        type: "input",
        name: "in1",
        default: "input: default answer",
        message: "input: what is input?"
      };
      let listQ = {
        type: "list",
        name: "list1",
        default: "c",
        message: "list: what is list?",
        choices: ["a", "b", "c", "d"]
      };
      let confirmQ = {
        type: "confirm",
        name: "conf1",
        default: "yes",
        message: "confirm: what is list?"
      };

      let prompt1 = {
        name: "Step 1",
        questions: [checkboxQ, confirmQ, inputQ, listQ]
      };

      retPrompts.push(prompt1);
      return retPrompts;
    }
  },
  mounted() {
    let promptsTemp = [];
    this.setupRpc();

    //todo: add validate support

    this.yeomanName = "<no generator selected>";

    promptsTemp.forEach(prompt => {
      this.$set(prompt, "allAnswered", false);
      prompt.questions.forEach(question => {
        this.$set(question, "answer", undefined);
      });
    });

    this.prompts = promptsTemp;
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
