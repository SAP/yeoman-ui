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
  
  it('createPrompt - method', () => {
    wrapper = initComponent(App)
    expect(wrapper.vm.createPrompt()).toBeDefined()
  })

  describe('currentPrompt - computed', () => {
    it('questions are not defined', () => {
      wrapper = initComponent(App)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      expect(wrapper.vm.currentPrompt.answers).toEqual({})
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

  describe('currentPrompt.answers - watcher', () => {
    test('invoke', async () => {
      wrapper = initComponent(App)
      wrapper.vm.rpc = {
        invoke: () => Promise.resolve()
      }
      const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'defaultQ', _default: '__Function', answer: true
        }, {
          name: 'whenQ', when: '__Function', answer: true
        }, {
          name: 'messageQ', _message: '__Function', answer: true
        }, {
          name: 'choicesQ', _choices: '__Function', answer: true
        }, {
          name: 'filterQ', filter: '__Function', answer: true
        }, {
          name: 'validateQ', validate: '__Function', answer: true
        }]
      }, {
        name: 'defaultQ', _default: '__Function', default: true
      }]
      wrapper.vm.promptIndex = 0
      wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm)
      await wrapper.vm.$nextTick()
      expect(invokeSpy).toHaveBeenCalledTimes(7)
    })
  })
})