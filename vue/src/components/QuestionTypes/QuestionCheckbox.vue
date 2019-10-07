<template>
  <div class="question-checkbox-container">

      <b-form-checkbox
        v-for="choice in currentQuestion.choices"
        :key="choice"
        :value="choice"
        :options="choice"
        name="flavour-3a"
      >{{ choice }}</b-form-checkbox>

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
    if (this.currentQuestion.default) {
      this.selectedIndex = this.currentQuestion.default;
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