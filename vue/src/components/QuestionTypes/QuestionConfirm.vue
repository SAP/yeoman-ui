<template>
  <div class="question-confirm-container">
    <b-form-radio-group v-model="currentQuestion.answer">
      <b-form-radio
        value=true
      >Yes</b-form-radio>
      <b-form-radio
        value=false
      >No</b-form-radio>
    </b-form-radio-group>
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
    };
  },
  methods: {
  },
  watch: {
  },
  mounted() {
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