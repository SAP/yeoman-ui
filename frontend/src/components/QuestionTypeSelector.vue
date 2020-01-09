<template>
  <div v-if="currentQuestion.isWhen">
    
    <GeneratorSelection
      v-if="currentQuestion.type==='generators'"
      :currentQuestion="currentQuestion"
      @generatorSelected="onGeneratorSelected"
    />
    <b-form-group :label="currentQuestion.message">
      <QuestionInput
        v-if="!currentQuestion.type || currentQuestion.type==='input' || currentQuestion.type==='password' || currentQuestion.type==='number'"
        :currentQuestion="currentQuestion"
      />

      <QuestionEditor v-if="currentQuestion.type==='editor'" :currentQuestion="currentQuestion" />

      <QuestionList
        v-if="currentQuestion.type==='list' || currentQuestion.type==='rawlist'"
        :currentQuestion="currentQuestion"
      />

      <QuestionConfirm v-if="currentQuestion.type==='confirm'" :currentQuestion="currentQuestion" />

      <QuestionCheckbox
        v-if="currentQuestion.type==='checkbox'"
        :currentQuestion="currentQuestion"
      />

      <QuestionExpand v-if="currentQuestion.type==='expand'" :currentQuestion="currentQuestion" />

      <b-form-invalid-feedback
        id="validation-message"
        class="invalid-feedback"
        :state="currentQuestion.isValid"
      >{{currentQuestion.validationMessage}}</b-form-invalid-feedback>
    </b-form-group>
  </div>
</template>

<script>
import QuestionList from "./QuestionTypes/QuestionList";
import QuestionInput from "./QuestionTypes/QuestionInput";
import QuestionEditor from "./QuestionTypes/QuestionEditor";
import QuestionConfirm from "./QuestionTypes/QuestionConfirm";
import QuestionCheckbox from "./QuestionTypes/QuestionCheckbox";
import QuestionExpand from "./QuestionTypes/QuestionExpand";
import GeneratorSelection from "./QuestionTypes/GeneratorSelection";

export default {
  name: "QuestionTypeSelector",
  components: {
    QuestionList,
    QuestionInput,
    QuestionEditor,
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
    onGeneratorSelected(generatorName) {
      this.$emit("generatorSelected", generatorName);
    }
  }
};
</script>
<style scoped>
.btn {
  margin: 0 5px;
}
</style>
