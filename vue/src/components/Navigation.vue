<template>
  <div>
    <b-list-group flush>
      <b-list-group-item
        v-for="(prompt, index) in prompts"
        href="#"
        :active="prompt.active"
        :key="index"
      >{{ prompt.name }}</b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
export default {
  name: "Navigation",
  props: ["currentPrompt", "prompts"],
  methods: {
  },
  watch: {
  },
  data() {
    return {}
  },
  mounted() {
  }
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
  background-color: var(--vscode-sideBar-background, #252526);
  border-color: var(--vscode-sideBar-background, #252526);
  color: var(--vscode-foreground, #cccccc);
  cursor: default;
}

/* selected item */
.list-group-item.active {
  background-color: var(--vscode-list-activeSelectionBackground, #094771);
  border-color: var(--vscode-list-activeSelectionBackground, #094771);
  color: var(--vscode-list-activeSelectionForeground, white);
}

/* hovered item */
.list-group-item:hover:not(.active) {
  background-color: var(--vscode-list-hoverBackground, #2a2d2e);
  color: var(--vscode-foreground, #cccccc);
}

</style>