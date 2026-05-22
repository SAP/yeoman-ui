import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/lib/components/index.mjs";
import * as directives from "vuetify/lib/directives/index.mjs";
import ExploreGenerators from "../src/exploregens/App.vue";

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

describe("Explore generators", () => {
  const mountExploreGenerators = (gens) => {
    const vuetify = createVuetify({
      components,
      directives,
    });
    const component = {
      ...ExploreGenerators,
      created() {},
    };

    return mount(component, {
      global: {
        plugins: [vuetify],
      },
      data() {
        return {
          ready: true,
          isLegalNoteAccepted: true,
          gens,
          total: gens.length,
        };
      },
      attachTo: document.body,
    });
  };

  test("hides more information link when generator has no link", () => {
    const wrapper = mountExploreGenerators([
      {
        package: {
          name: "generator-no-link",
          version: "1.0.0",
          description: "No link",
          links: {},
        },
      },
    ]);

    expect(wrapper.find(".homepage a").exists()).toBe(false);
  });

  test("shows more information link when generator has a link", () => {
    const wrapper = mountExploreGenerators([
      {
        package: {
          name: "generator-with-link",
          version: "1.0.0",
          description: "Has link",
          links: {
            npm: "https://www.npmjs.com/package/generator-with-link",
          },
        },
      },
    ]);

    const link = wrapper.find(".homepage a");
    expect(link.exists()).toBe(true);
    expect(link.attributes("href")).toBe("https://www.npmjs.com/package/generator-with-link");
  });
});
