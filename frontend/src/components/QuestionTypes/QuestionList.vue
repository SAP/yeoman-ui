<template>
  <b-form-select
    v-model="currentQuestion.answer"
    :options="currentQuestion.choices | listFilter"
    class="custom-yeoman-select"
    aria-describedby="validation-message"
  ></b-form-select>
</template>

<script>
import _ from 'lodash'

export default {
  name: "QuestionList",
  filters: {
    listFilter: values => {
      if (_.isArray(values)) {
        return _.map(values, value => {
          if (_.has(value, "name") && !_.has(value, "text")) {
            value.text = value.name
          } else if (value.type === "separator") {
            value.text = _.has(value, "line") ? value.line : "──────────────"
            value.disabled = true
          }
          return value
        })
      }
    }
  },
  methods: {
    formatList: values => {
      if (_.isArray(values)) {
        return _.map(values, value => {
          if (_.has(value, "name") && !_.has(value, "text")) {
            value.text = value.name
          }
          return value
        })
      }
    }
  },
  props: {
    currentQuestion: Object
  },
  watch: {
    "currentQuestion.choices": {
      handler() {
        if (_.isNumber(this.currentQuestion.default) && _.isNumber(this.currentQuestion.answer)) {
          const formattedList = this.formatList(this.currentQuestion.choices)
          if (formattedList) {
            const choiceObject = formattedList[this.currentQuestion.default]
            if (choiceObject) {
              this.currentQuestion.answer = choiceObject.text
            }
          }
        }
      }
    }
  }
}
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

.custom-select.custom-yeoman-select {
  color: var(--vscode-input-foreground, #cccccc);
  background-color: var(--vscode-input-background, #3c3c3c);
}
</style>
