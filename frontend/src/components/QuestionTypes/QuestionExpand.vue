<template>
  <div id="question-expand">
    <p class="question-label">{{currentQuestion.message}}</p>
    <v-btn-toggle v-model="icon" tile color="deep-purple accent-3">
      <v-btn
        v-for="(choice, index) in currentQuestion.choices"
        @click="onClick(choice.value)"
        :key="index"
      >
        <span class="hidden-sm-and-down">{{ choice.name }}</span>
      </v-btn>
    </v-btn-toggle>
  </div>
</template>

<script>
export default {
  name: "QuestionExpand",
  props: {
    currentQuestion: Object
  },
  methods: {
    onClick(answer) {
      this.currentQuestion.answer = answer;
    }
  }
};
</script>

<style scoped>
div#question-expand{
  margin-bottom: 1.5rem;
}
div.v-btn-toggle:not(.v-btn-toggle--group) .v-btn.v-btn:not(.v-item--active) {
  background-color: var(--vscode-input-background, #3c3c3c);
}
div.v-btn-toggle:not(.v-btn-toggle--group) .v-btn.v-btn.v-item--active {
  background-color: var(--vscode-button-background, #1976d2);
}
</style>
