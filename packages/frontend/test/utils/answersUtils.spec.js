import answerUtils from "../../src/utils/answerUtils";
import questions1Data from "./testdata/questions1";

describe("Tests for answerUtils", () => {
  test("getLabelsForAnswers ", () => {
    const breadcrumbs = answerUtils.getLabelsForAnswers(questions1Data);
    expect(breadcrumbs).toMatchInlineSnapshot(`
      Array [
        Object {
          "label": "Normalised message list with string values",
          "value": "Norlmalised List choice 2",
        },
        Object {
          "label": "Normalised message for list of strings",
          "value": "Normalised List choice 3",
        },
        Object {
          "label": "Normalised message for list of numbers",
          "value": 3,
        },
        Object {
          "label": "Normalised msg for choices with object values",
          "value": "Normalised Choice with object value 1",
        },
        Object {
          "label": "Capilatized Name As Label",
          "value": "Some text",
        },
        Object {
          "label": "Normalised input message",
          "value": "A text answer",
        },
        Object {
          "label": "File path",
          "value": "/some/file/path",
        },
        Object {
          "label": "Normalised confirm message",
          "value": "Yes",
        },
        Object {
          "label": "Alternative breadcrumb Label",
          "value": "No",
        },
        Object {
          "label": "Restaurant visits (number)",
          "value": "11",
        },
        Object {
          "label": "Choosen beer (checkboxes)",
          "value": "Chimay Trappist Ales,Paulaner Salvator Doppel Bock,Weihenstephaner Korbinian",
        },
      ]
    `);
  });
});
