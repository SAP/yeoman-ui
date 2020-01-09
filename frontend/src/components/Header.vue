<template>
  <div>
    <v-app-bar class="elevation-0">
      <v-toolbar-title>{{selectedGeneratorHeader}}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="collapseLog" icon>
        <v-icon>mdi-console</v-icon>
      </v-btn>
    </v-app-bar>
  </div>
</template>

<script>
export default {
  name: "Header",
  props: ["selectedGeneratorHeader", "stepName", "rpc"],
  methods: {
    collapseLog() {
      this.rpc.invoke("toggleLog", [{}]);
      this.$emit("parentShowConsole");
    }
  }
};
</script>
<style>
header.v-app-bar.v-toolbar, header.v-app-bar.v-toolbar .v-btn {
  background-color: var(--vscode-editor-background, #1e1e1e);
  color: var(--vscode-foreground, #cccccc);
}
header.v-app-bar.v-toolbar {
  border-bottom: 1px solid var(--vscode-terminal-ansiBlack, #000000);
  box-shadow: none;
}
</style>
