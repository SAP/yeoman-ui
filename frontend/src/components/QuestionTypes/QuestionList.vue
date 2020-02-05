<template>
  <div id="question-list">
    <p class="question-label">{{currentQuestion.message}}</p>
    <v-select
      :label="clickToDisplay"
      :error-messages="errorMessages"
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

export default {
  name: "QuestionList",
  data() {
    return {
      selected: null,
      clickToDisplay: "Click to display the list of options"
    };
  },
  computed: {
    options() {
      const values = this.currentQuestion.choices;
      if (_.isArray(values)) {
        return _.map(values, value => {
          if (_.has(value, "name") && !_.has(value, "text")) {
            value.text = value.name;
          } else if (value.type === "separator") {
            value.text = _.has(value, "line") ? value.line : "──────────────";
            value.disabled = true;
          }
          return value;
        });
      }

      return [];
    },
    default() {
      const defaultValue = _.get(this.currentQuestion, "default");
      if (_.isNumber(defaultValue)) {
        const choice = _.get(this.options, "[" + defaultValue + "]");
        return _.get(choice, "value", _.get(choice, "name", choice));
      } else if (_.isString(defaultValue)) {
        return defaultValue;
      }
      return undefined;
    },
    errorMessages() {
      if (_.isEmpty(this.selected)) {
        return this.clickToDisplay;
      }
      
      return this.currentQuestion.isValid ? '' : this.currentQuestion.validationMessage;
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
      immediate: true,
      handler: function(selectedValue) {
        this.currentQuestion.isValid = !_.isEmpty(selectedValue)
        this.currentQuestion.answer = selectedValue
        this.updateQuestionsFromIndex(this.questionIndex)
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
