<template>
  <div class="question-list-container">

    <b-list-group>
      <b-list-group-item
        v-for="(answer, index) in currentQuestion.answers"
        :key="index"
        @click.prevent="selectAnswer(index)"
        :class="answerClass(index)"
      >{{ answer }}</b-list-group-item>
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
  background: var(--list-hoverBackground);
  cursor: pointer;
}

.selected {
  background-color: var(--list-activeSelectionBackground);
}

.correct {
  background-color: lightgreen;
}

.incorrect {
  background-color: red;
}
</style>