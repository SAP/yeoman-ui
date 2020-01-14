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

export default {
  name: "QuestionList",
  data() {
    return {
      selected: null
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
      const defaultValue = _.get(this.currentQuestion, "default", 0);
      if (_.isNumber(defaultValue)) {
        const choice = _.get(this.options, "[" + defaultValue + "]");
        return _.get(choice, "value", _.get(choice, "name", choice));
      } else if (_.isString(defaultValue)) {
        return defaultValue;
      }
      return undefined;
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
      handler: function(selectedvalue) {
        this.currentQuestion.answer = selectedvalue;
      }
    }
  },
  props: {
    currentQuestion: Object
  }
};
</script>
<style scoped>
#question-list >>> div.v-input__slot {
  color: var(--vscode-input-foreground, #cccccc) !important;
  background-color: var(--vscode-input-background, #3c3c3c) !important;
  border-radius: unset;
  box-shadow: 0px 0px 1px -2px rgba(0, 0, 0, 0.2), 0px 0px 2px 0px rgba(0, 0, 0, 0.14), 0px 0px 5px 0px rgba(0, 0, 0, 0.12);
}

</style>
