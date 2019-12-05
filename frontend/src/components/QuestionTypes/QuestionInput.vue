<template>
  <b-form-input
    v-model="text"
    :type="type"
    :placeholder="currentQuestion.default"
    class="yeoman-form-control"
    aria-describedby="validation-message"
  ></b-form-input>
</template>

<script>
import _ from "lodash"

export default {
  name: "QuestionInput",
  props: {
    currentQuestion: Object
  },
  data() {
    return {
      text: undefined
    }
  },
  computed: {
    type() {
      // mapping between
      //   https://www.npmjs.com/package/inquirer#question
      // and
      //   https://bootstrap-vue.js.org/docs/components/form-input/
      // const questionType = _.get(this.currentQuestion, "type")
      const type = this.currentQuestion.type
      return type === "input" ? "text" : type
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
}
</script>
