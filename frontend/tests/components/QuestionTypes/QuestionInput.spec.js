import QuestionInput from '../../../src/components/QuestionTypes/QuestionInput.vue'
import {initComponent, destroy} from '../../Utils'

let wrapper


describe('QuestionInput.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    describe('type - computed', () => {
        test('type should remain the same', () => {
            wrapper = initComponent(QuestionInput, {
                currentQuestion: {
                    type: 'time', default: 'testDefault', answer: 'testAnswer'
                },
                updateQuestionsFromIndex: () => {}
            })
            
            const bFormInput = wrapper.find('v-text-field-stub')
            expect(bFormInput.vm.type).toBe('time')
        })

        test('type should be changed to text', () => {
            wrapper = initComponent(QuestionInput, {
                currentQuestion: {
                    type: 'input', default: 'testDefault', answer: 'testAnswer'
                },
                updateQuestionsFromIndex: () => {}
            })
            
            const bFormInput = wrapper.find('v-text-field-stub')
            expect(bFormInput.vm.type).toBe('text')
        })
    })

    describe('text - method', () => {
        test('text size is 0', async () => {
            wrapper = initComponent(QuestionInput, {
                currentQuestion: {
                    type: 'time', default: 'testDefault', answer: 'testAnswer'
                },
                updateQuestionsFromIndex: () => {}
            })
            
            wrapper.vm.$data.text = ''
            wrapper.vm.onChange()
            expect(wrapper.vm.currentQuestion.answer).toBe('testDefault')
        })

        test('text size is not 0', async () => {
            wrapper = initComponent(QuestionInput, {
                currentQuestion: {
                    type: 'time', default: 'testDefault', answer: 'testAnswer'
                },
                updateQuestionsFromIndex: () => {}
            })
            
            wrapper.vm.$data.text = 'test_value'
            wrapper.vm.onChange()
            expect(wrapper.vm.currentQuestion.answer).toBe('test_value')
        })

        test('text size is equal to previous answer', async () => {
            wrapper = initComponent(QuestionInput, {
                currentQuestion: {
                    type: 'time', default: 'testDefault', answer: 'testAnswer'
                },
                updateQuestionsFromIndex: jest.fn()
            })
            
            const spyUpdateQuestionsFromIndex = jest.spyOn(wrapper.vm, 'updateQuestionsFromIndex')
            wrapper.vm.$data.text = 'testAnswer'
            wrapper.vm.onChange()
            expect(spyUpdateQuestionsFromIndex).not.toHaveBeenCalled()
            spyUpdateQuestionsFromIndex.mockRestore()
        })
    })
})
