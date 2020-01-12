import {initComponent, destroy} from '../Utils'
import Done from '../../src/components/Done.vue'
import { BJumbotron} from 'bootstrap-vue'
import _ from 'lodash'

let wrapper

describe('Done.vue', () => {
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

})
