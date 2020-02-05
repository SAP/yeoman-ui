import QuestionEditor from '../../../src/components/QuestionTypes/QuestionEditor.vue'
import {initComponent, destroy} from '../../Utils'

let wrapper


describe('QuestionEditor.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    describe('onChange - method', () => {
        test('text size is 0', async () => {
            wrapper = initComponent(QuestionEditor, {
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
            wrapper = initComponent(QuestionEditor, {
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
            wrapper = initComponent(QuestionEditor, {
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
