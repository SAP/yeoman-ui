<template>
  <div id="step-component-div">
      <QuestionTypeSelector
        :questions="currentPrompt.questions"
        :selectGenerator="selectGenerator"
        :updateQuestionsFromIndex="updateQuestionsFromIndex"
      />
  </div>
</template>

<script>
import QuestionTypeSelector from "./QuestionTypeSelector.vue";
import * as _ from "lodash";
export default {
  name: "Step",
  components: {
    QuestionTypeSelector
  },
  props: {
    currentPrompt: Object,
    updateQuestionsFromIndex: Function,
    selectGenerator: Function
  },
  watch: {
    "currentPrompt.questions": {
      deep: true,
      handler() {
        const invalidQuestions = _.filter(this.currentPrompt.questions, question => {
          return (question.isWhen === true) &&
                 ((question.isValid === false) || 
                  (_.includes(["list", "rawlist"], question.type) && _.isEmpty(question.answer)));
        });
        this.$emit("stepvalidated", _.isEmpty(invalidQuestions));
      }
    }
  }
}
</script>
