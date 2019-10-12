<template>
  <div>
    <b-form>
      <QuestionTypeSelector
        v-for="(item, index) in currentStep.questions"
        :key="index"
        :currentQuestion="item"
        :next="next"
        v-on:answer="onAnswer"
        v-on:generatorSelected="onGeneratorSelected"
      />
    </b-form>
  </div>
</template>

<script>
import QuestionTypeSelector from "./QuestionTypeSelector.vue";

export default {
  name: "Step",
  components: {
    QuestionTypeSelector
  },
  props: {
    currentStep: Object,
    currentQuestion: Object,
    next: Function
  },
  data() {
    return {
      answers: {}
    };
  },
  methods: {
    onAnswer: function(answerObject) {
      Object.assign(this.answers, answerObject);
    },
    onGeneratorSelected: function(generatorName) {
      this.$emit('generatorSelected', generatorName);
    }
  },
  watch: {
    currentStep: function (val) {
      this.answers = {};
      for (let i=0; i<val.questions.length-1; i++) {
        const question = val.questions[i];
        if (question.default) {
          let answerObject = {};
          answerObject[question.name] = question.default;
          Object.assign(this.answers, answerObject);
        }
      }
    }
  },
  mounted() {
  }
};
</script>