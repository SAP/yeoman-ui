import {initComponent, destroy} from './Utils'
import App from '../src/App.vue';
import Vue from 'vue'
import Vuetify from 'vuetify'
import { WebSocket } from 'mock-socket'

Vue.use(Vuetify);
global.WebSocket = WebSocket;

let wrapper;

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
    it('questions are not defined', () => {
      wrapper = initComponent(App, {})
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      expect(wrapper.vm.currentPrompt.answers).toBeUndefined()
    })
  })

  describe('setQuestionProps - method', () => {
    it('set props', async () => {
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

    it('method that doesn\'t exist', async () => {
      wrapper = initComponent(App, {}, true)
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          throw "error";
        })
      }

      const questions = [
        { name: 'validateQ', validate: '__Function' }
      ]
      wrapper.vm.prepQuestions(questions, 'promptName');
      await expect(questions[0].validate()).rejects.toEqual("error");
    })

    // the delay ensures we call the busy indicator
    it('validate() with delay', async () => {
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

  it('initRpc - method', () => {
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
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.generatorInstall, thisArg: wrapper.vm, name: 'generatorInstall'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.generatorDone, thisArg: wrapper.vm, name: 'generatorDone'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.log, thisArg: wrapper.vm, name: 'log'})
    expect(invokeSpy).toHaveBeenCalledWith("receiveIsWebviewReady", [])

    invokeSpy.mockRestore()
    registerMethodSpy.mockRestore()
  })

  it('runGenerator - method', () => {
    wrapper = initComponent(App, {}, true)
    wrapper.vm.rpc = {
      invoke: jest.fn()
    }

    const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    wrapper.vm.runGenerator('testGenerator');
    
    expect(invokeSpy).toHaveBeenCalledWith("runGenerator", ['testGenerator'])
    
    invokeSpy.mockRestore()
  })

  it('log - method', () => {
    wrapper = initComponent(App, {}, true)
    wrapper.vm.logText = 'test_'

    wrapper.vm.log('test_log');
    
    expect(wrapper.vm.logText).toBe('test_test_log')
  })

  describe('selectGenerator - method', () => {
    it('currentPrompt is undefined', () => {
      wrapper = initComponent(App)
      wrapper.vm.generatorName = 'test_ge_name'

      wrapper.vm.selectGenerator('testGeneratorName', 'Test Generator Name');
      
      expect(wrapper.vm.generatorName).toBe('testGeneratorName')
      expect(wrapper.vm.generatorPrettyName).toBe('Test Generator Name')
    })

    it('currentPrompt is defined', () => {
      wrapper = initComponent(App)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.generatorName = 'test_ge_name'
      wrapper.vm.selectGenerator('testGeneratorName', 'Test Generator Name');
      
      expect(wrapper.vm.generatorName).toBe('testGeneratorName')
      expect(wrapper.vm.generatorPrettyName).toBe('Test Generator Name')
      expect(wrapper.vm.currentPrompt.answers.name).toBe('testGeneratorName')
    })
  })

  it('setState - method', () => {
    wrapper = initComponent(App, {}, true)
    expect(wrapper.vm.messages).toEqual({})

    wrapper.vm.setState({messages: {test: "test1"}});
    expect(wrapper.vm.messages).toEqual({test: "test1"})
  })

  describe('next - method', () => {
    it('promptIndex is greater than prompt quantity, resolve is defined', () => {
      wrapper = initComponent(App, {})
      wrapper.vm.resolve = jest.fn()
      wrapper.vm.reject = jest.fn()
      wrapper.vm.promptIndex = 1 
      wrapper.vm.prompts = [{}, {}]
      const resolveSpy = jest.spyOn(wrapper.vm, 'resolve')

      wrapper.vm.next()

      expect(resolveSpy).toHaveBeenCalled()
      expect(wrapper.vm.promptIndex).toBe(2)
      expect(wrapper.vm.prompts).toHaveLength(3);
      expect(wrapper.vm.prompts[0].active).toBeFalsy()
      expect(wrapper.vm.prompts[2].active).toBeTruthy()
      resolveSpy.mockRestore()
    })

    it('promptIndex is less than prompt length', () => {
      wrapper = initComponent(App, {})
      wrapper.vm.resolve = jest.fn()
      wrapper.vm.reject = jest.fn()
      wrapper.vm.promptIndex = 0
      wrapper.vm.prompts = [{}, {}]
      const resolveSpy = jest.spyOn(wrapper.vm, 'resolve')

      wrapper.vm.next()

      expect(resolveSpy).toHaveBeenCalled()
      expect(wrapper.vm.promptIndex).toBe(1)
      expect(wrapper.vm.prompts).toHaveLength(2);
      expect(wrapper.vm.prompts[0].active).toBeFalsy()
      expect(wrapper.vm.prompts[1].active).toBeTruthy()
      resolveSpy.mockRestore()
    })

    it('resolve method throws an exception', () => {
      wrapper = initComponent(App, {})
     
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

    it('resolve method does not exist', () => {
      wrapper = initComponent(App, {})
     
      wrapper.vm.resolve = undefined
      wrapper.vm.promptIndex = 1 
      wrapper.vm.prompts = [{}, {}]

      wrapper.vm.next()

      expect(wrapper.vm.promptIndex).toBe(2)
      expect(wrapper.vm.prompts[0].active).toBeFalsy()
      expect(wrapper.vm.prompts[2].active).toBeTruthy()
    })
  })

  describe('back - method', () => {
    test('promptIndex is 0 (Select Generator)', () => {
      wrapper = initComponent(App, {}, true);
      wrapper.vm.rpc = {
        invoke: jest.fn(),
        registerMethod: jest.fn()
      }  
      const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke');

      wrapper.vm.resolve = undefined;
      wrapper.vm.promptIndex = 1;
      wrapper.vm.prompts = [{}, {}];

      wrapper.vm.back();

      expect(wrapper.vm.promptIndex).toBe(0);
      expect(wrapper.vm.prompts.length).toBe(0);
      expect(wrapper.vm.isReplaying).toBe(false);
      expect(invokeSpy).toHaveBeenCalledWith("receiveIsWebviewReady", []);
    });

    test('promptIndex is updated', () => {
      wrapper = initComponent(App, {}, true);
      wrapper.vm.rpc = {
        invoke: jest.fn(),
        registerMethod: jest.fn()
      }  
      const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke');

      wrapper.vm.resolve = undefined;
      wrapper.vm.promptIndex = 2;
      wrapper.vm.prompts = [{}, {}, {}];

      wrapper.vm.back();

      expect(wrapper.vm.promptIndex).toBe(2);
      expect(wrapper.vm.prompts.length).toBe(3);
      expect(wrapper.vm.isReplaying).toBe(true);
      expect(invokeSpy).toHaveBeenCalledWith("back", [undefined]);
    });

    test('set props', async () => {
      wrapper = initComponent(App, {}, true)
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation((...args) => { return args[1][1] })
      }
      const questions = [{},{}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.isReplaying = true;
      wrapper.vm.showPrompt(questions, 'promptName');
      await Vue.nextTick()
      expect(wrapper.vm.promptIndex).toBe(0);
    });
  });

  describe('setPromptList - method', () => {
    it('prompts is empty array', () => {
      wrapper = initComponent(App)
      
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.currentPrompt.status = 'pending'

      wrapper.vm.setPromptList([])

      expect(wrapper.vm.prompts).toHaveLength(2)
    })

    it('prompts is undefined', () => {
      wrapper = initComponent(App)
      
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.currentPrompt.status = 'pending'

      wrapper.vm.setPromptList()

      expect(wrapper.vm.prompts).toHaveLength(2)
    })

    it('while replaying', () => {
      wrapper = initComponent(App);

      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.isReplaying = true;
      wrapper.vm.currentPrompt.status = 'pending';

      const prompts = [{}, {}, {}];
      wrapper.vm.setPromptList(prompts);

      expect(wrapper.vm.prompts).toHaveLength(4);
      expect(wrapper.vm.isReplaying).toBe(true);
    })
  })

  describe('generatorInstall - method', () => {
    it('status is pending', () => {
      wrapper = initComponent(App, {})
      
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.currentPrompt.status = 'pending'

      wrapper.vm.generatorInstall()

      expect(wrapper.vm.isDone).toBeTruthy()
    })
  })

  describe('setTargetFolder - method', () => {
    it('answers is empty', () => {
      wrapper = initComponent(App, {})

      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.currentPrompt.status = 'pending'

      const result = wrapper.vm.setTargetFolder()

      expect(result).toBeUndefined();
    })

    it('answers has "generators.target.folder"', () => {
      wrapper = initComponent(App, {})
      
      wrapper.vm.rpc = {
        invoke: jest.fn()
      };

      const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke');

      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.currentPrompt.status = 'pending'

      wrapper.vm.setTargetFolder({"generators.target.folder": "testPath"})

      expect(invokeSpy).toHaveBeenCalledWith("setCwd", ["testPath"])
    })
  })

  describe('generatorDone - method', () => {
    test('status is pending', () => {
      wrapper = initComponent(App, {donePath: 'testDonePath'})
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
    it('showConsole property updated from toggleConsole()', () => {
      wrapper = initComponent(App, {}, true)
      wrapper.vm.toggleConsole()
      expect(wrapper.vm.showConsole).toBeTruthy()
      wrapper.vm.toggleConsole()
      expect(wrapper.vm.showConsole).toBeFalsy()
    })
  })

  describe('init - method', () => {
    it('isInVsCode = true', () => {
      wrapper = initComponent(App)
      
      wrapper.vm.isInVsCode = jest.fn().mockReturnValue(true)
      wrapper.vm.init()

      expect(wrapper.vm.promptIndex).toBe(0)
      expect(wrapper.vm.prompts).toStrictEqual([])
      expect(wrapper.vm.consoleClass).toBe('consoleClassHidden')
    })

    it('isInVsCode = false', () => {
      wrapper = initComponent(App)
      
      wrapper.vm.isInVsCode = jest.fn().mockReturnValue(false)
      wrapper.vm.init()

      expect(wrapper.vm.consoleClass).toBe('consoleClassVisible')
    })
  })

  it('reload - method', () => {
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
      wrapper = initComponent(App)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.$data.generatorPrettyName = null;
      wrapper.vm.$data.messages = {yeoman_ui_title: "yeoman_ui_title"};
      expect(wrapper.vm.headerTitle).toEqual("yeoman_ui_title")
    })

    it('generatorPrettyName is not empty', () => {
      wrapper = initComponent(App)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      wrapper.vm.$data.generatorPrettyName = "testGeneratorPrettyName";
      wrapper.vm.$data.messages = {yeoman_ui_title: "yeoman_ui_title"};
      expect(wrapper.vm.headerTitle).toEqual("yeoman_ui_title - testGeneratorPrettyName")
    })
  })
})
