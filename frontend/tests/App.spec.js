import { shallowMount } from '@vue/test-utils';
import App from '../src/App.vue';
import expect from 'expect'
import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import { WebSocket } from 'mock-socket'

Vue.use(BootstrapVue)
global.WebSocket = WebSocket

describe('App.vue', () => {
  it('test 1', () => {
    const wrapper = shallowMount(App)
    expect(wrapper.vm).toBeDefined()
  })
})