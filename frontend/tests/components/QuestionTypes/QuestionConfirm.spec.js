import QuestionConfirm from '../../../src/components/QuestionTypes/QuestionConfirm.vue'
import { initComponent, destroy } from '../../Utils'

let wrapper

describe('QuestionConfirm.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    test('currentQuestion.answer - watcher', () => {
        wrapper = initComponent(QuestionConfirm, {
            currentQuestion: {
                answer: "testAnswer"
            },
            questionIndex: 2
        })

        wrapper.vm.$options.watch["currentQuestion.answer"].handler.call(wrapper.vm)
        expect(wrapper.emitted('changedQuestionIndex')[0]).toEqual([2])
    })
})
