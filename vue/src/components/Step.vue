<template>
  <div>
    <b-form>
      <QuestionTypeSelector
        v-for="(item, index) in currentPrompt.questions"
        :key="index"
        :currentQuestion="item"
        v-on:generatorSelected="onGeneratorSelected"
      />
    </b-form>

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
    currentPrompt: Object
  },
  methods: {
    onGeneratorSelected: function(generatorName) {
      this.$emit("generatorSelected", generatorName);
    },
    isAllValidated() {
      const invalidQuestions = _.filter(this.currentPrompt.questions, question => {
        return question.isValid === false;
      });
      return _.isEmpty(invalidQuestions);
    }
  },
  watch: {
    'currentPrompt.questions': {
      //immediate: true,
      deep: true,
      handler() {
        if (this.currentPrompt) {
          const invalidQuestions = _.filter(this.currentPrompt.questions, question => {
          return question.isValid === false;
          });
          let isValidated = _.isEmpty(invalidQuestions);
          this.$emit('stepvalidated', isValidated);
        }
      }
    }
  },
  mounted() {}
};
</script>
