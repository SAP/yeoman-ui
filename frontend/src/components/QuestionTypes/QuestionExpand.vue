<template>
  <div id="question-expand">
    <p class="question-label">{{currentQuestion.message}}</p>
    <v-btn-toggle
      dense
      :error="!currentQuestion.isValid"
      :error-messages="isValid"
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
    <div v-if="!currentQuestion.isValid" class="error--text">{{currentQuestion.validationMessage}}</div>
  </div>
</template>

<script>
export default {
  name: "QuestionExpand",
  props: {
    currentQuestion: Object,
    isAnswerValid: Function
  },
  methods: {
    onClick(answer) {
      this.currentQuestion.answer = answer;
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
.error--text{
  font-size: 12px;
  padding-left: 12px;
}
</style>
