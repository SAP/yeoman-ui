<template>
  <div>
    <p class="question-label">{{currentQuestion.message}}</p>
      <div v-for="(option,index) in options" :key="options[index].text">
        <v-checkbox 
      :error-messages="isValid" :hide-details="index !== (options.length - 1)" dense :label="option.text || option" v-model="option.selected"></v-checkbox>
      </div>
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
    },
    isValid() {
         return this.isAnswerValid(this.currentQuestion)
    }
  },
  props: {
    currentQuestion: Object,
    isAnswerValid: Function
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
      }
    }
  }
};
</script>

<style scoped>
div.v-input--checkbox{
  margin-top: 0;
}
div.v-input--checkbox >>> div.v-input__slot{
  margin-bottom: 0;
  align-items: flex-start;
}
</style>
