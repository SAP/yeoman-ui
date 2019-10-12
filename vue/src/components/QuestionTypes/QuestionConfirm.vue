<template>
  <div class="question-confirm-container">
    <button type="button" v-on:click="onClick('yes')" @click="selected = 'yes'" class="btn btn-primary btn-sm mr-1">Yes</button>
    <button type="button" v-on:click="onClick('no')" @click="selected = 'no'" class="btn btn-secondary btn-sm">No</button>
  </div>
</template>
<script>
export default {
  name: "QuestionConfirm",
  props: {
    currentQuestion: Object
  },
  data() {
    return {
      selected: undefined
    };
  },
  methods: {
    onClick(answer) {
      let answerObject = {};
      answerObject[this.currentQuestion.name] = answer;
      this.$emit('answer', answerObject);
    }
  },
  watch: {
  },
  mounted() {
      if (this.currentQuestion.default === "yes") {
        this.selected = "yes";
      } else if (this.currentQuestion.default === "no") {
        this.selected = "no";
      } else {
        this.selected = undefined;
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