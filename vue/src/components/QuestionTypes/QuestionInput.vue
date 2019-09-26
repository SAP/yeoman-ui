<template>
  <div class="question-input-container">
    <hr class="my-input-question" />

    <b-form-input v-model="text" v-bind:placeholder="currentQuestion.default_answer"></b-form-input>

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
  watch: {
      text: (te)=>{
          console.log(te);
      }
  }
};
</script>