<template>
  <div id="done-component">
      <v-row
          align="center"
          justify="center"
          style="height: 100%;"
        >
    <v-col align-self="center" class="done-column" cols="10">
    <p class="done-message"><v-icon  color="success" size="30">mdi-checkbox-marked-circle-outline</v-icon> {{doneMessage}}</p>
    </v-col>
      </v-row>
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
.done-message{
  font-size: 1.25rem;
}
.done-column{
    background-color: var(--vscode-editorWidget-background, #252526);
}

</style>