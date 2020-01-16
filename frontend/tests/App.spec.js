import {initComponent, destroy} from './Utils'
import App from '../src/App.vue';
import Vue from 'vue'
import Vuetify from 'vuetify'
import { WebSocket } from 'mock-socket'

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
      expect(wrapper.vm.currentPrompt.answers.q22).toBeUndefined()
    })
  })

  describe('updateQuestionsFromIndex - method', () => {
    let invokeSpy
    beforeEach(() => {
      wrapper = initComponent(App)
      wrapper.vm.rpc = {
        invoke: () => new Promise(resolve => setTimeout(() => resolve(), 300))
      }
      invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    })

    afterEach(() => {
      if (invokeSpy) {
        invokeSpy.mockRestore()
      }
    })

    test('invoke called on each question with Function method', async () => {
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'defaultQ', _default: '__Function', answer: 'defaultAnswer', isWhen: true
        }, {
          name: 'messageQ', _message: '__Function', answer: 'messageAnswer', isWhen: true
        }, {
          name: 'choicesQ', _choices: '__Function', answer: 'choicesAnswer', isWhen: true
        }, {
          name: 'validateQ', validate: '__Function', answer: 'validateAnswer', isWhen: true
        }, {
          name: 'filterQ', filter: '__Function', answer: 'filterAnswer', isWhen: true
        }, {
          name: 'whenQ', when: '__Function', answer: "whenAnswer"
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      
      const expectedAnswers = {
        "defaultQ": "defaultAnswer",
        "messageQ": "messageAnswer",
        "choicesQ": "choicesAnswer",
        "validateQ": "validateAnswer",
        "whenQ": "whenAnswer"
      }

      await wrapper.vm.updateQuestionsFromIndex(0)
      
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'defaultQ', 'default'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'messageQ', 'message'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'choicesQ', 'choices'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [["validateAnswer", expectedAnswers], 'validateQ', 'validate'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [['filterAnswer'], 'filterQ', 'filter'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'whenQ', 'when'])
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
      await wrapper.vm.updateQuestionsFromIndex(0)
      
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
      await wrapper.vm.updateQuestionsFromIndex(0)

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
      await wrapper.vm.updateQuestionsFromIndex(0)

      expect(wrapper.vm.prompts[0].questions[0].isValid).toBe(true)
      expect(wrapper.vm.prompts[0].questions[0].validationMessage ).toBeUndefined()
    })

    test('invoke for question that throws error as string', async () => {
      wrapper.vm.rpc = {
        invoke: jest.fn().mockRejectedValueOnce("test error").mockResolvedValue()
      }
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'validateQ', validate: '__Function', answer: 'validateAnswer', isWhen: true, doNotShow: false
        }],
        answers: {}
      }]
      wrapper.vm.generatorName = "testGen";
      wrapper.vm.promptIndex = 0

      const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
      await wrapper.vm.updateQuestionsFromIndex(0)
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [["validateAnswer", {"validateQ": "validateAnswer"}], 'validateQ', 'validate'])
      expect(invokeSpy).toHaveBeenCalledWith('logMessage', [`Could not update the 'validateQ' question in generator 'testGen'. Reason: test error`])
      expect(invokeSpy).toHaveBeenCalledWith('toggleLog', [{}])

      invokeSpy.mockRestore();
    })

    test('invoke for question that throws error as error object', async () => {
      wrapper.vm.rpc = {
        invoke: jest.fn().mockRejectedValueOnce(new Error("test error")).mockResolvedValue()
      }
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'validateQ', validate: '__Function', answer: 'validateAnswer', isWhen: true, doNotShow: false
        }],
        answers: {}
      }]
      wrapper.vm.generatorName = "testGen";
      wrapper.vm.promptIndex = 0

      const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
      await wrapper.vm.updateQuestionsFromIndex(0)
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [["validateAnswer", {"validateQ": "validateAnswer"}], 'validateQ', 'validate'])
      expect(invokeSpy).toHaveBeenCalledWith('logMessage', [`Could not update the 'validateQ' question in generator 'testGen'. Reason: test error`])
      expect(invokeSpy).toHaveBeenCalledWith('toggleLog', [{}])

      invokeSpy.mockRestore();
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

  test('selectGenerator - method', () => {
    wrapper = initComponent(App)
    wrapper.vm.generatorName = 'test_ge_name'

    wrapper.vm.selectGenerator('testGeneratorName');
    
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
      wrapper = initComponent(App, {donePath: 'testDonePath'})
      wrapper.vm.isInVsCode = jest.fn().mockResolvedValue(true)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1

      wrapper.vm.generatorDone(true, 'testMessage', '/test/path')

      expect(wrapper.vm.doneMessage).toBe('testMessage')
      expect(wrapper.vm.donePath).toBe('/test/path')
      expect(wrapper.vm.isDone).toBeTruthy()
      expect(window.vscode.postMessage).toHaveBeenCalled()
    })

    test('status is pending', () => {
      wrapper = initComponent(App, {donePath: 'testDonePath'})
      wrapper.vm.isInVsCode = jest.fn().mockResolvedValue(true)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.currentPrompt.status = 'pending'

      wrapper.vm.generatorDone(true, 'testMessage', '/test/path')

      expect(wrapper.vm.doneMessage).toBe('testMessage')
      expect(wrapper.vm.donePath).toBe('/test/path')
      expect(wrapper.vm.isDone).toBeTruthy()
      expect(wrapper.vm.currentPrompt.name).toBe('Summary')
      expect(window.vscode.postMessage).toHaveBeenCalled()
    })
  })

  describe('setBusyIndicator - method', () => {
    it('prompts is empty', () => {
      wrapper = initComponent(App)
      wrapper.vm.prompts = []
      wrapper.vm.setBusyIndicator()
      expect(wrapper.vm.showBusyIndicator).toBeTruthy()
    })

    it('isDone is false, status is pending, prompts is not empty', () => {
      wrapper = initComponent(App)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.isDone = false
      wrapper.vm.currentPrompt.status = 'pending'
      wrapper.vm.setBusyIndicator()
      expect(wrapper.vm.showBusyIndicator).toBeTruthy()
    })

    it('isDone is true, status is pending, prompts is not empty', () => {
      wrapper = initComponent(App)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.isDone = true
      wrapper.vm.currentPrompt.status = 'pending'
      wrapper.vm.setBusyIndicator()
      expect(wrapper.vm.showBusyIndicator).toBeFalsy()
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
