import QuestionList from '../../../src/components/QuestionTypes/QuestionList.vue'
//import {BFormSelect} from 'bootstrap-vue'
import {initComponent, destroy} from '../../Utils'

let wrapper


describe('QuestionList.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    describe('formatList - method', async () => {
        beforeEach(() => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { value: 'testValue1', name: 'testName1', checked: true, text: 'testText1' },
                        { value: 'testValue2', name: 'testName2', checked: true, text: 'testText2' }
                    ]
                }
            })
        })

        test('input values parameteris not an array', async () => {
            expect(wrapper.vm.formatList({})).toBeUndefined()
        })

        test('input values have no name attribute', async () => {
            expect(wrapper.vm.formatList([{}])).toEqual([{}])
        })

        test('input values have no text attribute', async () => {
            expect(wrapper.vm.formatList([{name: 'testName'}])).toEqual([{name: 'testName', text: 'testName'}])
        })
    })
})