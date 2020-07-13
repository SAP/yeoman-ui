<template>
  <div>
    <v-app-bar class="elevation-0">
      <v-toolbar-title>{{headerTitle}}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="isGeneric" text small color="primary" class="ma-2" @click="openExploreGenerators">Explore and Install Generators...</v-btn>
      <v-btn v-if="!isInVsCode" class="ma-2" icon @click="collapseOutput">
        <v-card-text>
          <v-icon>mdi-console</v-icon>
        </v-card-text>
      </v-btn>
    </v-app-bar>
  </div>
</template>

<script>
export default {
  name: "Header",
  props: ["headerTitle", "stepName", "isInVsCode", "rpc", "isGeneric"],
  methods: {
    collapseOutput() {
      this.rpc.invoke("toggleOutput", [{}]);
      this.$emit("parentShowConsole");
    },
    openExploreGenerators() {
      this.rpc.invoke("exploreGenerators", [{}]);
    }
  }
};
</script>
<style>
header.v-app-bar.v-toolbar,
header.v-app-bar.v-toolbar .v-btn {
  background-color: var(--vscode-editor-background, #1e1e1e);
  color: var(--vscode-foreground, #cccccc);
}
header.v-app-bar.v-toolbar {
  border-bottom: 1px solid var(--vscode-editorWidget-background, #252526);
  box-shadow: none;
  background-color: var(--vscode-editor-background, #1e1e1e) !important;
}
</style>
