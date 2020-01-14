<template>
  <div id="question-expand">
    <p class="question-label">{{currentQuestion.message}}</p>
    <v-btn-toggle
      dense
      tile
      color="deep-purple accent-3"
    >
      <v-btn
        v-for="(choice, index) in currentQuestion.choices"
        @click="onClick(choice.value)"
        :key="index"
      >
        <span class="hidden-sm-and-down">{{ choice.name }}</span>
      </v-btn>
    </v-btn-toggle>
    <div v-if="!currentQuestion.isValid" class="error-validation-text">{{currentQuestion.validationMessage}}</div>
  </div>
</template>

<script>
export default {
  name: "QuestionExpand",
  props: {
    currentQuestion: Object,
    questionIndex: Number,
    updateQuestionsFromIndex: Function
  },
  methods: {
    onClick(answer) {
      this.currentQuestion.answer = answer;
      this.updateQuestionsFromIndex(this.questionIndex)
    }
  }
};
</script>

<style scoped>
div#question-expand {
  margin-bottom: 1.5rem;
}
div.v-btn-toggle:not(.v-btn-toggle--group) .v-btn.v-btn:not(.v-item--active) {
  background-color: var(--theia-list-activeSelectionBackground, #094771);
}
div.v-btn-toggle:not(.v-btn-toggle--group) .v-btn.v-btn.v-item--active {
  background-color: var(--vscode-button-background, #1976d2);
}
.v-btn-toggle {
  flex-direction: column;
}
</style>
