<template>
  <div class="question-checkbox-container">
    <b-form-checkbox-group
      v-model="selected"
      stacked
      :options="currentQuestion.choices | checkboxFilter"
    ></b-form-checkbox-group>
  </div>
</template>

<script>
import _ from "lodash"

export default {
  name: "QuestionCheckbox",
  filters: {
    checkboxFilter: value => {
      if (_.isArray(value)) {
        return value.map(currentValue => {
          if (_.has(currentValue, "name") && !_.has(currentValue, "text")) {
            currentValue.text = currentValue.name
          }
          return currentValue
        })
      }
    }
  },
  props: {
    currentQuestion: Object
  },
  data() {
    const selected = _.compact(
      _.map(this.currentQuestion.choices, choice => {
        if (choice.checked) {
          return choice.value
        }
      })
    )

    this.currentQuestion.answer = selected

    return {
      selected: selected
    }
  },
  watch: {
    selected: {
      handler(val) {
        this.currentQuestion.answer = val
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
  background: #eee;
  cursor: pointer;
}

.selected {
  background-color: lightblue;
}

.correct {
  background-color: lightgreen;
}

.incorrect {
  background-color: red;
}
</style>
