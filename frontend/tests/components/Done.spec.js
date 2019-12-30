import {initComponent, destroy} from '../Utils'
import Done from '../../src/components/Done.vue'
import { BJumbotron, BButton, BContainer } from 'bootstrap-vue'
import _ from 'lodash'


let wrapper


describe('Header.vue', () => {
    const testDoneMessage = 'testDoneMessage'

    afterEach(() => {
        destroy(wrapper)
    });

    test('component name', () => {
        wrapper = initComponent(Done)
        expect(wrapper.name()).toBe('Done')
    })

    test('component props', () => {
        wrapper = initComponent(Done)
        expect(_.keys(wrapper.props())).toHaveLength(3)
    })

    test('doneMessage set', () => {
        wrapper = initComponent(Done, { doneMessage: testDoneMessage })
        expect(wrapper.find(BJumbotron).text()).toBe(testDoneMessage)
    })

    test('doneMessage set, isInVsCode is false', () => {
        wrapper = initComponent(Done, { doneMessage: testDoneMessage, donePath: "", isInVsCode: false }, true)
        expect(wrapper.find(BContainer).vnode).toBeUndefined()
    })

    test('doneMessage set, isInVsCode is true', () => {
        wrapper = initComponent(Done, { doneMessage: testDoneMessage, donePath: "", isInVsCode: true }, true)
        expect(wrapper.find(BContainer).vnode).toBeDefined()
    })

    test('click on Close button - closeActiveEditor should be set and executeCommand should be called', async () => {
        wrapper = initComponent(Done, { doneMessage: testDoneMessage, donePath: 'testDonePath', isInVsCode: true}, true)
        const executeCommandMock = jest.fn(clickEvent => {
            expect(clickEvent.currentTarget.dataset.commandName).toBe('workbench.action.closeActiveEditor')
        })
        wrapper.setMethods({executeCommand: executeCommandMock})
        wrapper.find(BButton).trigger('click')
        expect(executeCommandMock).toHaveBeenCalled()
    })

    // TODO: return branch coverage to 85 after adding more test for this button
    test('click on New Workspace button - executeCommand should be called', async () => {
        window.vscode = {
            postMessage: jest.fn()
        }
        wrapper = initComponent(Done, { doneMessage: testDoneMessage, donePath: 'testDonePath', isInVsCode: true}, true)
        const buttons = wrapper.findAll(BButton)
        const nWorkspaceButton = buttons.wrappers[1]
        nWorkspaceButton.trigger('click')
        expect(window.vscode.postMessage).toHaveBeenCalled()
    })

    test('executeCommand - method', async () => {
        window.vscode = {
            postMessage: jest.fn()
        }
        wrapper = initComponent(Done, { doneMessage: testDoneMessage, donePath: 'testDonePath', isInVsCode: true}, true)
        // event currentTarget.dataset is not set
        let testEvent = {};
        wrapper.vm.executeCommand(testEvent);
        expect(window.vscode.postMessage).not.toHaveBeenCalled()

        // event currentTarget.dataset.commandParams is not set, 
        testEvent = {currentTarget: {dataset: {commandName: 'testCommandName'}}};
        wrapper.vm.executeCommand(testEvent);
        expect(window.vscode.postMessage).toHaveBeenCalledWith({
            command: 'vscodecommand',
            commandName: 'testCommandName',
            commandParams: []
        })

        // event currentTarget.dataset.commandParams is set, 
        testEvent = {currentTarget: {dataset: {commandName: 'testCommandName', commandParams: {param1: 'value1', param2: 'value2'}}}};
        wrapper.vm.executeCommand(testEvent);
        expect(window.vscode.postMessage).toHaveBeenCalledWith({
            command: 'vscodecommand',
            commandName: 'testCommandName',
            commandParams: [{param1: 'value1', param2: 'value2'}]
        })
    })
})
