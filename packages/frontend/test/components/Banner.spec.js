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

  test("emits parent-execute-command event when action is triggered from banner", async () => {
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

    const link = wrapper.find(".banner-link-text a");
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

    const link = wrapper.find(".banner-link-text a");
    expect(link.exists()).toBe(true);
    expect(link.text()).toBe("Click Me");

    wrapper.vm.triggerCommand(wrapper.vm.bannerProps.action.command);
    await nextTick();

    expect(wrapper.emitted()["parent-execute-command"]).toBeTruthy();
    expect(wrapper.emitted()["parent-execute-command"][0]).toEqual([{ id: "test.command", params: { key: "value" } }]);
    expect(link.attributes("href")).toBe("javascript:void(0)");
  });
});

describe("YOUIBanner.vue - trigger command", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(Banner, {
      props: {
        bannerProps: {
          text: "Test Banner",
          ariaLabel: "Test Banner Label",
          icon: { type: "mdi", source: "mdi-test-icon" },
          action: { command: "test-command", text: "Click Me" },
          triggerActionFrom: "banner",
        },
      },
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it("should emit 'parent-execute-command' when the banner is clicked and triggerActionFrom is 'banner'", async () => {
    const banner = wrapper.find(".banner-container");

    await banner.trigger("click");

    expect(wrapper.emitted("parent-execute-command")).toBeTruthy();
    expect(wrapper.emitted("parent-execute-command")[0]).toEqual(["test-command"]);
  });

  it("should not emit 'parent-execute-command' when triggerActionFrom is not 'banner'", async () => {
    await wrapper.setProps({
      bannerProps: {
        ...wrapper.props().bannerProps,
        triggerActionFrom: "link",
      },
    });

    const banner = wrapper.find(".banner-container");
    expect(banner.exists()).toBe(true);

    await banner.trigger("click");

    expect(wrapper.emitted("parent-execute-command")).toBeFalsy();
  });
});

describe("banner-animated class", () => {
  let wrapper;

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it("applies banner-animated class when animated prop is true", () => {
    wrapper = mount(Banner, {
      props: {
        bannerProps: {
          text: "Animated banner",
          ariaLabel: "Animated banner",
          icon: {
            type: "image",
            source: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
          },
          action: {},
          triggerActionFrom: "banner",
          animated: true,
        },
      },
    });

    expect(wrapper.find(".banner-animated").exists()).toBe(true);
  });

  it("does not apply banner-animated class when animated prop is false", () => {
    wrapper = mount(Banner, {
      props: {
        bannerProps: {
          text: "Static banner",
          ariaLabel: "Static banner",
          icon: {
            type: "image",
            source: "data:image/png;base64,iVBORw0KGgoAAAANS=",
          },
          action: {},
          triggerActionFrom: "banner",
          animated: false,
        },
      },
    });

    expect(wrapper.find(".banner-animated").exists()).toBe(false);
  });
});

describe("SVG icon detection and rendering", () => {
  let wrapper;

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it("detects SVG icon correctly with isSvgIcon computed", () => {
    const svgBase64 = btoa('<svg xmlns="http://www.w3.org/2000/svg"><path fill="currentColor"/></svg>');

    wrapper = mount(Banner, {
      props: {
        bannerProps: {
          text: "Banner with SVG",
          ariaLabel: "SVG banner",
          icon: {
            type: "image",
            source: `data:image/svg+xml;base64,${svgBase64}`,
          },
          action: {},
          triggerActionFrom: "banner",
          animated: true,
        },
      },
    });

    // isSvgIcon should be true, so themed-image-container should exist
    expect(wrapper.find(".themed-image-container").exists()).toBe(true);
  });

  it("does not render themed-image-container for icons which do not use SVG", () => {
    wrapper = mount(Banner, {
      props: {
        bannerProps: {
          text: "Banner with PNG",
          ariaLabel: "PNG banner",
          icon: {
            type: "image",
            source: "data:image/png;base64,iVBORw0KGgoAAAANS=",
          },
          action: {},
          triggerActionFrom: "banner",
          animated: true,
        },
      },
    });

    // PNG should not use themed-image-container
    expect(wrapper.find(".themed-image-container").exists()).toBe(false);
    // Should use img tag instead
    expect(wrapper.find(".banner-icon img").exists()).toBe(true);
  });

  it("renders themed-image-container with v-html for SVG icons", () => {
    const svgMarkup = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="currentColor"/></svg>';
    const base64Svg = btoa(svgMarkup);

    wrapper = mount(Banner, {
      props: {
        bannerProps: {
          text: "banner",
          ariaLabel: "banner",
          icon: {
            type: "image",
            source: `data:image/svg+xml;base64,${base64Svg}`,
          },
          action: {},
          triggerActionFrom: "banner",
          animated: true,
        },
      },
    });

    const container = wrapper.find(".themed-image-container");
    expect(container.exists()).toBe(true);
    expect(container.html()).toContain("<svg");
    expect(container.html()).toContain('fill="currentColor"');
  });

  it("decodes base64 SVG correctly", () => {
    const svgMarkup =
      '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="5" fill="currentColor"/></svg>';
    const base64Svg = btoa(svgMarkup);

    wrapper = mount(Banner, {
      props: {
        bannerProps: {
          text: "Banner",
          ariaLabel: "Banner",
          icon: {
            type: "image",
            source: `data:image/svg+xml;base64,${base64Svg}`,
          },
          action: {},
          triggerActionFrom: "banner",
          animated: true,
        },
      },
    });

    const container = wrapper.find(".themed-image-container");
    expect(container.html()).toContain("<circle");
    expect(container.html()).toContain('cx="10"');
    expect(container.html()).toContain('fill="currentColor"');
  });

  it("handles empty icon object", () => {
    wrapper = mount(Banner, {
      props: {
        bannerProps: {
          text: "Banner with empty icon",
          ariaLabel: "Banner",
          icon: {},
          action: {},
          triggerActionFrom: "banner",
          animated: true,
        },
      },
    });

    expect(wrapper.find(".banner-icon").exists()).toBe(true);
  });
});
