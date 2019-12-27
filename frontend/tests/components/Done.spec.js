import {initComponent, destroy} from '../Utils'
import Done from '../../src/components/Done.vue'
import { BButton, BJumbotron } from 'bootstrap-vue'
import _ from 'lodash'

let wrapper

describe('Done.vue', () => {
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

    test('done message', () => {
        const message = "The 'testGenerator' project has been generated."
        wrapper = initComponent(Done, {
            doneMessage: message,
            donePath: 'c:/temp/donePath',
            isInVsCode: true
        }, true)
        expect(wrapper.find(BJumbotron).text()).toContain(`${message}`)
    })

    test('executeCommand method', async () => {
        const message = "The 'testGenerator' project has been generated."
        wrapper = initComponent(Done, {
            doneMessage: message,
            donePath: 'c:/temp/donePath',
            isInVsCode: true
        }, true)
        wrapper.vm.executeCommand = jest.fn()
        const executeCommandSpy = jest.spyOn(wrapper.vm, 'executeCommand')

        wrapper.vm.executeCommand()
        expect(executeCommandSpy).toHaveBeenCalled()  
    })

    test('close method', async () => {
        const message = "The 'testGenerator' project has been generated."
        wrapper = initComponent(Done, {
            doneMessage: message,
            donePath: 'c:/temp/donePath',
            isInVsCode: true
        }, true)
        wrapper.vm.close = jest.fn()
        const closeCommandSpy = jest.spyOn(wrapper.vm, 'close')

        wrapper.vm.close()
        expect(closeCommandSpy).toHaveBeenCalled()  
    })
})