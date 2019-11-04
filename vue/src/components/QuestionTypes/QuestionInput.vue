<template>
  <b-form-input v-model="text" :type="currentQuestion.type | typeMapper" v-bind:placeholder="currentQuestion.default" :state="currentQuestion.isValid" aria-describedby="validation-message"></b-form-input>
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
  filters: {
    typeMapper: (val) => {
      // mapping between
      //   https://www.npmjs.com/package/inquirer#question
      // and
      //   https://bootstrap-vue.js.org/docs/components/form-input/
      if (val === 'input') {
        return 'text'
      } else {
        return val;
      }
    }
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