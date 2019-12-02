<template>
  <b-form-textarea v-model="text" v-bind:placeholder="currentQuestion.default" aria-describedby="validation-message"></b-form-textarea>
</template>
<script>
export default {
  name: "QuestionEditor",
  props: {
    currentQuestion: Object
  },
  watch: {
    text: {
      handler(val) {
        if (val.length === 0) {
          if (this.currentQuestion.default) {
            this.currentQuestion.answer = this.currentQuestion.default;
          } else {
            this.currentQuestion.answer = undefined;
          }
        } else {
          this.currentQuestion.answer = val;
        }
      }
    }
  }
};
</script>