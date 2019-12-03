import QuestionList from '../../../src/components/QuestionTypes/QuestionList.vue'
import {BFormSelect} from 'bootstrap-vue'
import {initComponent, destroy} from '../../Utils'

let wrapper


describe('QuestionList.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    describe('formatList - method', () => {
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

    describe('currentQuestion.choices', () => {
        test.skip('', () => {

        })
    })

    describe('listFilter - filter', () => {
        test('values parameter is not an array', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    value: 'testValue1', name: 'testName1', checked: true, text: 'testText1'
                }
            })
            const options = wrapper.find(BFormSelect).vm.options
            expect(options).toHaveLength(0)
        })

        test('values parameter is an array', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { value: 'testValue1', name: 'testName1', type: 'number', text: 'testText1' },
                        { value: 'testValue2', name: 'testName2', type: 'separator', text: 'testText2', disabled: false, line: '===' },
                        { value: 'testValue3', name: 'testName3', type: 'string' },
                        { value: 'testValue4', name: 'testName4', type: 'separator', text: 'testText4', disabled: false },
                    ]
                }
            })
            const options = wrapper.find(BFormSelect).vm.options
            expect(options).toHaveLength(4)
            expect(options[0].name).toBe('testName1')
            expect(options[0].text).toBe('testText1')
            expect(options[1].disabled).toBe(true)
            expect(options[1].text).toBe('===')
            expect(options[2].text).toBe('testName3')
            expect(options[3].disabled).toBe(true)
            expect(options[3].text).toBe('──────────────')
        })
    })
})