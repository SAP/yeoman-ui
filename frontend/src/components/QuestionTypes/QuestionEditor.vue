<template>
<div id="question-editor">
  <p class="question-label">{{currentQuestion.message}}</p>
  <v-textarea
    solo
    v-model="text"
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
    questionIndex: Number
  },
  data() {
    return {
      text: undefined
    }
  },
  watch: {
    text: {
      handler(val) {
        this.currentQuestion.answer = _.size(val) === 0 ? _.get(this.currentQuestion, "default") : val
        this.$emit('changedQuestionIndex', this.questionIndex)
      }
    }
  }
};
</script>
<style scoped>
#question-editor >>> div.v-input__slot {
  background-color: var(--vscode-input-background, #3c3c3c);
  box-shadow: 0px 0px 1px -2px rgba(0, 0, 0, 0.2), 0px 0px 2px 0px rgba(0, 0, 0, 0.14), 0px 0px 5px 0px rgba(0, 0, 0, 0.12);
  border-radius: unset; 
}
 .v-textarea.v-input:not(.v-input--is-disabled) >>> textarea{
  color: var(--vscode-input-foreground, #cccccc);
}
</style>