import { initComponent, unmount } from "../Utils";
import Header from "../../src/components/YOUIHeader.vue";
//There are issues of importing vuetify components https://github.com/vuejs/vue-cli/issues/1584

let wrapper;

describe("Header.vue", () => {
  afterEach(() => {
    unmount(wrapper);
  });

  test("component props", () => {
    wrapper = initComponent(Header);
    expect(Object.keys(wrapper.props())).toHaveLength(6);
  });

  test("generator brand", () => {
    const testGen = "Template Wizard";
    wrapper = initComponent(Header, { headerTitle: testGen }, true);
    expect(wrapper.find(".v-toolbar-title").text()).toBe(testGen);
    expect(wrapper.find(".v-icon.mdi-console").html()).toBeTruthy();
  });

  test("set title and info", () => {
    const testTitle = "test title";
    const testInfo = "test info";
    wrapper = initComponent(Header, { headerTitle: testTitle, headerInfo: testInfo }, true);
    expect(wrapper.find(".v-toolbar-title").text()).toBe(testTitle);
    expect(wrapper.find(".mdi-information-outline").html()).toBeTruthy();
  });

  test("click triggers collapseOutput method", async () => {
    const rpcInvokeMockFunction = jest.fn();
    wrapper = initComponent(
      Header,
      {
        rpc: {
          invoke: rpcInvokeMockFunction,
        },
        isGeneric: false,
      },
      true
    );
    wrapper.findAll("button")[0].trigger("click");
    expect(rpcInvokeMockFunction).toHaveBeenCalledWith("toggleOutput", [{}]);
  });

  test("openExploreGenerators", async () => {
    const rpcInvokeMockFunction = jest.fn();
    wrapper = initComponent(
      Header,
      {
        rpc: {
          invoke: rpcInvokeMockFunction,
        },
        isGeneric: true,
      },
      true
    );

    wrapper.findAll("button")[0].trigger("click");
    expect(rpcInvokeMockFunction).toHaveBeenCalledWith("exploreGenerators", [{}]);
  });
});
