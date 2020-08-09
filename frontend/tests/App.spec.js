import { initComponent, destroy } from './Utils'
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

	describe('rightButtonName - computed', () => {
		it('promptIndex is 0', () => {
			wrapper = initComponent(App, {})
			wrapper.vm.promptsInfoToDisplay = [{}, {}, {}]
			wrapper.vm.promptIndex = 0
			expect(wrapper.vm.rightButtonName).toEqual("Next");
		})

		it('promptIndex is 1', () => {
			wrapper = initComponent(App, {})
			wrapper.vm.promptsInfoToDisplay = [{}, {}, {}]
			wrapper.vm.promptIndex = 1
			expect(wrapper.vm.rightButtonName).toEqual("Next");
		})

		it('promptIndex is 1', () => {
			wrapper = initComponent(App, {})
			wrapper.vm.promptsInfoToDisplay = [{}, {}, {}]
			wrapper.vm.promptIndex = 3
			expect(wrapper.vm.rightButtonName).toEqual("Finish");
		})
	})

	describe("updateGeneratorsPrompt - method", () => {
		it('there are no prompts', () => {
			wrapper = initComponent(App, {})
			wrapper.vm.prompts = []
			wrapper.vm.promptIndex = -1
			wrapper.vm.updateGeneratorsPrompt();
			expect(wrapper.vm.prompts).toHaveLength(0)
		})

		it('there are prompts', () => {
			wrapper = initComponent(App, {})
			wrapper.vm.prompts = [{}]
			wrapper.vm.promptIndex = 1
			wrapper.vm.updateGeneratorsPrompt([{}]);
			expect(wrapper.vm.prompts[0].questions).toHaveLength(1)
		})
	});

	describe('isNoGenerators - method', () => {
		it('no generators', () => {
			wrapper = initComponent(App, {}, true)
			wrapper.vm.promptIndex = 0
			wrapper.vm.prompts = [{ name: "Select Generator", questions: [{ choices: [] }] }]
			wrapper.vm.$data.messages = { select_generator_name: "Select Generator" };
			expect(wrapper.vm.isNoGenerators).toBeTruthy();
		})

		it('generators exist', () => {
			wrapper = initComponent(App, {}, true)
			wrapper.vm.promptIndex = 0
			wrapper.vm.prompts = [{ name: "Select Generator", questions: [{}, { name: "generator", choices: [{}] }] }]
			wrapper.vm.$data.messages = { select_generator_name: "Select Generator" };
			expect(wrapper.vm.isNoGenerators).toBeFalsy();
		})

		it("generators exist question.name != 'generator'", () => {
			wrapper = initComponent(App, {}, true)
			wrapper.vm.promptIndex = 0
			wrapper.vm.prompts = [{ name: "Select Generator", questions: [{}, { choices: [{}] }] }]
			wrapper.vm.$data.messages = { select_generator_name: "Select Generator" };
			expect(wrapper.vm.isNoGenerators).toBeTruthy();
		})

		it('prompt name != generators', () => {
			wrapper = initComponent(App, {}, true)
			wrapper.vm.promptIndex = 0
			wrapper.vm.prompts = [{ name: "Prompt Name", questions: [{ choices: [{}] }] }]
			wrapper.vm.$data.messages = { select_generator_name: "Select Generator" };
			expect(wrapper.vm.isNoGenerators).toBeFalsy();
		})
	})

	describe('getVsCodeApi - method', () => {
		it('not in vscode', () => {
			wrapper = initComponent(App, {}, true)
			wrapper.vm.isInVsCode = () => false;
			const vscodeApi = wrapper.vm.getVsCodeApi();
			expect(vscodeApi).toBeUndefined();
		})
	})

	describe('setMessagesAndSaveState - method', () => {
		it('vscode api exists', async () => {
			wrapper = initComponent(App, {}, true)
			wrapper.vm.rpc = {
				invoke: jest.fn().mockImplementation(async () => { return { data: {} }; })
			}
			wrapper.vm.getVsCodeApi = () => {
				return { setState: () => true };
			};
			wrapper.vm.setMessagesAndSaveState();
		})

		it('vscode api no exists', async () => {
			wrapper = initComponent(App, {}, true)
			wrapper.vm.rpc = {
				invoke: () => new Promise({ data: {} })
			}
			wrapper.vm.rpc = {
				invoke: jest.fn().mockImplementation(async () => { return { data: {} }; })
			}
			wrapper.vm.getVsCodeApi = () => undefined;
			wrapper.vm.setMessagesAndSaveState();
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

			wrapper.vm.prompts = [{}, { name: "Loading..." }]
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

		expect(registerMethodSpy).toHaveBeenCalledWith({ func: wrapper.vm.showPrompt, thisArg: wrapper.vm, name: 'showPrompt' })
		expect(registerMethodSpy).toHaveBeenCalledWith({ func: wrapper.vm.generatorInstall, thisArg: wrapper.vm, name: 'generatorInstall' })
		expect(registerMethodSpy).toHaveBeenCalledWith({ func: wrapper.vm.generatorDone, thisArg: wrapper.vm, name: 'generatorDone' })
		expect(registerMethodSpy).toHaveBeenCalledWith({ func: wrapper.vm.log, thisArg: wrapper.vm, name: 'log' })
		expect(invokeSpy).toHaveBeenCalledWith("getState")

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
			expect(invokeSpy).toHaveBeenCalledWith("getState");
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

			expect(wrapper.vm.isReplaying).toBe(true);
			expect(wrapper.vm.numOfSteps).toBe(1);
			expect(invokeSpy).toHaveBeenCalledWith("back", [undefined, 1]);
		});

		test('set props', async () => {
			wrapper = initComponent(App, {}, true)
			wrapper.vm.rpc = {
				invoke: jest.fn().mockImplementation((...args) => { return args[1][1] })
			}
			const questions = [{}, {}];
			wrapper.vm.promptIndex = 1;
			wrapper.vm.isReplaying = true;
			wrapper.vm.showPrompt(questions, 'promptName');
			await Vue.nextTick()
			expect(wrapper.vm.promptIndex).toBe(0);
		});
	});

	describe('gotoStep - method', () => {
		test('promptIndex is 1, goto 1 step back -> (Select Generator)', () => {
			wrapper = initComponent(App, {}, true);
			wrapper.vm.rpc = {
				invoke: jest.fn(),
				registerMethod: jest.fn()
			}
			const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke');

			wrapper.vm.resolve = undefined;
			wrapper.vm.promptIndex = 1;
			wrapper.vm.prompts = [{}, {}];

			wrapper.vm.gotoStep(1);

			expect(wrapper.vm.promptIndex).toBe(0);
			expect(wrapper.vm.prompts.length).toBe(0);
			expect(wrapper.vm.isReplaying).toBe(false);
			expect(invokeSpy).toHaveBeenCalledWith("getState");
		});

		test('promptIndex is 3, goto 2 step back', async () => {
			wrapper = initComponent(App, {}, true);
			wrapper.vm.rpc = {
				invoke: jest.fn(),
				registerMethod: jest.fn()
			}
			const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke');

			wrapper.vm.resolve = undefined;
			wrapper.vm.promptIndex = 3;
			wrapper.vm.prompts = [{}, {}, {}, {}];

			wrapper.vm.gotoStep(2);

			expect(wrapper.vm.isReplaying).toBe(true);
			expect(wrapper.vm.numOfSteps).toBe(2);
			expect(invokeSpy).toHaveBeenCalledWith("back", [undefined, 2]);
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

	describe('generatorDone - method', () => {
		test('status is pending', () => {
			wrapper = initComponent(App, { donePath: 'testDonePath' })
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
		expect(invokeSpy).toHaveBeenCalledWith("getState")

		invokeSpy.mockRestore()
	})

	describe('headerTitle - computed', () => {
		it('generatorPrettyName is empty', () => {
			wrapper = initComponent(App)
			wrapper.vm.prompts = [{}, {}]
			wrapper.vm.promptIndex = 1
			wrapper.vm.$data.generatorPrettyName = null;
			wrapper.vm.$data.messages = { yeoman_ui_title: "yeoman_ui_title" };
			expect(wrapper.vm.headerTitle).toEqual("yeoman_ui_title")
		})

		it('generatorPrettyName is not empty', () => {
			wrapper = initComponent(App)
			wrapper.vm.prompts = [{}, {}]
			wrapper.vm.promptIndex = 1
			wrapper.vm.$data.generatorPrettyName = "testGeneratorPrettyName";
			wrapper.vm.$data.messages = { yeoman_ui_title: "yeoman_ui_title" };
			expect(wrapper.vm.headerTitle).toEqual("yeoman_ui_title - testGeneratorPrettyName")
		})
	})
})
