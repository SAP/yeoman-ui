<template>
  <div id="prompt-info-component">
    <div>
      <v-card-title class="prompt-title">{{ currentPrompt.name }}</v-card-title>
      <v-card-subtitle class="prompt-title">{{ currentPrompt.description }}</v-card-subtitle>
    </div>
  </div>
</template>
<script setup>
import { toRefs } from "vue";

const props = defineProps({
  currentPrompt: {
    type: Object,
    default: () => ({}),
  },
});

const { currentPrompt } = toRefs(props);
</script>

<style scoped>
.v-card-title {
  color: var(--vscode-foreground, #cccccc);
}
.v-card-subtitle {
  color: var(--vscode-editorCodeLens-foreground, #999999);
  white-space: pre-wrap;
}
</style>
