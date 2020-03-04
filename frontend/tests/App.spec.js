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
    wrapper = initComponent(App, {}, true)
    expect(wrapper.vm.createPrompt().name).toBe()
    expect(wrapper.vm.createPrompt([]).name).toBe()
    expect(wrapper.vm.createPrompt([], 'name').name).toBe('name')
    expect(wrapper.vm.createPrompt([], 'select_generator')).toBeDefined()
  })

  describe('currentPrompt - computed', () => {
    it.skip('questions are not defined', () => {
      wrapper = initComponent(App, {}, true)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      expect(wrapper.vm.currentPrompt.answers).toEqual({})
    })

    it('questions are defined', async () => {
      wrapper = initComponent(App, {}, true)
      await Vue.nextTick()
      wrapper.vm.prompts = [{
          questions: []
        }, {
          questions: [{name: 'q12', isWhen: true, answer: 'a12'}, {name: 'q22', isWhen: false, answer: 'a22'}]
      }]
      await Vue.nextTick()
      wrapper.vm.promptIndex = 1
      expect(wrapper.vm.currentPrompt.answers.q22).toBeUndefined()
    })
  })

  describe('setQuestionProps - method', () => {
    test('set props', async () => {
      wrapper = initComponent(App, {}, true)
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation((...args) => { return args[1][1] })
      }
      const questions = [
        { name: 'defaultQ', default: '__Function' },
        { name: 'whenQ', when: '__Function' },
        { name: 'messageQ', message: '__Function' },
        { name: 'choicesQ', choices: '__Function' },
        { name: 'filterQ', filter: '__Function' },
        { name: 'validateQ', validate: '__Function' },
        { name: 'whenQ6', default: 'whenAnswer6', type: 'confirm' }
      ]
      wrapper.vm.showPrompt(questions, 'promptName')
      await Vue.nextTick()
      let response = await questions[0].default()
      expect(response).toBe(questions[0].name)

      response = await questions[1].when()
      expect(response).toBe(questions[1].name)

      response = await questions[2].message()
      expect(response).toBe(questions[2].name)

      response = await questions[3].choices()
      expect(response).toBe(questions[3].name)

      response = await questions[4].filter()
      expect(response).toBe(questions[4].name)

      response = await questions[5].validate()
      expect(response).toBe(questions[5].name)
    })

    // the delay ensures we call the busy indicator
    test('validate() with delay', async () => {
      wrapper = initComponent(App, {}, true)
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async (...args) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(args[1][1]);
            },
            1500);
          });
        })
      }

      wrapper.vm.prompts = [{}, {name: "Loading..."}]
      wrapper.vm.promptIndex = 1

      const questions = [
        { name: 'validateQ', validate: '__Function' }
      ]
      wrapper.vm.showPrompt(questions, 'promptName')
      await Vue.nextTick()

      const response = await questions[0].validate()
      expect(response).toBe(questions[0].name)
    })
  })

  test('initRpc - method', () => {
    wrapper = initComponent(App, {}, true)
    wrapper.vm.rpc = {
      invoke: jest.fn(),
      registerMethod: jest.fn()
    }
    
    wrapper.vm.showPrompt = jest.fn()
    wrapper.vm.setPrompts = jest.fn()
    wrapper.vm.generatorInstall = jest.fn()
    wrapper.vm.generatorDone = jest.fn()
    wrapper.vm.log = jest.fn()

    const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    const registerMethodSpy = jest.spyOn(wrapper.vm.rpc, 'registerMethod')
    wrapper.vm.initRpc();
    
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.showPrompt, thisArg: wrapper.vm, name: 'showPrompt'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.setPrompts, thisArg: wrapper.vm, name: 'setPrompts'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.generatorInstall, thisArg: wrapper.vm, name: 'generatorInstall'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.generatorDone, thisArg: wrapper.vm, name: 'generatorDone'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.log, thisArg: wrapper.vm, name: 'log'})
    expect(invokeSpy).toHaveBeenCalledWith("receiveIsWebviewReady", [])

    invokeSpy.mockRestore()
    registerMethodSpy.mockRestore()
  })

  test('runGenerator - method', () => {
    wrapper = initComponent(App, {}, true)
    wrapper.vm.rpc = {
      invoke: jest.fn()
    }

    const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    wrapper.vm.runGenerator('testGenerator');
    
    expect(invokeSpy).toHaveBeenCalledWith("runGenerator", ['testGenerator'])
    
    invokeSpy.mockRestore()
  })

  test('log - method', () => {
    wrapper = initComponent(App, {}, true)
    wrapper.vm.logText = 'test_'

    wrapper.vm.log('test_log');
    
    expect(wrapper.vm.logText).toBe('test_test_log')
  })

  test('selectGenerator - method', async () => {
    wrapper = initComponent(App, {}, true)
    wrapper.vm.generatorName = 'test_ge_name'

    wrapper.vm.selectGenerator('testGeneratorName', 'Test Generator Name');
    await Vue.nextTick();
    
    expect(wrapper.vm.generatorName).toBe('testGeneratorName')
    expect(wrapper.vm.generatorPrettyName).toBe('Test Generator Name')
  })

  test.skip('onStepValidated - method', () => {
    wrapper = initComponent(App, {}, true)
    wrapper.vm.stepValidated = false

    wrapper.vm.onStepValidated(false);
    expect(wrapper.vm.stepValidated).toBeFalsy()

    wrapper.vm.onStepValidated(true);
    expect(wrapper.vm.stepValidated).toBeTruthy()
  })

  test('setMessages - method', () => {
    wrapper = initComponent(App, {}, true)
    expect(wrapper.vm.messages).toEqual({})

    wrapper.vm.setMessages({test: "test1"});
    expect(wrapper.vm.messages).toEqual({test: "test1"})
  })

  describe('next - method', () => {
    test('promptIndex is greater than prompt quantity, resolve is defined', () => {
      wrapper = initComponent(App, {}, true)
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
      wrapper = initComponent(App, {}, true)
     
      wrapper.vm.resolve = () => {
        throw new Error('test_error')
      }
      wrapper.vm.reject = jest.fn()
      const rejectSpy = jest.spyOn(wrapper.vm, 'reject')
      wrapper.vm.promptIndex = 1 
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.rpc = {
        invoke: () => new Promise(resolve => setTimeout(() => resolve(), 300))
      }

      wrapper.vm.next()

      expect(rejectSpy).toHaveBeenCalledWith(new Error('test_error'))
      rejectSpy.mockRestore()
    })

    test('resolve method does not exist', () => {
      wrapper = initComponent(App, {}, true)
     
      wrapper.vm.resolve = undefined
      wrapper.vm.promptIndex = 1 
      wrapper.vm.prompts = [{}, {}]

      wrapper.vm.next()

      expect(wrapper.vm.promptIndex).toBe(2)
      expect(wrapper.vm.prompts[0].active).toBeFalsy()
      expect(wrapper.vm.prompts[2].active).toBeTruthy()
    })
  })

  describe('setPromptList - method', () => {
    test('prompts is empty array', () => {
      wrapper = initComponent(App)
      
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.currentPrompt.status = 'pending'

      wrapper.vm.setPromptList([])

      expect(wrapper.vm.prompts).toHaveLength(2)
    })

    test('prompts is undefined', () => {
      wrapper = initComponent(App)
      
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.currentPrompt.status = 'pending'

      wrapper.vm.setPromptList()

      expect(wrapper.vm.prompts).toHaveLength(2)
    })
  })
  
  test('prompt name and description', () => {
      wrapper = initComponent(App)
      
      wrapper.vm.prompts = [{}, {name: "Loading..."}]
      wrapper.vm.promptIndex = 1

      wrapper.vm.setMessages({step_is_pending: "Loading..."});
      wrapper.vm.updateCurrentPrompt({name: "name2", description: "desc2", questions: [{}, {}, {}, {}]})
      expect(wrapper.vm.currentPrompt.questions).toHaveLength(4)
      expect(wrapper.vm.currentPrompt.name).toBe("name2");
      expect(wrapper.vm.currentPrompt.description).toBe("desc2");
    })
  });

  describe('generatorInstall - method', () => {
    test('status is pending', () => {
      wrapper = initComponent(App, {}, true)
      
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.currentPrompt.status = 'pending'

      wrapper.vm.generatorInstall()

      expect(wrapper.vm.isDone).toBeTruthy()
    })
  })

  describe('generatorDone - method', () => {
    test('status is pending', () => {
      wrapper = initComponent(App, {donePath: 'testDonePath'}, true)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.currentPrompt.status = 'pending'

      wrapper.vm.generatorDone(true, 'testMessage', '/test/path')

      expect(wrapper.vm.doneMessage).toBe('testMessage')
      expect(wrapper.vm.donePath).toBe('/test/path')
      expect(wrapper.vm.isDone).toBeTruthy()
      expect(wrapper.vm.currentPrompt.name).toBe('Summary')
    })
  })

  describe('setBusyIndicator - method', () => {
    it('prompts is empty', () => {
      wrapper = initComponent(App, {}, true)
      wrapper.vm.prompts = []
      wrapper.vm.setBusyIndicator()
      expect(wrapper.vm.showBusyIndicator).toBeTruthy()
    })

    it('isDone is false, status is pending, prompts is not empty', () => {
      wrapper = initComponent(App, {}, true)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.isDone = false
      wrapper.vm.currentPrompt.status = 'pending'
      wrapper.vm.setBusyIndicator()
      expect(wrapper.vm.showBusyIndicator).toBeTruthy()
    })

    it('isDone is true, status is pending, prompts is not empty', () => {
      wrapper = initComponent(App, {}, true)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.isDone = true
      wrapper.vm.currentPrompt.status = 'pending'
      wrapper.vm.setBusyIndicator()
      expect(wrapper.vm.showBusyIndicator).toBeFalsy()
    })
  })

  describe('toggleConsole - method', () => {
    test('showConsole property updated from toggleConsole()', () => {
      wrapper = initComponent(App, {}, true)
      wrapper.vm.toggleConsole()
      expect(wrapper.vm.showConsole).toBeTruthy()
      wrapper.vm.toggleConsole()
      expect(wrapper.vm.showConsole).toBeFalsy()
    })
  })

  describe('init - method', () => {
    test('isInVsCode = true', () => {
      wrapper = initComponent(App)
      
      wrapper.vm.isInVsCode = jest.fn().mockReturnValue(true)
      wrapper.vm.init()

      expect(wrapper.vm.promptIndex).toBe(0)
      expect(wrapper.vm.prompts).toStrictEqual([])
      expect(wrapper.vm.consoleClass).toBe('consoleClassHidden')
    })

    test('isInVsCode = false', () => {
      wrapper = initComponent(App)
      
      wrapper.vm.isInVsCode = jest.fn().mockReturnValue(false)
      wrapper.vm.init()

      expect(wrapper.vm.consoleClass).toBe('consoleClassVisible')
    })

  })

  test('reload - method', () => {
    wrapper = initComponent(App)

    wrapper.vm.rpc = {
      invoke: jest.fn(),
      registerMethod: jest.fn()
    }
    const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    
    wrapper.vm.init = jest.fn()
    const initSpy = jest.spyOn(wrapper.vm, 'init')

    wrapper.vm.reload();
    
    expect(initSpy).toHaveBeenCalled()
    expect(invokeSpy).toHaveBeenCalledWith("receiveIsWebviewReady", [])

    invokeSpy.mockRestore()
  })

  describe('headerTitle - computed', () => {
    it('generatorPrettyName is empty', () => {
      wrapper = initComponent(App, {}, true)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.$data.generatorPrettyName = null;
      wrapper.vm.$data.messages = {yeoman_ui_title: "yeoman_ui_title"};
      expect(wrapper.vm.headerTitle).toEqual("yeoman_ui_title")
    })

    it('generatorPrettyName is not empty', async () => {
      wrapper = initComponent(App, {}, true)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.$data.generatorPrettyName = "testGeneratorPrettyName";
      wrapper.vm.$data.messages = {yeoman_ui_title: "yeoman_ui_title"};
      expect(wrapper.vm.headerTitle).toEqual("yeoman_ui_title - testGeneratorPrettyName")
    })
  })
})
