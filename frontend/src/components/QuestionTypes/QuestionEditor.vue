<template>
<div id="question-editor">
  <p class="question-label">{{currentQuestion.message}}</p>
  <v-textarea
    solo
    rows=7
    v-model="text"
    @blur="onChange"
    @keyup.enter="onChange"
    :placeholder="currentQuestion.default"
    class="yeoman-form-control"
    aria-describedby="validation-message"
    :error-messages="currentQuestion.isValid ? '' : currentQuestion.validationMessage"
  ></v-textarea>
</div>
</template>

<script>
import _ from "lodash"

export default {
  name: "QuestionEditor",
  props: {
    currentQuestion: Object,
    questionIndex: Number,
    updateQuestionsFromIndex: Function
  },
  data() {
    return {
      text: undefined
    }
  },
  methods: {
    onChange() {
      const currentValue = _.isEmpty(this.text) ? _.get(this.currentQuestion, "default") : this.text;
      if (this.currentQuestion.answer !== currentValue) {
        this.currentQuestion.answer = currentValue;
        this.updateQuestionsFromIndex(this.questionIndex);
      }
    }
  }
};
</script>
<style scoped>
#question-editor >>> div.v-input__slot {
  background-color: var(--vscode-input-background, #3c3c3c);
  border: 1px solid  var(--vscode-editorWidget-background, #252426);
  box-shadow: none;
  border-radius: unset; 
}
 .v-textarea.v-input:not(.v-input--is-disabled) >>> textarea{
  color: var(--vscode-input-foreground, #cccccc);
}
</style>