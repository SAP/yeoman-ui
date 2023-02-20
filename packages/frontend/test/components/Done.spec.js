import { initComponent, unmount } from "../Utils";
import Done from "../../src/components/Done.vue";
import _ from "lodash";

let wrapper;

describe("Done.vue", () => {
  const testDoneMessage = "testDoneMessage";

  afterEach(() => {
    unmount(wrapper);
  });

  test("component name", () => {
    wrapper = initComponent(Done);
    expect(wrapper.vm.$options.name).toBe("Done"); // wrapper.name() is deprecated
  });

  test("component props", () => {
    wrapper = initComponent(Done);
    expect(_.keys(wrapper.props())).toHaveLength(3);
  });

  test("doneMessage set, success", () => {
    wrapper = initComponent(Done, {
      doneStatus: true,
      doneMessage: testDoneMessage,
    });
    expect(wrapper.find("p").text()).toBe("mdi-checkbox-marked-circle-outline testDoneMessage");
  });

  test("doneMessage set, failure", () => {
    wrapper = initComponent(Done, {
      doneStatus: false,
      doneMessage: testDoneMessage,
    });
    expect(wrapper.find("p").text()).toBe("mdi-close-circle-outline testDoneMessage");
  });
});
