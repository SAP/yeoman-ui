<template>
  <div>
    <b-form>
      <QuestionTypeSelector
        v-for="(item, index) in currentPrompt.questions"
        :key="index"
        :currentQuestion="item"
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
    currentPrompt: Object
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
      this.$emit("generatorSelected", generatorName);
    }
  },
  watch: {
    'currentPrompt.questions': {
      //  immediate: true,
      deep: true,
      handler() {
        // TODO: this is currently not trigerred when pending prompt receives actual questions, so Next button does not get enabled
        //count number of answers
        let counter = 0;
        if (this.currentPrompt) {
          // TODO: ignore when questions where when() returns false
          this.currentPrompt.questions.forEach(question => {
            if (question.answer!==undefined) counter++;
          });
          // TODO: do not enable next button when invalid answers exist
          this.currentPrompt.allAnswered = (counter === this.currentPrompt.questions.length);
        }
      }
    }
  },
  mounted() {}
};
</script>