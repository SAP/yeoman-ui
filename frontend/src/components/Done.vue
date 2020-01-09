<template>
  <div id="done-component">
    <b-jumbotron class="jumbo">
      <p>
        <b-img class="imgDone" src="https://icons-for-free.com/iconfiles/png/128/success-1319971786207747160.png"></b-img>
        {{doneMessage}}
      </p>
    </b-jumbotron>
  </div>
</template>
<script>

export default {
  name: "Done",
  props: ["doneMessage", "donePath", "isInVsCode"],
  methods: {
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
.jumbotron.jumbo {
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
}
</style>