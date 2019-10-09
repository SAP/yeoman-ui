<template>
  <div>
    <b-form>
      <QuestionTypeSelector
        v-for="(item, index) in currentStep.questions"
        :key="index"
        :currentQuestion="item"
        :next="next"
        v-on:generatorSelected="selectGenerator"
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
    return {};
  },
  methods: {
    selectGenerator: function(generatorName) {
      this.$emit('generatorSelected', generatorName);
    }
  }
};
</script>