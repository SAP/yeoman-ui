<template>
  <b-form-textarea
    v-model="text"
    v-bind:placeholder="currentQuestion.default"
    aria-describedby="validation-message"
  ></b-form-textarea>
</template>

<script>
import _ from "lodash"

export default {
  name: "QuestionEditor",
  props: {
    currentQuestion: Object
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
