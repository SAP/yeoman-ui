<template>
  <div class="question-checkbox-container">

      <b-form-checkbox
        v-for="answer in currentQuestion.answers"
        :key="answer"
        :value="answer"
        :options="answer"
        name="flavour-3a"
      >{{ answer }}</b-form-checkbox>

  </div>
</template>
<script>
export default {
  name: "QuestionList",
  props: {
    currentQuestion: Object,
    selected: []
  },
  data() {
    return {
      selectedIndex: null,
      correctIndex: null,
      answered: false
    };
  },
  watch: {
    currentQuestion: {
      immediate: true,
      handler() {
        this.selectedIndex = null;
        this.answered = false;
      }
    }
  },
  methods: {
    answerClass(index) {
      let answerClass = "";
      if (!this.answered && this.selectedIndex === index) {
        answerClass = "selected";
      } else if (this.answered && this.correctIndex === index) {
        answerClass = "correct";
      } else if (
        this.answered &&
        this.selectedIndex === index &&
        this.correctIndex !== index
      ) {
        answerClass = "incorrect";
      }
      return answerClass;
    },
    selectAnswer(index) {
      this.selectedIndex = index;
    },
    submitAnswer() {
      this.answered = true;
    }
  },
  mounted() {
    if (this.currentQuestion.defaultAnswer) {
      this.selectedIndex = this.currentQuestion.defaultAnswer;
    }
  }
};
</script>

<style scoped>
.list-group {
  margin-bottom: 15px;
}
.list-group-item:hover {
  background: #eee;
  cursor: pointer;
}

.selected {
  background-color: lightblue;
}

.correct {
  background-color: lightgreen;
}

.incorrect {
  background-color: red;
}
</style>