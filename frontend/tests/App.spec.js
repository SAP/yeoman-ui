import {initComponent, destroy} from './Utils'
import App from '../src/App.vue';
import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import Vuetify from 'vuetify'
import { WebSocket } from 'mock-socket'
const flushPromises = require('flush-promises');

Vue.use(BootstrapVue)
Vue.use(Vuetify)
global.WebSocket = WebSocket

let wrapper

describe('App.vue', () => {
  afterEach(() => {
    destroy(wrapper)
  })

  it('createPrompt - method', () => {
    wrapper = initComponent(App)
    expect(wrapper.vm.createPrompt().name).toBe()
    expect(wrapper.vm.createPrompt([]).name).toBe()
    expect(wrapper.vm.createPrompt([], 'name').name).toBe('name')
    expect(wrapper.vm.createPrompt([], 'select_generator')).toBeDefined()
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
    let invokeSpy
    beforeEach(() => {
      wrapper = initComponent(App)
      wrapper.vm.rpc = {
        invoke: () => Promise.resolve()
      }
      invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    })

    afterEach(() => {
      if (invokeSpy) {
        invokeSpy.mockRestore()
      }
    })

    test('invoke - when is function', async () => {
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'defaultQ', _default: '__Function', answer: 'defaultAnswer', isWhen: true
        }, {
          name: 'whenQ', when: '__Function', answer: false
        }, {
          name: 'messageQ', _message: '__Function', answer: 'messageAnswer', isWhen: true
        }, {
          name: 'choicesQ', _choices: '__Function', answer: 'choicesAnswer', isWhen: true
        }, {
          name: 'filterQ', filter: '__Function', answer: 'filterAnswer', isWhen: true
        }, {
          name: 'validateQ', validate: '__Function', answer: 'validateAnswer', isWhen: true
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      const oldAnswers = {
        "choicesQ": "old_choicesAnswer",
        "defaultQ": "old_defaultAnswer",
        "filterQ": "old_filterAnswer",
        "messageQ": "old_messageAnswer",
        "validateQ": "old_validateAnswer",
        "whenQ": false
      }

      const expectedAnswers = {
        "choicesQ": "choicesAnswer",
        "defaultQ": "defaultAnswer",
        "filterQ": "filterAnswer",
        "messageQ": "messageAnswer",
        "validateQ": "validateAnswer",
        "whenQ": true
      }
      await wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm, expectedAnswers, oldAnswers)
      
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'defaultQ', 'default'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'whenQ', 'when'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'messageQ', 'message'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'choicesQ', 'choices'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [['filterAnswer'], 'filterQ', 'filter'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [['validateAnswer', expectedAnswers], 'validateQ', 'validate'])
    })

    test('invoke - only 3 answers have been changed', async () => {
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'defaultQ', _default: '__Function', answer: 'defaultAnswer'
        }, {
          name: 'whenQ', when: '__Function', answer: true
        }, {
          name: 'messageQ', _message: '__Function', answer: 'messageAnswer', isWhen: true
        }, {
          name: 'choicesQ', _choices: '__Function', answer: 'choicesAnswer'
        }, {
          name: 'filterQ', filter: '__Function', answer: 'filterAnswer'
        }, {
          name: 'validateQ', validate: '__Function', answer: 'validateAnswer', isWhen: true
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      const oldAnswers = {
        "choicesQ": "choicesAnswer",
        "defaultQ": "defaultAnswer",
        "filterQ": "filterAnswer",
        "messageQ": "old_messageAnswer",
        "validateQ": "old_validateAnswer",
        "whenQ": false
      }

      const expectedAnswers = {
        "choicesQ": "choicesAnswer",
        "defaultQ": "defaultAnswer",
        "filterQ": "filterAnswer",
        "messageQ": "messageAnswer",
        "validateQ": "validateAnswer",
        "whenQ": true
      }
      await wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm, expectedAnswers, oldAnswers)
      
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'whenQ', 'when'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'messageQ', 'message'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [['validateAnswer', expectedAnswers], 'validateQ', 'validate'])
    })

    test('invoke - first answer have been changed, almost all invokes should be called', async () => {
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'defaultQ', _default: '__Function', answer: 'defaultAnswer', isWhen: true
        }, {
          name: 'whenQ', when: '__Function', answer: 'whenAnswer'
        }, {
          name: 'messageQ', _message: '__Function', answer: 'messageAnswer', isWhen: true
        }, {
          name: 'choicesQ', _choices: '__Function', answer: 'choicesAnswer', isWhen: true
        }, {
          name: 'filterQ', filter: '__Function', answer: 'filterAnswer', isWhen: true
        }, {
          name: 'validateQ', validate: '__Function', answer: 'validateAnswer', isWhen: false
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      const oldAnswers = {
        "choicesQ": "choicesAnswer",
        "defaultQ": "old_defaultAnswer",
        "filterQ": "filterAnswer",
        "messageQ": "messageAnswer",
        "validateQ": "_validateAnswer",
        "whenQ": "false"
      }

      const expectedAnswers = {
        "choicesQ": "choicesAnswer",
        "defaultQ": "defaultAnswer",
        "filterQ": "filterAnswer",
        "messageQ": "messageAnswer",
        "validateQ": "validateAnswer",
        "whenQ": "true"
      }
      await wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm, expectedAnswers, oldAnswers)
      
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'defaultQ', 'default'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'whenQ', 'when'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'messageQ', 'message'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'choicesQ', 'choices'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [['filterAnswer'], 'filterQ', 'filter'])
    })

    test('invoke for question default, answer is defined', async () => {
      wrapper.vm.rpc = {
        invoke: jest.fn().mockResolvedValue('defaultResponse')
      }
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'defaultQ', _default: '__Function', answer: 'defaultAnswer', isWhen: true
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm)
      await flushPromises()
      expect(wrapper.vm.prompts[0].questions[0].default).toBe('defaultResponse')
    })

    test('invoke for question default, answer is undefined', async () => {
      wrapper.vm.rpc = {
        invoke: jest.fn().mockResolvedValue('defaultResponse')
      }
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'defaultQ', _default: '__Function', isWhen: true
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm, {'defaultQ': 1}, {'defaultQ': 2})
      await flushPromises()
      expect(wrapper.vm.prompts[0].questions[0].default).toBe('defaultResponse')
      expect(wrapper.vm.prompts[0].questions[0].answer).toBe('defaultResponse')
    })

    test('invoke for question validate , response is string', async () => {
      wrapper.vm.rpc = {
        invoke: jest.fn().mockResolvedValue('validateResponse')
      }
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'validateQ', validate: '__Function', answer: 'validateAnswer', isWhen: true
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm)
      await flushPromises()
      expect(wrapper.vm.prompts[0].questions[0].isValid).toBe(false)
      expect(wrapper.vm.prompts[0].questions[0].validationMessage ).toBe('validateResponse')
    })

    test('invoke for question validate , response is boolean', async () => {
      wrapper.vm.rpc = {
        invoke: jest.fn().mockResolvedValue(true)
      }
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'validateQ', validate: '__Function', answer: 'validateAnswer', isWhen: true
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm)
      await flushPromises()
      expect(wrapper.vm.prompts[0].questions[0].isValid).toBe(true)
      expect(wrapper.vm.prompts[0].questions[0].validationMessage ).toBeUndefined()
    })
  })

  describe('setQuestionProps - method', () => {
    test('set props', () => {
      wrapper = initComponent(App)
      wrapper.vm.rpc = {
        invoke: jest.fn().mockResolvedValue()
      }
      const questions = [{
        name: 'defaultQ', default: '__Function', answer: 'defaultAnswer'
      }, {
        name: 'whenQ', when: '__Function', answer: 'whenAnswer'
      }, {
        name: 'messageQ', message: '__Function', answer: 'messageAnswer'
      }, {
        name: 'choicesQ', choices: '__Function', answer: 'choicesAnswer'
      }, {
        name: 'filterQ', filter: '__Function', answer: 'filterAnswer'
      }, {
        name: 'validateQ', validate: '__Function', answer: 'validateAnswer'
      }, {
        name: 'whenQ6', default: 'whenAnswer6', type: 'confirm'
      }]
      wrapper.vm.showPrompt(questions, 'promptName')
      expect(questions[0].default).toBeUndefined()
      expect(questions[0]._default).toBe('__Function')
      expect(questions[2].message).toBe('loading...')
      expect(questions[2]._message).toBe('__Function')
      expect(questions[3].choices).toEqual(['loading...'])
      expect(questions[3]._choices).toBe('__Function')

      expect(questions[1].answer).toBe('')
      expect(questions[1].isWhen).toBe(false)
      expect(questions[1].isValid).toBe(true)
      expect(questions[1].validationMessage).toBe(true)

      expect(questions[6].answer).toBe('whenAnswer6')
      expect(questions[6].isWhen).toBe(true)
      expect(questions[6].isValid).toBe(true)
      expect(questions[6].validationMessage).toBe(true)
    })
  })

  test('initRpc - method', () => {
    wrapper = initComponent(App)
    wrapper.vm.rpc = {
      invoke: jest.fn(),
      registerMethod: jest.fn()
    }
    
    wrapper.vm.showPrompt = jest.fn()
    wrapper.vm.setPrompts = jest.fn()
    wrapper.vm.generatorDone = jest.fn()
    wrapper.vm.log = jest.fn()

    const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    const registerMethodSpy = jest.spyOn(wrapper.vm.rpc, 'registerMethod')
    wrapper.vm.initRpc();
    
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.showPrompt, thisArg: wrapper.vm, name: 'showPrompt'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.setPrompts, thisArg: wrapper.vm, name: 'setPrompts'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.generatorDone, thisArg: wrapper.vm, name: 'generatorDone'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.log, thisArg: wrapper.vm, name: 'log'})
    expect(invokeSpy).toHaveBeenCalledWith("receiveIsWebviewReady", [])

    invokeSpy.mockRestore()
    registerMethodSpy.mockRestore()
  })

  test('runGenerator - method', () => {
    wrapper = initComponent(App)
    wrapper.vm.rpc = {
      invoke: jest.fn()
    }

    const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    wrapper.vm.runGenerator('testGenerator');
    
    expect(invokeSpy).toHaveBeenCalledWith("runGenerator", ['testGenerator'])
    
    invokeSpy.mockRestore()
  })

  test('log - method', () => {
    wrapper = initComponent(App)
    wrapper.vm.logText = 'test_'

    wrapper.vm.log('test_log');
    
    expect(wrapper.vm.logText).toBe('test_test_log')
  })

  test('onGeneratorSelected - method', () => {
    wrapper = initComponent(App)
    wrapper.vm.generatorName = 'test_ge_name'

    wrapper.vm.onGeneratorSelected('testGeneratorName');
    
    expect(wrapper.vm.generatorName).toBe('testGeneratorName')
  })

  test('onStepValidated - method', () => {
    wrapper = initComponent(App)
    wrapper.vm.stepValidated = false

    wrapper.vm.onStepValidated(false);
    expect(wrapper.vm.stepValidated).toBeFalsy()

    wrapper.vm.onStepValidated(true);
    expect(wrapper.vm.stepValidated).toBeTruthy()
  })

  test('setMessages - method', () => {
    wrapper = initComponent(App)
    expect(wrapper.vm.messages).toEqual({})

    wrapper.vm.setMessages({test: "test1"});
    expect(wrapper.vm.messages).toEqual({test: "test1"})
  })

  describe('next - method', () => {
    test('promptIndex is greater than prompt quantity, resolve is defined', () => {
      wrapper = initComponent(App)
      wrapper.vm.resolve = jest.fn()
      wrapper.vm.reject = jest.fn()
      wrapper.vm.promptIndex = 1 
      wrapper.vm.prompts = [{}, {}]
      const resolveSpy = jest.spyOn(wrapper.vm, 'resolve')

      wrapper.vm.next()

      expect(resolveSpy).toHaveBeenCalled()
      expect(wrapper.vm.promptIndex).toBe(2)
      expect(wrapper.vm.prompts[0].active).toBeFalsy()
      expect(wrapper.vm.prompts[2].active).toBeTruthy()
      resolveSpy.mockRestore()
    })

    test('resolve method throws an exception', () => {
      wrapper = initComponent(App)
     
      wrapper.vm.resolve = () => {
        throw new Error('test_error')
      }
      wrapper.vm.reject = jest.fn()
      const rejectSpy = jest.spyOn(wrapper.vm, 'reject')
      wrapper.vm.promptIndex = 1 
      wrapper.vm.prompts = [{}, {}]

      wrapper.vm.next()

      expect(rejectSpy).toHaveBeenCalledWith(new Error('test_error'))
      rejectSpy.mockRestore()
    })

    test('resolve method does not exist', () => {
      wrapper = initComponent(App)
     
      wrapper.vm.resolve = undefined
      wrapper.vm.promptIndex = 1 
      wrapper.vm.prompts = [{}, {}]

      wrapper.vm.next()

      expect(wrapper.vm.promptIndex).toBe(2)
      expect(wrapper.vm.prompts[0].active).toBeFalsy()
      expect(wrapper.vm.prompts[2].active).toBeTruthy()
    })
  })

  describe('generatorDone - method', () => {
    window.vscode = {
      postMessage: jest.fn()
    }
      
    test('status is not pending', () => {
      wrapper = initComponent(App)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1

      wrapper.vm.generatorDone(true, 'testMessage', '/test/path')

      expect(wrapper.vm.doneMessage).toBe('testMessage')
      expect(wrapper.vm.donePath).toBe('/test/path')
      expect(wrapper.vm.isDone).toBeTruthy()
      expect(window.vscode.postMessage).toHaveBeenCalled()
    })

    test('status is pending', () => {
      wrapper = initComponent(App)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.currentPrompt.status = 'pending'

      wrapper.vm.generatorDone(true, 'testMessage', '/test/path')

      expect(wrapper.vm.doneMessage).toBe('testMessage')
      expect(wrapper.vm.donePath).toBe('/test/path')
      expect(wrapper.vm.isDone).toBeTruthy()
      expect(wrapper.vm.currentPrompt.name).toBe('Confirmation')
      expect(window.vscode.postMessage).toHaveBeenCalled()
    })
  })

  describe('toggleConsole - method', () => {
    test('showConsole property updated from toggleConsole()', () => {
      wrapper = initComponent(App)
      wrapper.vm.toggleConsole()
      expect(wrapper.vm.showConsole).toBeTruthy()
      wrapper.vm.toggleConsole()
      expect(wrapper.vm.showConsole).toBeFalsy()
    })

  })
})