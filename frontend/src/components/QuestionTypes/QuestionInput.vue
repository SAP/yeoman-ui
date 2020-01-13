<template>
  <div id="question-input">
    <p class="question-label">{{currentQuestion.message}}</p>
    <v-text-field
      v-model="text"
      :type="type"
      :placeholder="currentQuestion.default"
      class="yeoman-form-control"
      aria-describedby="validation-message"
      solo
      dense
      :error-messages="currentQuestion.isValid ? '' : currentQuestion.validationMessage"
    ></v-text-field>
  </div>
</template>

<script>
import _ from "lodash";

export default {
  name: "QuestionInput",
  props: {
    currentQuestion: Object
  },

  data() {
    return {
      text: undefined
    };
  },
  computed: {
    type() {
      // mapping between
      //   https://www.npmjs.com/package/inquirer#question
      // and
      //   https://bootstrap-vue.js.org/docs/components/form-input/
      // const questionType = _.get(this.currentQuestion, "type")
      const type = this.currentQuestion.type;
      return type === "input" ? "text" : type;
    }
  },
  watch: {
    text: {
      handler(val) {
        this.currentQuestion.answer =
          _.size(val) === 0 ? _.get(this.currentQuestion, "default") : val;
      }
    }
  }
};
</script>
<style scoped>
#question-input >>> div.v-input__slot {
  color: var(--vscode-input-foreground, #cccccc) !important;
  background-color: var(--vscode-input-background, #3c3c3c) !important;
  border-radius: unset !important;
      box-shadow: 0px 0px 1px -2px rgba(0, 0, 0, 0.2), 0px 0px 2px 0px rgba(0, 0, 0, 0.14), 0px 0px 5px 0px rgba(0, 0, 0, 0.12);
}
#question-input >>> div.v-input__slot .v-select__selection {
  color: var(--vscode-input-foreground, #cccccc) !important;
}
.theme--light.v-input:not(.v-input--is-disabled) >>> input{
  color: var(--vscode-input-foreground, #cccccc);
}
</style>