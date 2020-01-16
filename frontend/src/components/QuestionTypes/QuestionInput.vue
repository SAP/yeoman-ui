<template>
  <div id="question-input">
    <p class="question-label">{{currentQuestion.message}}</p>
    <v-text-field @blur="onChange"
      @keyup.enter="onChange"
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
    currentQuestion: Object,
    questionIndex: Number,
    updateQuestionsFromIndex: Function
  },
  data() {
    return {
      text: undefined
    };
  },
  computed: {
    type() {
      const type = this.currentQuestion.type;
      return type === "input" ? "text" : type;
    }
  },
  methods: {
    onChange() {
      this.currentQuestion.answer = _.isEmpty(this.text) ? _.get(this.currentQuestion, "default") : this.text;
      this.updateQuestionsFromIndex(this.questionIndex);
    }
  }
};
</script>
<style scoped>
#question-input >>> div.v-input__slot {
  color: var(--vscode-input-foreground, #cccccc) !important;
  background-color: var(--vscode-input-background, #3c3c3c) !important;
  border-radius: unset !important;
  border: 1px solid  var(--vscode-editorWidget-background, #252426);
  box-shadow: none;
}
#question-input >>> div.v-input__slot .v-select__selection {
  color: var(--vscode-input-foreground, #cccccc) !important;
}
.theme--light.v-input:not(.v-input--is-disabled) >>> input{
  color: var(--vscode-input-foreground, #cccccc);
}
</style>