<template>
  <div>
    <b-form-group :label="currentQuestion.message">
      <!-- TODO: support expand -->

      <GeneratorSelection v-if="currentQuestion.type==='generators'" :currentQuestion="currentQuestion" v-on:generatorSelected="selectGenerator"/>

      <QuestionInput v-if="currentQuestion.type==='input'" :currentQuestion="currentQuestion" />

      <QuestionList v-if="currentQuestion.type==='list'" :currentQuestion="currentQuestion" />

      <QuestionConfirm v-if="currentQuestion.type==='confirm'" :currentQuestion="currentQuestion" />

      <QuestionCheckbox v-if="currentQuestion.type==='checkbox'" :currentQuestion="currentQuestion" />
    </b-form-group>
  </div>
</template>

<script>
import QuestionList from "./QuestionTypes/QuestionList";
import QuestionInput from "./QuestionTypes/QuestionInput";
import QuestionConfirm from "./QuestionTypes/QuestionConfirm";
import QuestionCheckbox from "./QuestionTypes/QuestionCheckbox";
import GeneratorSelection from "./QuestionTypes/GeneratorSelection";

export default {
  name: "QuestionTypeSelector",
  components: {
    QuestionList,
    QuestionInput,
    QuestionConfirm,
    QuestionCheckbox,
    GeneratorSelection
  },
  props: {
    currentQuestion: Object,
    next: Function
  },
  data() {
    return {
      selectedIndex: null,
      correctIndex: null,
      shuffledAnswers: [],
      answered: false
    };
  },
  methods: {
    selectGenerator: function(generatorName) {
      this.$emit('generatorSelected', generatorName);
    }
  },
  mount() {}
};
</script>
<style scoped>
.btn {
  margin: 0 5px;
}
</style>