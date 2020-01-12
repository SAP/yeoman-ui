<template>
  <div>
    <p class="question-label">{{currentQuestion.message}}</p>
    <v-radio-group :error-messages="isValid" v-model="currentQuestion.answer" row>
      <v-radio label="Yes" :value="true"></v-radio>
      <v-radio label="No" :value="false"></v-radio>
    </v-radio-group>
  </div>
</template>

<script>
export default {
  name: "QuestionConfirm",
  props: {
    currentQuestion: Object,
    isAnswerValid: Function
  },
  computed: {
    isValid() {
         return this.isAnswerValid(this.currentQuestion)
    }
  }
};
</script>

<style scoped>
div.v-input--radio-group {
  margin-top: 0;
}
</style>
