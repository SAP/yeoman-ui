<template>
  <div class="question-confirm-container">

    <b-list-group>
      <b-list-group-item @click="selected = 'yes'" :class="{selected:selected == 'yes'}">Yes</b-list-group-item>
      <b-list-group-item @click="selected = 'no'" :class="{selected:selected == 'no'}">No</b-list-group-item>
    </b-list-group>
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
  },
  watch: {
  },
  mounted() {
      if (this.currentQuestion.defaultAnswer === "yes") {
        this.selected = "yes";
      } else if (this.currentQuestion.defaultAnswer === "no") {
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