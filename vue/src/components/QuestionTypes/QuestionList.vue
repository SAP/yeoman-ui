<template>
  <div class="question-list-container">
    <b-form-select v-model="currentQuestion.answer" :options="currentQuestion.choices | formatList"></b-form-select>
  </div>
</template>
<script>
export default {
  name: "QuestionList",
  filters: {
    formatList: function(value) {
      return value.map((currentValue) => {
        if (currentValue.hasOwnProperty('name') && !currentValue.hasOwnProperty('text')) {
          currentValue.text = currentValue.name;
        }
        return currentValue;
      });
    }
  },
  props: {
    currentQuestion: Object
  },
  mounted() {
    this.currentQuestion.default ? this.currentQuestion.answer = this.currentQuestion.default : undefined;
  }
};
</script>

<style scoped>
.list-group {
  margin-bottom: 15px;
}
.list-group-item:hover {
  background: var(--vscode-list-hover-background);
  cursor: pointer;
}

.selected {
  background-color: var(--vscode-list-active-selection-background);
}

</style>