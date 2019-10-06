<template>
  <div class="question-input-container">

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
      text: ()=>{
          // console.log(te);
      }
  }
};
</script>