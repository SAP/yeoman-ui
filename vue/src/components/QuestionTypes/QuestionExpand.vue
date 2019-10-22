<template>
  <div class="question-expand-container">
    <b-button-group>
      <b-button
        v-for="(choice, index) in currentQuestion.choices"
        @click="onClick()"
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
  data() {
    return {
      selected: undefined
    };
  },
  methods: {
    onClick(answer) {
      this.currentQuestion.answer = answer;
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