<template>
  <div class="question-checkbox-container">
    <b-form-checkbox-group v-model="selected">
      <b-form-checkbox
        v-for="choice in currentQuestion.choices"
        :key="choice.name"
        :value="choice.value"
      >{{ choice.name }}</b-form-checkbox>
    </b-form-checkbox-group>
  </div>
</template>
<script>
export default {
  name: "QuestionList",
  props: {
    currentQuestion: Object
  },
  data() {
    const selected = [];
    this.currentQuestion.choices.forEach(choice => {
      if (choice.checked) {
        selected.push(choice.value);
      }
    });
    this.currentQuestion.answer =  selected;

    return {
      selected: selected
    };
  },
  watch: {
    selected: {
      handler(val) {
          this.currentQuestion.answer = val;
      }
    }
  },
  mounted() {}
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