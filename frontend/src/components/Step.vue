<template>
  <div id="step-component-div">
    <div>
      <v-card-title>{{currentPrompt.name}}</v-card-title>
      <v-card-subtitle>{{currentPrompt.description}}</v-card-subtitle>
    </div>
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
            return (question.isValid === false && question.isWhen === true)
        })
        this.$emit("stepvalidated", _.isEmpty(invalidQuestions))
      }
    }
  }
}
</script>
<style scoped>
.v-card__title {
  color: var(--vscode-foreground, #cccccc);
}
.v-card__subtitle {
  color: var(--vscode-editorCodeLens-foreground, #999999);
  white-space:pre-wrap;
}

</style>