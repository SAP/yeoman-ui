import answerUtils from "../../src/utils/answerUtils";
import questions1Data from "./testdata/questions1";

describe("Tests for answerUtils", () => {
  test("getLabelsForAnswers ", () => {
    const breadcrumbs = answerUtils.getLabelsForAnswers(questions1Data);
    expect(breadcrumbs).toMatchInlineSnapshot(`
      [
        {
          "label": "Normalised message list with string values",
          "value": "Norlmalised List choice 2",
        },
        {
          "label": "Normalised message for list of strings",
          "value": "Normalised List choice 3",
        },
        {
          "label": "Normalised message for list of numbers",
          "value": 3,
        },
        {
          "label": "Normalised msg for choices with object values",
          "value": "Normalised Choice with object value 1",
        },
        {
          "label": "Capilatized Name As Label",
          "value": "Some text",
        },
        {
          "label": "Normalised input message",
          "value": "A text answer",
        },
        {
          "label": "File path",
          "value": "/some/file/path",
        },
        {
          "label": "Normalised confirm message",
          "value": "Yes",
        },
        {
          "label": "Alternative breadcrumb Label",
          "value": "No",
        },
        {
          "label": "Restaurant visits (number)",
          "value": "11",
        },
        {
          "label": "Choosen beer (checkboxes)",
          "value": "Chimay Trappist Ales,Paulaner Salvator Doppel Bock,Weihenstephaner Korbinian",
        },
        {
          "label": "Empty string choice value test",
          "value": "None",
        },
        {
          "label": "Empty string choice test",
          "value": "",
        },
        {
          "label": "",
          "value": "Some answers",
        },
        {
          "label": "Label with numbers123 and brackets (in brackets)",
          "value": "Some answers",
        },
      ]
    `);
  });
});
