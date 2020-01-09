<template>
  <div id="QuestionTypeSelector">
    <v-col v-if="questions[0] && questions[0].type==='generators'" lg="12">
      <GeneratorSelection
        :currentQuestion="questions[0]"
        @generatorSelected="onGeneratorSelected"
      />
    </v-col>
    <v-col v-else lg="6">
      <v-form>
        <div v-for="(currentQuestion, index) in questions" :key="index">
          <div v-if="currentQuestion.isWhen">
            <QuestionInput
              v-if="!currentQuestion.type || currentQuestion.type==='input' || currentQuestion.type==='password' || currentQuestion.type==='number'"
              :currentQuestion="currentQuestion"
            />

            <QuestionEditor
              v-if="currentQuestion.type==='editor'"
              :currentQuestion="currentQuestion"
            />

            <QuestionList
              v-if="currentQuestion.type==='list' || currentQuestion.type==='rawlist'"
              :currentQuestion="currentQuestion"
            />

            <QuestionConfirm
              v-if="currentQuestion.type==='confirm'"
              :currentQuestion="currentQuestion"
            />

            <QuestionCheckbox
              v-if="currentQuestion.type==='checkbox'"
              :currentQuestion="currentQuestion"
            />

            <QuestionExpand
              v-if="currentQuestion.type==='expand'"
              :currentQuestion="currentQuestion"
            />

            <b-form-invalid-feedback
              id="validation-message"
              class="invalid-feedback"
              :state="currentQuestion.isValid"
            >{{currentQuestion.validationMessage}}</b-form-invalid-feedback>
          </div>
        </div>
      </v-form>
    </v-col>
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
    questions: Array
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
<style >
#validation-message{
  margin-top: -1.5rem !important;
}
p.question-label{
  margin-bottom: 0.25rem !important;
}

div.v-input__slot .v-select__selection{
  color: var(--vscode-input-foreground, #cccccc) !important;
}
div.v-select-list div.v-list{
  background-color: var(--vscode-input-background, #3c3c3c) !important;
}
div.v-select-list div.v-list div.v-list-item,
div.v-select-list div.v-list div.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled)
{
  color: var(--vscode-input-foreground, #cccccc) !important;
}
div.v-input__slot input, div.v-input__slot textarea {
  color: var(--vscode-input-foreground, #cccccc) !important;
}
</style>