<template>
  <div>
    <p class="question-label">{{currentQuestion.message}}</p>
    <v-radio-group
      :error-messages="currentQuestion.isValid ? '' : currentQuestion.validationMessage"
      v-model="currentQuestion.answer"
      row
      dense
    >
      <v-radio label="Yes" :value="true" ></v-radio>
      <v-radio label="No" :value="false"></v-radio>
    </v-radio-group>
    
  </div>
</template>

<script>
export default {
  name: "QuestionConfirm",
  props: {
    currentQuestion: Object,
    questionIndex: Number,
    updateQuestionsFromIndex: Function
  },
  watch: {
    "currentQuestion.answer": {
      handler() {
        this.updateQuestionsFromIndex(this.questionIndex)
      }
    }
  }
};
</script>

<style scoped>
div.v-input--radio-group {
  margin-top: 0;
}
</style>
