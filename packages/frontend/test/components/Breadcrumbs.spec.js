import { initComponent, unmount } from "../Utils";
import Breadcrumbs from "../../src/components/YOUIBreadcrumbs.vue";
import { nextTick } from "vue";

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
    wrapper = initComponent(Breadcrumbs, { breadcrumbs: [{ label: "answerLabel1", value: "answerValue1" }] }, true);
    expect(wrapper.findAll('[data-test="breadcrumbs"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-test="moreLessButton"]')).toHaveLength(0);
    // Replaces answers
    await wrapper.setProps({
      breadcrumbs: [
        { label: "answerLabel2", value: "answerValue2" },
        { label: "answerLabel3", value: "answerValue3" },
      ],
    });
    const breadcrumbs = wrapper.findAll('[data-test="breadcrumbs"]');
    expect(breadcrumbs[0].html()).toMatchInlineSnapshot(
      `<div class="answer" data-test="breadcrumbs"><span>answerLabel2: </span><span>answerValue2</span></div>`
    );
    expect(breadcrumbs[1].html()).toMatchInlineSnapshot(
      `<div class="answer" data-test="breadcrumbs"><span>answerLabel3: </span><span>answerValue3</span></div>`
    );
    expect(wrapper.findAll('[data-test="moreLessButton"]')).toHaveLength(0);
  });

  test("shows more/less button", async () => {
    // const calcIsMoreSpy = jest.spyOn(Breadcrumbs.methods, "calcIsMore");
    wrapper = initComponent(Breadcrumbs, { breadcrumbs: [] }, true);
    const originalCalcIsMore = wrapper.vm.calcIsMore;

    const calcIsMoreSpy = (wrapper.vm.calcIsMore = jest.fn(() => originalCalcIsMore()));

    expect(wrapper.findAll('[data-test="breadcrumbs"]')).toHaveLength(0);
    expect(wrapper.findAll('[data-test="moreLessButton"]')).toHaveLength(0);
    // Fake scrollHeight to trigger more/less button
    const answerBox = wrapper.get('[data-test="answerBox"]');
    Object.defineProperty(answerBox.element, "scrollHeight", { value: 100 });
    Object.defineProperty(answerBox.element, "clientHeight", { value: 10 });
    // Trigger recalc
    await wrapper.setProps({
      breadcrumbs: [{ label: "answerLabel1", value: "answerValue1" }],
    });
    wrapper.vm.showMoreLess = true;
    await nextTick();
    // expect(calcIsMoreSpy).toHaveBeenCalledTimes(2); // Once by v-resize, once adding answers
    const moreLess = wrapper.get('[data-test="moreLessButton"]');
    expect(moreLess.html()).toMatchInlineSnapshot(`<div class="more" data-test="moreLessButton">More...</div>`);

    await moreLess.trigger("click");
    expect(moreLess.html()).toMatchInlineSnapshot(`<div class="more" data-test="moreLessButton">Less</div>`);
    expect(answerBox.classes("show-more")).toBe(true);

    calcIsMoreSpy.mockRestore();
  });
});
