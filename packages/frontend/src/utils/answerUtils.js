import _isEqual from "lodash/isEqual";
import _startCase from "lodash/startCase";
import _isNil from "lodash/isNil";

/**
 * Resolves the answer value to a choice label text which was provided to the UI
 */
function getTextsForChoices(choices, answer) {
  const answerChoice = choices.find((choice) => {
    // Choice may be a list of string values or name/value pairs
    return _isEqual(choice.value || choice, answer);
  });
  return answerChoice.name || answerChoice;
}

/**
 *  Resolves answers values back to the answer label texts provided in the UI.
 */
function getTextForAnswer(question, answer) {
  if (Array.isArray(question._choices)) {
    // `_choices` is the normalised version of `choices` (Array | Function) used by the Form.vue so we re-use rather than re-processing
    let answers = [answer];
    // Answer may be an array of values
    if (Array.isArray(answer)) {
      answers = answer;
    }
    const texts = [];
    answers.forEach((answer) => {
      texts.push(getTextsForChoices(question._choices, answer));
    });
    // find the label for each answer
    return texts.length === 1 ? texts[0] : texts.join();
  }

  if (question.type === "confirm" && typeof answer === "boolean") {
    return answer ? "Yes" : "No";
  }

  return answer;
}

export default {
  /**
   * Get the UI texts for each answer label and value that should be shown in the navigation area.
   * Only questions with the guiOption `breadcrumb` will be considered.
   *
   */
  getLabelsForAnswers: (questions) => {
    //console.log(`getLabelsForAnswers: questions: ${JSON.stringify(questions)}}`)
    if (questions && Array.isArray(questions)) {
      const answerLabels = [];
      questions.forEach((question) => {
        const bcSetting = question.guiOptions?.breadcrumb;
        const answer = question.answer;
        // 'shouldShow' will only display visible prompt answers
        if (question.shouldShow && !_isNil(answer) && !_isNil(bcSetting) && bcSetting !== false) {
          answerLabels.push({
            label:
              typeof bcSetting === "string"
                ? bcSetting
                : question._message // `_message` is the normalised version of `message` (String | Function) used by the Form.vue so we re-use rather than re-processing
                ? question._message
                : _startCase(question.name),
            value: getTextForAnswer(question, answer),
          });
        }
      });
      if (answerLabels.length > 0) {
        return answerLabels;
      }
    }
  },
};
