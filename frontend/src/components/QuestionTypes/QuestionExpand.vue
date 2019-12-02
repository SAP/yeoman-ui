<template>
  <div class="question-expand-container">
    <b-button-group vertical>
      <b-button
        v-for="(choice, index) in currentQuestion.choices"
        @click="onClick(choice.value)"
        :key="index"
      >{{ choice.name }}
      </b-button>
    </b-button-group>
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

</style>