<template>
  <div class="question-checkbox-container">
    <b-form-checkbox-group
      v-model="selected"
      stacked
      :options="options"
    ></b-form-checkbox-group>
  </div>
</template>

<script>
import _ from "lodash"

export default {
  name: "QuestionCheckbox",
  computed: {
    options() {
      const values = this.currentQuestion.choices 
      if (_.isArray(values)) {
        return _.map(values, value => {
          if (_.has(value, "name") && !_.has(value, "text")) {
            value.text = value.name
          }
          return value
        })
      }

      return []
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
