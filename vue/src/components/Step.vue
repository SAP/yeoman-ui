<template>
  <div>
    <QuestionTypeSelector v-for="(item, index) in currentStep.questions" :key="index" :currentQuestion="item" :next="next" />
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
    return {};
  }
};
</script>