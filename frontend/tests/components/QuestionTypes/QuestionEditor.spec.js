import QuestionEditor from '../../../src/components/QuestionTypes/QuestionEditor.vue'
import {initComponent, destroy} from '../../Utils'

let wrapper


describe('QuestionEditor.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    describe('text - watcher', () => {
        test('text size is 0', () => {
            wrapper = initComponent(QuestionEditor, {
                currentQuestion: {
                    default: 'testDefault', answer: 'testAnswer'
                }
            })
            
            wrapper.vm.$data.text = ''
            expect(wrapper.vm.currentQuestion.answer).toBe('testDefault')
        })

        test('text size is not 0', () => {
            wrapper = initComponent(QuestionEditor, {
                currentQuestion: {
                    default: 'testDefault', answer: 'testAnswer'
                }
            })
            
            wrapper.vm.$data.text = 'test_value'
            expect(wrapper.vm.currentQuestion.answer).toBe('test_value')
        })
    })
})
