<template>
  <div>
    <b-jumbotron class="jumbo">
      <b-img class="imgDone" src="https://icons-for-free.com/iconfiles/png/128/success-1319971786207747160.png"></b-img>
      {{doneMessage}}

      <hr class="my-4">

      

      <b-container v-if="isInVsCode" class="bv-example-row">
        <b-row>
          <b-col>Where would you like to open the project?</b-col>
          <b-col cols="12" md="auto">
            <b-button class="btn" href="#">Current Workspace</b-button>
          </b-col>
          <b-col cols="12" md="auto">
            <b-button class="btn" data-command-name="vscode.openFolder" :data-command-params="donePath" @click="executeCommand">New Workspace</b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-jumbotron>
  </div>
</template>

<script>
import _ from "lodash"

export default {
  name: "GeneratorDone",
  props: ["doneMessage","donePath","isInVsCode"],
  data() {
    return {
    }
  },
  methods: {
    executeCommand(event) {
      if (event) {
        let curTargetData = event.currentTarget.dataset;
        if (curTargetData) {
          window.vscode.postMessage({
              command: 'vscodecommand',
              commandName: curTargetData.commandName,
              commandParams: (curTargetData.commandParams === undefined ? [] : [curTargetData.commandParams])
          });
        }
      }
    },
  },
}

</script>

<style>
.jumbotron.jumbo {
  background-color: var(--vscode-editorWidget-background, #252526);
  padding: 1rem 0.5rem;
}
img.imgDone {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
