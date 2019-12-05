<template>
  <b-form-select
    v-model="selected"
    :options="options"
    class="custom-yeoman-select"
    aria-describedby="validation-message"
  ></b-form-select>
</template>

<script>
import _ from "lodash"

export default {
  name: "QuestionList",
  data() {
    return {
      selected: null
    }
  },
  computed: {
    options() {
      const values = this.currentQuestion.choices
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

      return []
    },
    default() {
      const defaultValue = _.get(this.currentQuestion, "default", 0)
      if (_.isNumber(defaultValue)) {
        const choice = _.get(this.options, "[" + defaultValue + "]")
        return _.get(choice, "value", _.get(choice, "name", choice))
      } else if (_.isString(defaultValue)) {
        return defaultValue
      }
      return undefined
    }
  },
  watch: {
    'default': {
      immediate: true,
      handler: function(defaultValue) {
        this.selected = defaultValue
      }
    },
    'selected': {
      handler: function(selectedvalue) {
        this.currentQuestion.answer = selectedvalue
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
