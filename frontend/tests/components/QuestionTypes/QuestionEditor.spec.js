import QuestionEditor from '../../../src/components/QuestionTypes/QuestionEditor.vue'
import {initComponent, destroy} from '../../Utils'

let wrapper


describe('QuestionEditor.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    describe('text - watcher', () => {
        test('text size is 0', async () => {
            wrapper = initComponent(QuestionEditor, {
                currentQuestion: {
                    default: 'testDefault', answer: 'testAnswer'
                },
                updateQuestionsFromIndex: () => {}
            })
            
            wrapper.vm.$data.text = ''
            await wrapper.vm.$nextTick()
            expect(wrapper.vm.currentQuestion.answer).toBe('testDefault')
        })

        test('text size is not 0', async () => {
            wrapper = initComponent(QuestionEditor, {
                currentQuestion: {
                    default: 'testDefault', answer: 'testAnswer'
                },
                updateQuestionsFromIndex: () => {}
            })
            
            wrapper.vm.$data.text = 'test_value'
            await wrapper.vm.$nextTick()
            expect(wrapper.vm.currentQuestion.answer).toBe('test_value')
        })
    })
})
