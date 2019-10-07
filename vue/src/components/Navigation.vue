<template>
  <div>
    <b-list-group flush>
      <b-list-group-item
        v-for="(step, index) in steps"
        :key="index"
        :class="isSelected(index)"
      >{{ step.name }}</b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
export default {
  name: "Navigation",
  props: ["currentStep", "steps"],
  methods: {
    isSelected(index) {
      if (index === this.currentStep) {
        return "selected";
      }
      return "";
    }
  }
};
</script>
<style scoped>
.selected {
  background-color: var(--list-activeSelectionBackground);
}
.list-group {
  margin-bottom: 15px;
}
.list-group-item:hover {
  background: var(--list-hoverBackground);
  cursor: pointer;
}
</style>