<template>
  <b-form-select v-model="currentQuestion.answer" :options="currentQuestion.choices | listFilter" aria-describedby="validation-message">
  </b-form-select>
</template>
<script>
export default {
  name: "QuestionList",
  filters: {
    listFilter: (value) => {
      if (Array.isArray(value)) {
        return value.map((currentValue) => {
          if (currentValue.hasOwnProperty('name') && !currentValue.hasOwnProperty('text')) {
            currentValue.text = currentValue.name;
          } else if (currentValue.hasOwnProperty('type') && currentValue.type === "separator") {
            if (currentValue.hasOwnProperty('line')) {
              currentValue.text = currentValue.line;
              currentValue.disabled = true;
            }
          }
          return currentValue;
        });
      }
    }
  },
  methods: {
    formatList: (value) => {
      if (Array.isArray(value)) {
        return value.map((currentValue) => {
          if (currentValue.hasOwnProperty('name') && !currentValue.hasOwnProperty('text')) {
            currentValue.text = currentValue.name;
          }
          return currentValue;
        });
      }
    }
  },
  props: {
    currentQuestion: Object
  },
  watch: {
    'currentQuestion.choices': {
      handler() {
        if (typeof this.currentQuestion.default === 'number' && typeof this.currentQuestion.answer === 'number') {
          const formattedList = this.formatList(this.currentQuestion.choices);
          if (formattedList) {
            const choiceObject = formattedList[this.currentQuestion.default];
            if (choiceObject) {
              this.currentQuestion.answer = choiceObject.text;
            }
          }
        }
      }
    }
  },
  mounted() {
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