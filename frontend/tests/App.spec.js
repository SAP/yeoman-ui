import {initComponent, destroy} from './Utils'
import App from '../src/App.vue';
import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import { WebSocket } from 'mock-socket'

Vue.use(BootstrapVue)
global.WebSocket = WebSocket

let wrapper
describe('App.vue', () => {
  afterEach(() => {
    destroy(wrapper)
  })

  describe('createPrompt - method', () => {
    it('create default prompt', () => {
      wrapper = initComponent(App)
      expect(wrapper.vm.createPrompt()).toBeDefined()
    })
  })
})