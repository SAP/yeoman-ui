<template>
  <div id="prompt-info-component">
    <div>
      <v-card-title class="prompt-title">{{ currentPrompt.name }}</v-card-title>
      <v-card-subtitle class="prompt-title">{{
        currentPrompt.description
      }}</v-card-subtitle>
    </div>
  </div>
</template>
<script>
export default {
  name: "PromptInfo",
  props: ["currentPrompt"],
};
</script>

<style scoped>
.v-card__title {
  color: var(--vscode-foreground, #cccccc);
}
.v-card__subtitle {
  color: var(--vscode-editorCodeLens-foreground, #999999);
  white-space: pre-wrap;
}
</style>
