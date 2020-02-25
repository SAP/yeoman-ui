<template>
  <div id="done-component">
    <v-row
      align="center"
      justify="center"
      style="height: 100%;"
    >
      <v-col align-self="center" class="done-column" cols="10">
        <p class="done-message">
          <v-icon v-if="donePath" color="success" size="30">mdi-checkbox-marked-circle-outline</v-icon>
          <v-icon v-if="!donePath" color="indigo" size="30">mdi-wrench-outline</v-icon>
          {{doneMessage}}
        </p>
      </v-col>
    </v-row>
  </div>
</template>
<script>

export default {
  name: "Done",
  props: ["doneStatus", "doneMessage", "donePath"],
  computed: {
    color() {
      return this.doneStatus ? "green" : "red";
    },
    icon() {
      return this.doneStatus ? "mdi-checkbox-marked-circle-outline" : "mdi-close-circle-outline";
    }
  }
}
</script>

<style>
.done-message{
  font-size: 1.25rem;
  white-space:pre-wrap;
}
.done-column{
    background-color: var(--vscode-editorWidget-background, #252526);
}
</style>
