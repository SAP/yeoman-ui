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

const selectAValue = "select a value --->";

export default {
  name: "QuestionList",
  data() {
    return {
      selected: null,
      providedChoiceSelected: false
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

        if (!this.providedChoiceSelected) {
          return _.concat([{name: selectAValue, text: selectAValue, disabled: true}], values);
        }

        return choiceValues;
      }

      return [];
    },
    default() {
      const values = this.options;
      const defaultValue = _.get(this.currentQuestion, "default");
      if (defaultValue) {
        if (_.isNumber(defaultValue) && defaultValue >= 0) {
          const choice = _.get(values, "[" + defaultValue + "]");
          return _.get(choice, "value", _.get(choice, "name", choice));
        } else if (_.isString(defaultValue)) {
          return defaultValue;
        }
      }

      return undefined;
    }
  },
  watch: {
    default: {
      immediate: true,
      handler: function(defaultValue) {
        this.selected = defaultValue || selectAValue;
      }
    },
    selected: {
      immediate: true,
      handler: function(selectedValue) {
        if (selectedValue && selectedValue !== selectAValue) {
          this.providedChoiceSelected = true;
          this.currentQuestion.answer = selectedValue;
          this.updateQuestionsFromIndex(this.questionIndex);
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
