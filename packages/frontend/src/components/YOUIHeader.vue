<template>
  <div>
    <v-toolbar elevation="0">
      <v-toolbar-title>
        {{ headerTitle }}
      </v-toolbar-title>
      <v-tooltip v-if="headerInfo" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-icon id="header-info-icon" v-bind="tooltipProps">mdi-information-outline</v-icon>
        </template>
        <span>{{ headerInfo }}</span>
      </v-tooltip>
      <v-spacer />
      <v-btn v-if="isGeneric" variant="text" color="primary" @click="openExploreGenerators">
        Explore and Install Generators...
      </v-btn>
      <v-btn v-if="!isInVsCode" variant="text" class="ma-2" icon="mdi-console" @click="collapseOutput" />
    </v-toolbar>
  </div>
</template>

<script setup>
import { toRefs, unref } from "vue";

const props = defineProps({
  headerTitle: {
    type: String,
    default: undefined,
  },
  rpc: {
    type: Object,
    default: undefined,
  },
  stepName: {
    type: String,
    default: undefined,
  },
  isInVsCode: {
    type: Boolean,
    default: false,
  },
  isGeneric: {
    type: Boolean,
    default: false,
  },
  headerInfo: {
    type: String,
    default: undefined,
  },
});

const { headerTitle, rpc, isInVsCode, isGeneric, headerInfo } = toRefs(props);

const emit = defineEmits(["parentShowConsole"]);

const collapseOutput = () => {
  unref(rpc).invoke("toggleOutput", [{}]);
  emit("parentShowConsole");
};

const openExploreGenerators = () => {
  unref(rpc).invoke("exploreGenerators", [{}]);
};
</script>
<style>
header.v-toolbar,
header.v-toolbar .v-btn {
  background-color: var(--vscode-editor-background, #1e1e1e);
  color: var(--vscode-foreground, #cccccc);
  text-transform: none;
}
header.v-toolbar .v-btn {
  color: var(--vscode-textLink-foreground, #3794ff) !important;
}
header.v-toolbar {
  border-bottom: 1px solid var(--vscode-editorWidget-background, #252526);
  box-shadow: none;
  background-color: var(--vscode-editor-background, #1e1e1e) !important;
}

header.v-toolbar .v-toolbar-title {
  flex: none;
}

#header-info-icon {
  font-size: 20px;
  padding: 9px 18px 6px;
  color: var(--vscode-notificationsInfoIcon-foreground, #5eadf2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
