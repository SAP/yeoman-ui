<template>
  <div>
    <b-form-group :label="currentQuestion.message" :disabled="!currentQuestion.isWhen">
      <GeneratorSelection v-if="currentQuestion.type==='generators'" :currentQuestion="currentQuestion" v-on:generatorSelected="onGeneratorSelected"/>

      <QuestionInput v-if="currentQuestion.type==='input' || currentQuestion.type==='password' || currentQuestion.type==='number'" :currentQuestion="currentQuestion" />

      <QuestionList v-if="currentQuestion.type==='list'" :currentQuestion="currentQuestion" />

      <QuestionConfirm v-if="currentQuestion.type==='confirm'" :currentQuestion="currentQuestion" />

      <QuestionCheckbox v-if="currentQuestion.type==='checkbox'" :currentQuestion="currentQuestion" />

      <QuestionExpand v-if="currentQuestion.type==='expand'" :currentQuestion="currentQuestion" />
  
      <div id='validation-message' class='invalid-feedback'>{{currentQuestion.validationMessage}}</div>

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
    currentQuestion: Object
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