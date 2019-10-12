<template>
  <div class="question-input-container">

    <b-form-input
      v-model="text"
      @change="onChange"
      v-bind:placeholder="currentQuestion.default"
    ></b-form-input>

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
          text :null
      }
  },
  methods: {
    onChange(val) {
      let answerObject = {};
      answerObject[this.currentQuestion.name] = val;
      this.$emit('answer', answerObject);
    }
  }
};
</script>