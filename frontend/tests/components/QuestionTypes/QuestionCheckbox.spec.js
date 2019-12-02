import QuestionCheckbox from '../../../src/components/QuestionTypes/QuestionCheckbox.vue'
// import {BFormCheckboxGroup} from 'bootstrap-vue'
import {initComponent, destroy} from '../../Utils'

let wrapper


describe('QuestionCheckbox.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    describe('selected - data', () => {
        test('selected is empty array', async () => {
            wrapper = initComponent(QuestionCheckbox, {
                currentQuestion: {
                    choices: [
                        {value: 'testValue1', name: 'testName1', checked: false, text: 'testText1'}, 
                        {value: 'testValue2', name: 'testName2', checked: false, text: 'testText2'}
                    ]
                }
            }, true)

            expect(wrapper.vm.selected).toHaveLength(0)
        })
    })
})
