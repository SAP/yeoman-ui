import { initComponent, unmount } from "../Utils";
import Done from "../../src/components/YOUIDone.vue";

let wrapper;

describe("Done.vue", () => {
  const testDoneMessage = "testDoneMessage";

  afterEach(() => {
    unmount(wrapper);
  });

  test("component props", () => {
    wrapper = initComponent(Done);
    expect(Object.keys(wrapper.props())).toHaveLength(3);
  });

  test("doneMessage set, success", () => {
    wrapper = initComponent(
      Done,
      {
        doneStatus: true,
        doneMessage: testDoneMessage,
      },
      true
    );
    expect(wrapper.find(".mdi-checkbox-marked-circle-outline").html()).toBeTruthy();
    expect(wrapper.find("p").text()).toBe("testDoneMessage");
  });

  test("doneMessage set, failure", () => {
    wrapper = initComponent(
      Done,
      {
        doneStatus: false,
        doneMessage: testDoneMessage,
      },
      true
    );
    expect(wrapper.find(".mdi-close-circle-outline").html()).toBeTruthy();
    expect(wrapper.find("p").text()).toBe("testDoneMessage");
  });
});
