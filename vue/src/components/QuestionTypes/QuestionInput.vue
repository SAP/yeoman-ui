<template>
  <div class="question-input-container">
    <b-form-input v-model="text" v-bind:placeholder="currentQuestion.default" :state="validateInput" aria-describedby="validation-message"></b-form-input>
    <div id='validation-message' class='invalid-feedback'>{{currentQuestion.validationMessage}}</div>
  </div>
</template>
<script>
export default {
  name: "QuestionInput",
  props: {
    currentQuestion: Object
  },
  data() {
    return {
      text: null
    };
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
  },
  computed: {
    validateInput() {
      return this.currentQuestion.isValid;
    }
  },
  mounted() {
  }
};
</script>