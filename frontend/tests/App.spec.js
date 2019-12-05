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
    it('prompt is not defined', () => {
      wrapper = initComponent(App)
      expect(wrapper.vm.createPrompt()).toBeDefined()
    })

    it('questions are not defined', () => {
      wrapper = initComponent(App)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      expect(wrapper.vm.createPrompt().answers).toEqual({})
    })

    it('questions are defined', () => {
      wrapper = initComponent(App)
      wrapper.vm.prompts = [{
          answers: {}, questions: []
        }, {
          answers: {name: 'test'}, 
          questions: [{name: 'q12', isWhen: true, answer: 'a12'}, {name: 'q22', isWhen: false, answer: 'a22'}]
      }]
      wrapper.vm.promptIndex = 1
      const testPrompt = wrapper.vm.currentPrompt
      expect(testPrompt.answers.q12).toBe('a12')
      expect(testPrompt.answers.q22).toBeUndefined()
    })
  })
})