import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import Banner from "../../src/components/YOUIBanner.vue";
import { unmount } from "../Utils";

describe("YOUIBanner.vue", () => {
  let wrapper;

  afterEach(() => {
    unmount(wrapper);
  });

  test("renders minimal banner with correct text", () => {
    const propsData = {
      bannerProps: {
        text: "Test Banner",
        ariaLabel: "Test Banner Label",
        triggerActionFrom: "banner",
      },
    };

    wrapper = mount(Banner, {
      props: propsData,
    });

    const props = wrapper.props();
    expect(props).toEqual(propsData);

    const bannerText = wrapper.find(".banner-text span");
    expect(bannerText.exists()).toBe(true);
    expect(bannerText.text()).toBe("Test Banner");
  });

  test("renders material icon correctly in banner", async () => {
    const propsData = {
      bannerProps: {
        text: "Test Banner",
        ariaLabel: "Test Banner Label",
        icon: {
          source: "mdi-check-circle",
          type: "mdi",
        },
      },
    };

    wrapper = mount(Banner, {
      props: propsData,
    });

    const props = wrapper.props();
    expect(props).toEqual(propsData);

    const bannerText = wrapper.find(".banner-text span");
    expect(bannerText.exists()).toBe(true);
    expect(bannerText.text()).toBe("Test Banner");

    const bannerIcon = wrapper.find(".banner-icon v-icon");
    expect(bannerIcon.exists()).toBe(true);
    expect(bannerIcon.text()).toBe("mdi-check-circle");
  });

  test("renders image icon correctly in banner", async () => {
    const propsData = {
      bannerProps: {
        text: "Test Banner",
        ariaLabel: "Test Banner Label",
        icon: {
          source:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8//8/AwAI/wH+9Q4AAAAASUVORK5CYII=",
          type: "image",
        },
      },
    };

    wrapper = mount(Banner, {
      props: propsData,
    });

    const props = wrapper.props();
    expect(props).toEqual(propsData);

    const bannerText = wrapper.find(".banner-text span");
    expect(bannerText.exists()).toBe(true);
    expect(bannerText.text()).toBe("Test Banner");

    const bannerIcon = wrapper.find(".banner-icon img");
    expect(bannerIcon.exists()).toBe(true);
    expect(bannerIcon.attributes("src")).toBe(propsData.bannerProps.icon.source);
  });

  test('emits parent-execute-command event when triggerActionFrom is "banner"', async () => {
    const propsData = {
      bannerProps: {
        text: "Test Banner",
        ariaLabel: "Test Banner Label",
        triggerActionFrom: "banner",
        action: {
          command: {
            id: "test.command",
            params: { key: "value" },
          },
        },
      },
    };

    wrapper = mount(Banner, {
      props: propsData,
    });

    const props = wrapper.props();
    expect(props).toEqual(propsData);

    wrapper.vm.triggerCommand(wrapper.vm.bannerProps.action.command);
    await nextTick();

    expect(wrapper.emitted()["parent-execute-command"]).toBeTruthy();
    expect(wrapper.emitted()["parent-execute-command"][0]).toEqual([{ id: "test.command", params: { key: "value" } }]);
  });

  test('renders clickable link correctly when triggerActionFrom is "link"', async () => {
    const propsData = {
      bannerProps: {
        text: "Test Banner",
        ariaLabel: "Test Banner Label",
        triggerActionFrom: "link",
        action: {
          text: "Click Me",
          url: "https://example.com",
        },
      },
    };

    wrapper = mount(Banner, {
      props: propsData,
    });

    const link = wrapper.find(".banner-link a");
    expect(link.exists()).toBe(true);
    expect(link.text()).toBe("Click Me");
    expect(link.attributes("href")).toBe("https://example.com");
  });

  test('renders clickable command correctly when triggerActionFrom is "link"', async () => {
    const propsData = {
      bannerProps: {
        text: "Test Banner",
        ariaLabel: "Test Banner Label",
        triggerActionFrom: "link",
        action: {
          text: "Click Me",
          command: {
            id: "test.command",
            params: { key: "value" },
          },
        },
      },
    };

    wrapper = mount(Banner, {
      props: propsData,
    });

    const link = wrapper.find(".banner-link a");
    expect(link.exists()).toBe(true);
    expect(link.text()).toBe("Click Me");

    wrapper.vm.triggerCommand(wrapper.vm.bannerProps.action.command);
    await nextTick();

    expect(wrapper.emitted()["parent-execute-command"]).toBeTruthy();
    expect(wrapper.emitted()["parent-execute-command"][0]).toEqual([{ id: "test.command", params: { key: "value" } }]);
    expect(link.attributes("href")).toBe("javascript:void(0)");
  });
});
