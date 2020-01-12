<template>
  <div id="done-component">
    <b-jumbotron class="jumbo">
      <p>
        <b-img class="imgDone" src="https://icons-for-free.com/iconfiles/png/128/success-1319971786207747160.png"></b-img>
        {{doneMessage}}
      </p>

      <hr class="my-4">

      <b-container v-if="isInVsCode" class="bv-example-row">
        <b-row>
          <b-col>Where would you like to open the project?</b-col>
          <b-col cols="12" md="auto">
            <v-btn class="btn" :data-command-params="donePath" @click="close">Close</v-btn>
          </b-col>
          <b-col cols="12" md="auto">
            <v-btn class="btn" data-command-name="vscode.openFolder" :data-command-params="donePath" @click="executeCommand">New Workspace</v-btn>
          </b-col>
        </b-row>
      </b-container>
    </b-jumbotron>
  </div>
</template>
<script>

import _ from "lodash"

export default {
  name: "Done",
  props: ["doneMessage", "donePath", "isInVsCode"],
  methods: {
    executeCommand(event) {
      const curTargetData = _.get(event, "currentTarget.dataset");
      if (curTargetData) {
        let cParams = _.get(curTargetData, "commandParams", []);
        if (!_.isEmpty(cParams)) {
          cParams = [cParams]
        } 
        window.vscode.postMessage({
            command: 'vscodecommand',
            commandName: curTargetData.commandName,
            commandParams: cParams
        });
      }
    },
    close(event) {
      _.set(event, "currentTarget.dataset.commandName", "workbench.action.closeActiveEditor");
      this.executeCommand(event);
    },
    // ISSUE: workbench.action.addRootFolder doesn't get params.
    // openCurrentWorkspace(event) {
    //   close(event);
    //   event.currentTarget.dataset.commandName = "workbench.action.addRootFolder";
    //   this.executeCommand(event);
    // }
  },
}
</script>

<style>
/* .jumbotron.jumbo {
  background-color: var(--vscode-editorWidget-background, #252526);
  padding: 1rem 0.5rem;
}
img.imgDone {
  width: 1.5rem;
  height: 1.5rem;
}
.jumbo button {
  background-color: var(--vscode-button-background, #0e639c) !important;
  border-color: var(--vscode-button-background, #0e639c) !important;
  color: #cccccc !important;
  border-radius: 0px !important;
  font-size: 0.8rem !important;
  padding: 0.2rem 0.6rem !important;
  height: 2rem !important; 
}
.jumbo button {
  background-color: var(--vscode-button-hoverBackground, #1177bb) !important;
  border-color: var(--vscode-button-hoverBackground, #1177bb) !important;
} */
</style>