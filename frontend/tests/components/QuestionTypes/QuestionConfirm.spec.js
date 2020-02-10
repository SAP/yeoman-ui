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
            questionIndex: 4,
            updateQuestionsFromIndex: jest.fn()
        })

        let updateQuestionsFromIndexSpy = jest.spyOn(wrapper.vm, 'updateQuestionsFromIndex')

        wrapper.vm.$options.watch["currentQuestion.answer"].handler.call(wrapper.vm)
        expect(updateQuestionsFromIndexSpy).toHaveBeenCalledWith(4)

        updateQuestionsFromIndexSpy.mockRestore()
    })
})
