<template>
  <div>
    <b-list-group flush>
      <b-list-group-item
        v-for="(step, index) in steps"
        :key="index"
        :class="(index===0 ? 'active' : '')"
        v-on:click="select"
      >{{ step.name }}</b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
export default {
  name: "Navigation",
  props: ["currentStep", "steps"],
  methods: {
    select(event) {
      if (this.selectedItem) {
        this.selectedItem.classList.toggle("active");
      }
      this.selectedItem = event.currentTarget;
      this.selectedItem.classList.toggle("active");
    }
  },
  data() {
    return {
      selectedItem: undefined
    }
  },
  mounted() {
    this.selectedItem = document.getElementsByClassName("list-group-item")[0];
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
  cursor: pointer;
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