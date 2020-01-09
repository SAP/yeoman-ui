import QuestionExpand from '../../../src/components/QuestionTypes/QuestionExpand.vue'
import {initComponent, destroy} from '../../Utils'

let wrapper


describe('QuestionExpand.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    test('onClick - method', async () => {
        wrapper = initComponent(QuestionExpand, {
            currentQuestion: {
                choices: [{value: 'testValue', name: 'testName'}]
            }
        }, true)

        expect(wrapper.vm.currentQuestion.answer).toBeUndefined()

        wrapper.find('button').trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.vm.currentQuestion.answer).toBe('testValue')
    })
})
