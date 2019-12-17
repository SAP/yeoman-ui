<template>
  <div>
    <b-list-group flush>
      <b-list-group-item
        v-for="(prompt, index) in prompts"
        href="#"
        :active="promptIndex === index"
        :key="index"
      >{{ prompt.name }}</b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
export default {
  name: "Navigation",
  props: ["promptIndex", "prompts"]
};
</script>
<style scoped>
.list-group {
  margin-bottom: 15px;
}

/* all items */
.list-group-item {
  padding-left: 0.5em;
  padding-right: 0.5em;
  padding-top: 0.2em;
  padding-bottom: 0.2em;
  background-color: var(--vscode-editorWidget-background, #252526);
  border-color: var(--vscode-editorWidget-border, #454545);
  color: var(--vscode-foreground, #cccccc);
  cursor: default;
}

/* selected item */
.list-group-item.active {
  background-color: var(--vscode-input-background, #3c3c3c);
  border-color: var(--vscode-editorWidget-border, #454545);
  color: var(--vscode-checkbox-foreground, #f0f0f0);
}

/* hovered item */
.list-group-item:hover:not(.active) {
  background-color: var(--vscode-list-hoverBackground, #2a2d2e);
  color: var(--vscode-foreground, #cccccc);
}
</style>
