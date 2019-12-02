<template>
  <div>
    <b-form>
      <QuestionTypeSelector
        v-for="(item, index) in currentPrompt.questions"
        :key="index"
        :currentQuestion="item"
        @generatorSelected="onGeneratorSelected"
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
      this.$emit("generatorSelected", generatorName)
    }
  },
  watch: {
    "currentPrompt.questions": {
      deep: true,
      handler() {
        const invalidQuestions = _.filter(this.currentPrompt.questions, question => {
            return question.isValid === false
        })
        this.$emit("stepvalidated", _.isEmpty(invalidQuestions))
      }
    }
  }
}
</script>
