import { mount, shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuetify from 'vuetify'
Vue.use(Vuetify);

import {
    createLocalVue
} from '@vue/test-utils'
const localVue = createLocalVue()

export function initComponent(component, propsData, isMount) {
    const vuetify = new Vuetify()

    const initFunction = (isMount === true ? mount : shallowMount);
    const props = {
        localVue,
        vuetify,
        propsData: {
            ...propsData
        }
    };
    return initFunction.call(this, component, props);
}

export function destroy(wrapper) {
    if (wrapper && wrapper.destroy) {
        wrapper.destroy();
    }
}