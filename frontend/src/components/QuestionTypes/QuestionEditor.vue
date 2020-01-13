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
    currentQuestion: Object
  },
  data() {
    return {
      text: undefined
    }
  },
  watch: {
    text: {
      handler(val) {
        this.currentQuestion.answer =
          _.size(val) === 0 ? _.get(this.currentQuestion, "default") : val
      }
    }
  }
};
</script>
<style scoped>
#question-editor >>> div.v-input__slot {
  background-color: var(--vscode-input-background, #3c3c3c);
  border-radius: unset; 
}
 .v-textarea.v-input:not(.v-input--is-disabled) >>> textarea{
  color: var(--vscode-input-foreground, #cccccc);
}
</style>