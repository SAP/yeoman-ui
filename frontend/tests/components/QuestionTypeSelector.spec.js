import {initComponent, destroy} from '../Utils'
import QuestionTypeSelector from '../../src/components/QuestionTypeSelector.vue'

let wrapper


describe('QuestionTypeSelector.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    });

    test('component name', () => {
        wrapper = initComponent(QuestionTypeSelector, {
            questions: []
        })
        expect(wrapper.vm.isValid({isValid: true, validationMessage: "test"} )).toBe('')
        expect(wrapper.vm.isValid({isValid: false, validationMessage: "test"} )).toBe("test")

    })
})
