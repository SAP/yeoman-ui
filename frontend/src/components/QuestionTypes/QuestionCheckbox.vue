<template>
  <div>
    <p class="question-label">{{currentQuestion.message}}</p>
    <div v-for="(option,index) in options" :key="options[index].text">
      <v-checkbox
        v-model="selected"
        :value="option.value || option"
        :label="option.text || option"
        dense
      ></v-checkbox>
    </div>
    <div v-if="!currentQuestion.isValid" class="error-validation-text">{{currentQuestion.validationMessage}}</div>
  </div>
</template>

<script>
import _ from "lodash";

export default {
  name: "QuestionCheckbox",
  computed: {
    options() {
      const values = this.currentQuestion.choices;
      if (_.isArray(values)) {
        return _.map(values, value => {
          if (_.has(value, "name") && !_.has(value, "text")) {
            value.text = value.name;
          }
          return value;
        });
      }

      return [];
    }
  },
  props: {
    currentQuestion: Object,
    questionIndex: Number,
    updateQuestionsFromIndex: Function
  },
  data() {
    const selected = _.compact(
      _.map(this.currentQuestion.choices, choice => {
        if (choice.checked) {
          return choice.value;
        }
      })
    );

    this.currentQuestion.answer = selected;

    return {
      selected: selected
    };
  },
  watch: {
    selected: {
      handler(val) {
        this.currentQuestion.answer = val;
        this.updateQuestionsFromIndex(this.questionIndex)
      }
    }
  }
};
</script>

<style scoped>
div.v-input--checkbox {
  margin-top: 0;
}
div.v-input--checkbox >>> div.v-input__slot {
  margin-bottom: 0;
}
</style>
