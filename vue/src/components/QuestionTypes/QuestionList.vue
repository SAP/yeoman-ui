<template>
  <div class="question-list-container">

    <b-list-group>
      <b-list-group-item
        v-for="(choice, index) in currentQuestion.choices"
        :key="index"
        @click.prevent="selectAnswer(index)"
        :class="answerClass(index)"
      >{{ choice }}</b-list-group-item>
    </b-list-group>

  </div>
</template>
<script>

export default {
  name: "QuestionList",
  props: {
    currentQuestion: Object
  },
  data() {
    return {
      correctIndex: null
    };
  },
  watch: {
    currentQuestion: {
      immediate: true,
      handler() {
        this.answered = false;
      }
    }
  },
  methods: {
    answerClass(index) {
      let answerClass = "";
      if (!this.answered && this.currentQuestion.answer === index) {
        answerClass = "selected";
      } else if (this.answered && this.correctIndex === index) {
        answerClass = "correct";
      } else if (
        this.answered &&
        this.currentQuestion.answer === index &&
        this.correctIndex !== index
      ) {
        answerClass = "incorrect";
      }
      return answerClass;
    },
    selectAnswer(index) {
      this.currentQuestion.answer = index;
    },
    submitAnswer() {
      this.answered = true;
    }
  },
  mounted() {
      if (this.currentQuestion.default) {
        this.currentQuestion.answer = this.currentQuestion.default;
      }
  }
};
</script>

<style scoped>
.list-group {
  margin-bottom: 15px;
}
.list-group-item:hover {
  background: var(--vscode-list-hover-background);
  cursor: pointer;
}

.selected {
  background-color: var(--vscode-list-active-selection-background);
}

.correct {
  background-color: lightgreen;
}

.incorrect {
  background-color: red;
}
</style>