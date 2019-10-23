<template>
  <div>
    <b-form-group :label="currentQuestion.message">
      <GeneratorSelection v-if="currentQuestion.type==='generators'" :currentQuestion="currentQuestion" v-on:answer="onAnswer" v-on:generatorSelected="onGeneratorSelected"/>

      <QuestionInput v-if="currentQuestion.type==='input'" :currentQuestion="currentQuestion" v-on:answer="onAnswer"/>

      <QuestionList v-if="currentQuestion.type==='list'" :currentQuestion="currentQuestion" />

      <QuestionConfirm v-if="currentQuestion.type==='confirm'" :currentQuestion="currentQuestion" v-on:answer="onAnswer" />

      <QuestionCheckbox v-if="currentQuestion.type==='checkbox'" :currentQuestion="currentQuestion" />

      <QuestionExpand v-if="currentQuestion.type==='expand'" :currentQuestion="currentQuestion" />
    </b-form-group>
  </div>
</template>

<script>
import QuestionList from "./QuestionTypes/QuestionList";
import QuestionInput from "./QuestionTypes/QuestionInput";
import QuestionConfirm from "./QuestionTypes/QuestionConfirm";
import QuestionCheckbox from "./QuestionTypes/QuestionCheckbox";
import QuestionExpand from "./QuestionTypes/QuestionExpand";
import GeneratorSelection from "./QuestionTypes/GeneratorSelection";

export default {
  name: "QuestionTypeSelector",
  components: {
    QuestionList,
    QuestionInput,
    QuestionConfirm,
    QuestionCheckbox,
    QuestionExpand,
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
    onAnswer: function(answerObject) {
      this.$emit('answer', answerObject);
    },
    onGeneratorSelected: function(generatorName) {
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