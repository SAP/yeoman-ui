import { initComponent, unmount } from "../Utils";
import Breadcrumbs from "../../src/components/Breadcrumbs.vue";

describe("Breadcrumbs.vue", () => {
  let wrapper;

  afterEach(() => {
    unmount(wrapper);
  });

  test("zero state", () => {
    wrapper = initComponent(Breadcrumbs, { breadcrumbs: undefined }, true);
    expect(wrapper.findAll('[data-test="answerBox"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-test="breadcrumbs"]')).toHaveLength(0);
    expect(wrapper.findAll('[data-test="moreLessButton"]')).toHaveLength(0);
  });

  test("shows answers", async () => {
    wrapper = initComponent(
      Breadcrumbs,
      { breadcrumbs: [{ label: "answerLabel1", value: "answerValue1" }] },
      true
    );
    expect(wrapper.findAll('[data-test="breadcrumbs"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-test="moreLessButton"]')).toHaveLength(0);
    // Replaces answers
    await wrapper.setProps({
      breadcrumbs: [
        { label: "answerLabel2", value: "answerValue2" },
        { label: "answerLabel3", value: "answerValue3" }
      ]
    });
    const breadcrumbs = wrapper.findAll('[data-test="breadcrumbs"]');
    expect(breadcrumbs.wrappers[0].html()).toMatchInlineSnapshot(
      `<div id="answer-0" data-test="breadcrumbs" class="answer"><span>answerLabel2: </span><span>answerValue2</span></div>`
    );
    expect(breadcrumbs.wrappers[1].html()).toMatchInlineSnapshot(
      `<div id="answer-1" data-test="breadcrumbs" class="answer"><span>answerLabel3: </span><span>answerValue3</span></div>`
    );
    expect(wrapper.findAll('[data-test="moreLessButton"]')).toHaveLength(0);
  });

  test("shows more/less button", async () => {
    const calcIsMoreSpy = jest.spyOn(Breadcrumbs.methods, "calcIsMore");

    wrapper = initComponent(Breadcrumbs, { breadcrumbs: [] }, true);
    expect(wrapper.findAll('[data-test="breadcrumbs"]')).toHaveLength(0);
    expect(wrapper.findAll('[data-test="moreLessButton"]')).toHaveLength(0);
    // Fake scrollHeight to trigger more/less button
    const answerBox = wrapper.get('[data-test="answerBox"]');
    Object.defineProperty(answerBox.element, "scrollHeight", { value: 100 });
    Object.defineProperty(answerBox.element, "clientHeight", { value: 10 });
    // Trigger recalc
    await wrapper.setProps({
      breadcrumbs: [{ label: "answerLabel1", value: "answerValue1" }]
    });
    expect(calcIsMoreSpy).toHaveBeenCalledTimes(2); // Once by v-resize, once adding answers
    const moreLess = wrapper.get('[data-test="moreLessButton"]');
    expect(moreLess.html()).toMatchInlineSnapshot(
      `<div data-test="moreLessButton" class="more">More...</div>`
    );

    await moreLess.trigger("click");
    expect(moreLess.html()).toMatchInlineSnapshot(
      `<div data-test="moreLessButton" class="more">Less</div>`
    );
    expect(answerBox.classes("show-more")).toBe(true);

    calcIsMoreSpy.mockRestore();
  });
});
