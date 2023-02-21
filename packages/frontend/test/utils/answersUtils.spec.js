import answerUtils from "../../src/utils/answerUtils";
import questions1Data from "./testdata/questions1";

describe("Tests for answerUtils", () => {
  test("getLabelsForAnswers ", () => {
    const breadcrumbs = answerUtils.getLabelsForAnswers(questions1Data);

    expect(breadcrumbs).toMatchInlineSnapshot(`
      Array [
        Object {
          "label": "Normalised Message List With String Values",
          "value": "Norlmalised List choice 2",
        },
        Object {
          "label": "Normalised Message For List Of Strings",
          "value": "Normalised List choice 3",
        },
        Object {
          "label": "Normalised Message For List Of Numbers",
          "value": 3,
        },
        Object {
          "label": "Normalised Msg For Choices With Object Values",
          "value": "Normalised Choice with object value 1",
        },
        Object {
          "label": "Capilatized Name As Label",
          "value": "Some text",
        },
        Object {
          "label": "Normalised Input Message",
          "value": "A text answer",
        },
        Object {
          "label": "File Path",
          "value": "/some/file/path",
        },
        Object {
          "label": "Normalised Confirm Message",
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
