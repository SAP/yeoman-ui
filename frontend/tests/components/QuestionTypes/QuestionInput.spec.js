import QuestionInput from '../../../src/components/QuestionTypes/QuestionInput.vue'
import {BFormInput} from 'bootstrap-vue'
import {initComponent, destroy} from '../../Utils'

let wrapper


describe('QuestionInput.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    describe('typeMapper - filter', () => {
        test('type should not be formatted', () => {
            wrapper = initComponent(QuestionInput, {
                currentQuestion: {
                    type: 'time', default: 'testDefault', answer: 'testAnswer'
                }
            })
            
            const bFormInput = wrapper.find(BFormInput)
            expect(bFormInput.vm.type).toBe('time')
        })

        test('type should be formatted', () => {
            wrapper = initComponent(QuestionInput, {
                currentQuestion: {
                    type: 'input', default: 'testDefault', answer: 'testAnswer'
                }
            })
            
            const bFormInput = wrapper.find(BFormInput)
            expect(bFormInput.vm.type).toBe('text')
        })
    })

    describe('text - watcher', () => {
        test('text size is 0', async () => {
            wrapper = initComponent(QuestionInput, {
                currentQuestion: {
                    type: 'time', default: 'testDefault', answer: 'testAnswer'
                }
            })
            
            wrapper.vm.$data.text = ''
            await wrapper.vm.$nextTick()
            expect(wrapper.vm.currentQuestion.answer).toBe('testDefault')
        })

        test('text size is not 0', async () => {
            wrapper = initComponent(QuestionInput, {
                currentQuestion: {
                    type: 'time', default: 'testDefault', answer: 'testAnswer'
                }
            })
            
            wrapper.vm.$data.text = 'test_value'
            await wrapper.vm.$nextTick()
            expect(wrapper.vm.currentQuestion.answer).toBe('test_value')
        })
    })
})
