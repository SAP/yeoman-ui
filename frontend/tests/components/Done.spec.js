import {initComponent, destroy} from '../Utils'
import Done from '../../src/components/Done.vue'
import { BJumbotron, BButton, BContainer } from 'bootstrap-vue'
import _ from 'lodash'


let wrapper


describe.only('Header.vue', () => {
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

    test('click on Close button - closeActiveEditor should be set', async () => {
        wrapper = initComponent(Done, { doneMessage: testDoneMessage, donePath: 'testDonePath', isInVsCode: true}, true)
        wrapper.vm.executeCommand = clickEvent => {
            expect(clickEvent.currentTarget.dataset.commandName).toBe('workbench.action.closeActiveEditor')
        }
        wrapper.find(BButton).trigger('click')
    })

    test('click on Close button - executeCommand should be called', async () => {
        wrapper = initComponent(Done, { doneMessage: testDoneMessage, donePath: 'testDonePath', isInVsCode: true}, true)
        wrapper.vm.executeCommand = jest.fn()
        wrapper.find(BButton).trigger('click')
        expect(wrapper.vm.executeCommand).toHaveBeenCalled()
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
})