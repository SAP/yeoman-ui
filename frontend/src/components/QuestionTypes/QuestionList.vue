<template>
  <b-form-select
    v-model="currentQuestion.answer"
    :options="options"
    class="custom-yeoman-select"
    aria-describedby="validation-message"
  ></b-form-select>
</template>

<script>
import _ from 'lodash'

export default {
  name: "QuestionList",
  beforeUpdate() {
    this.setDefaultAnswer()
  },
  computed: {
    options() {
      const values = this.currentQuestion.choices
      if (_.isArray(values)) {
        return _.map(values, (value) => {
          if (_.has(value, "name") && !_.has(value, "text")) {
            value.text = value.name
          } else if (value.type === "separator") {
            value.text = _.has(value, "line") ? value.line : "──────────────"
            value.disabled = true
          }
          return value
        })
      }

      return []
    }
  },
  methods: {
    setDefaultAnswer() {
      if (_.isNumber(this.currentQuestion.answer)) {
        const defaultAnswer = _.get(this.options, "[" + this.currentQuestion.default + "].text")
        if (defaultAnswer) {
          this.currentQuestion.answer = defaultAnswer
        }
      }
    }
  },
  props: {
    currentQuestion: Object
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
