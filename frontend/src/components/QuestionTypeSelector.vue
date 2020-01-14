<template>
  <div id="QuestionTypeSelector">
    <v-col v-if="questions[0] && questions[0].type==='generators'" cols="12">
      <GeneratorSelection :currentQuestion="questions[0]" @generatorSelected="onGeneratorSelected" />
    </v-col>
    <v-col xl="6" lg="6" md="8" sm="11" xs="12">
      <v-form>
        <div v-for="(currentQuestion, index) in questions" :key="index">
          <div v-if="currentQuestion.isWhen">
            <QuestionInput
              v-if="!currentQuestion.type || currentQuestion.type==='input' || currentQuestion.type==='password' || currentQuestion.type==='number'"
              :currentQuestion="currentQuestion" :questionIndex="index"
              :updateQuestionsFromIndex="updateQuestionsFromIndex"
            />

            <QuestionEditor
              v-if="currentQuestion.type==='editor'"
              :currentQuestion="currentQuestion" :questionIndex="index"
              :updateQuestionsFromIndex="updateQuestionsFromIndex"
            />

            <QuestionList
              v-if="currentQuestion.type==='list' || currentQuestion.type==='rawlist'"
              :currentQuestion="currentQuestion" :questionIndex="index"
              :updateQuestionsFromIndex="updateQuestionsFromIndex"
            />

            <QuestionConfirm
              v-if="currentQuestion.type==='confirm'"
              :currentQuestion="currentQuestion" :questionIndex="index"
              :updateQuestionsFromIndex="updateQuestionsFromIndex"
            />

            <QuestionCheckbox
              v-if="currentQuestion.type==='checkbox'"
              :currentQuestion="currentQuestion" :questionIndex="index"
              :updateQuestionsFromIndex="updateQuestionsFromIndex"
            />

            <QuestionExpand
              v-if="currentQuestion.type==='expand'"
              :currentQuestion="currentQuestion" :questionIndex="index"
              :updateQuestionsFromIndex="updateQuestionsFromIndex"
            />
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
    questions: Array,
    updateQuestionsFromIndex: Function
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