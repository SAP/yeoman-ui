import { mount, shallowMount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/lib/components/index.mjs";
import * as directives from "vuetify/lib/directives/index.mjs";
import Form from "@sap-devx/inquirer-gui";

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

export function initComponent(component, propsData, isMount, stubs = {}) {
  const vuetify = new createVuetify({
    components,
    directives,
  });
  const options = { vuetify };

  const initFunction = isMount === true ? mount : shallowMount;
  const props = {
    global: {
      plugins: [vuetify, [Form, options]],
      stubs,
    },
    props: {
      ...propsData,
    },
    attachTo: document.body,
  };
  return initFunction.call(this, component, props);
}

export function unmount(wrapper) {
  if (wrapper && wrapper.unmount) {
    wrapper.unmount();
  }
}
