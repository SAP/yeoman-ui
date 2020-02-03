<template>
  <div id="question-list">
    <p class="question-label">{{currentQuestion.message}}</p>
    <v-select
      :error-messages="currentQuestion.isValid ? '' : currentQuestion.validationMessage"
      v-model="selected"
      :items="options"
      aria-describedby="validation-message"
      solo
      dense
    ></v-select>
  </div>
</template>

<script>
import _ from "lodash";

const emptyValue = "select a value --->";

export default {
  name: "QuestionList",
  data() {
    return {
      selected: null,
      afterFirstSelection: false
    };
  },
  computed: {
    options() {
      const values = this.currentQuestion.choices;
      if (_.isArray(values)) {
        const choiceValues = _.map(values, value => {
          if (_.has(value, "name") && !_.has(value, "text")) {
            value.text = value.name;
          } else if (value.type === "separator") {
            value.text = _.has(value, "line") ? value.line : "──────────────";
            value.disabled = true;
          }
          return value;
        });

        if (this.afterFirstSelection === false) {
          choiceValues.unshift({name: emptyValue, text: emptyValue, disabled: true});
        }

        return choiceValues;
      }

      return [];
    },
    default() {
      const defaultValue = _.get(this.currentQuestion, "default", emptyValue);
      if (_.isNumber(defaultValue) && defaultValue >= 0) {
        const choice = _.get(this.options, "[" + defaultValue + "]");
        return _.get(choice, "value", _.get(choice, "name", choice));
      } 
      
      return _.isString(defaultValue) ? defaultValue : undefined;
    }
  },
  watch: {
    default: {
      immediate: true,
      handler: function(defaultValue) {
        this.selected = defaultValue;
      }
    },
    selected: {
      handler: function(selectedvalue) {
        if (selectedvalue && selectedvalue !== emptyValue) {
          this.afterFirstSelection = true;
          this.currentQuestion.answer = selectedvalue
          this.updateQuestionsFromIndex(this.questionIndex)
        }
      }
    }
  },
  props: {
    currentQuestion: Object,
    questionIndex: Number,
    updateQuestionsFromIndex: Function
  }
};
</script>

<style scoped>
#question-list >>> div.v-input__slot {
  color: var(--vscode-input-foreground, #cccccc) !important;
  background-color: var(--vscode-input-background, #3c3c3c) !important;
  border-radius: unset;
  border: 1px solid  var(--vscode-editorWidget-background, #252526);
  box-shadow: none;
}
</style>
