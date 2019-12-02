<template>
  <b-form-textarea
    v-model="text"
    :placeholder="currentQuestion.default"
    class="yeoman-form-control"
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
