<template>
  <div>
    <v-app-bar class="elevation-0">
      <v-toolbar-title v-bind="attrs" v-on="on">{{ headerTitle }}</v-toolbar-title>
      <v-tooltip v-if="headerInfo" bottom>
        <template v-slot:activator="{ on }">
          <v-icon id="header-info-icon" v-on="on">mdi-information-outline</v-icon>
        </template>
        <span>{{ headerInfo }}</span>
      </v-tooltip>
      <v-spacer></v-spacer>
      <v-btn v-if="isGeneric" text x-small color="primary" @click="openExploreGenerators">
        <v-card-text> Explore and Install Generators... </v-card-text>
      </v-btn>
      <v-btn v-if="isInVsCode" class="ma-2" icon @click="collapseOutput">
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
  props: ["headerTitle", "stepName", "isInVsCode", "rpc", "isGeneric", "headerInfo"],
  methods: {
    collapseOutput() {
      this.rpc.invoke("toggleOutput", [{}]);
      this.$emit("parentShowConsole");
    },
    openExploreGenerators() {
      this.rpc.invoke("exploreGenerators", [{}]);
    },
  },
};
</script>
<style>
header.v-app-bar.v-toolbar,
header.v-app-bar.v-toolbar .v-btn {
  background-color: var(--vscode-editor-background, #1e1e1e);
  color: var(--vscode-foreground, #cccccc);
  text-transform: none;
}
header.v-app-bar.v-toolbar {
  border-bottom: 1px solid var(--vscode-editorWidget-background, #252526);
  box-shadow: none;
  background-color: var(--vscode-editor-background, #1e1e1e) !important;
}
#header-info-icon {
  font-size: 20px;
  padding: 9px 12px 6px;
  color: var(--vscode-notificationsInfoIcon-foreground, #5eadf2);
}
</style>
