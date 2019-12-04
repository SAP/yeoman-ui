import QuestionList from '../../../src/components/QuestionTypes/QuestionList.vue'
import {BFormSelect} from 'bootstrap-vue'
import {initComponent, destroy} from '../../Utils'

let wrapper


describe('QuestionList.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    describe('setDefaultAnswer - method', () => {
        test('default is number', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { name: 'testName1', value: 'testName1' },
                        { name: 'testName2', value: 'testName2' }
                    ],
                    default: 1
                }
            })
            
            wrapper.vm.setDefaultAnswer()
            expect(wrapper.vm.currentQuestion.answer).toBe('testName2')
        })

        test('default is string', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { name: 'testName1', value: 'testName1' },
                        { name: 'testName2', value: 'testName2' }
                    ],
                    default: 'testName1'
                }
            })
            wrapper.vm.setDefaultAnswer()
            expect(wrapper.vm.currentQuestion.answer).toBe('testName1')
        })

        test('default is boolean', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { name: 'testName1', value: 'testName1' },
                        { name: 'testName2', value: 'testName2' }
                    ],
                    default: true
                }
            })
            wrapper.vm.setDefaultAnswer()
            expect(wrapper.vm.currentQuestion.answer).toBeUndefined()
        })

        test('call setDefaultAnswer twice', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { name: 'testName1', value: 'testName1' },
                        { name: 'testName2', value: 'testName2' }
                    ],
                    default: 1
                }
            })
            wrapper.vm.setDefaultAnswer()
            expect(wrapper.vm.currentQuestion.answer).toBe('testName2')
            wrapper.vm.currentQuestion.choices.pop()
            wrapper.vm.setDefaultAnswer()
            expect(wrapper.vm.currentQuestion.answer).toBe('testName2')
        })
    })

    describe('options - computed', () => {
        test('values parameter is not an array', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    name: 'testName1', checked: true, text: 'testText1'
                }
            })
            
            const options = wrapper.find(BFormSelect).vm.options
            expect(options).toHaveLength(0)
        })

        test('values parameter is an array', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { name: 'testName1', type: 'number', text: 'testText1' },
                        { name: 'testName2', type: 'separator', text: 'testText2', disabled: false, line: '===' },
                        { name: 'testName3', type: 'string' },
                        { name: 'testName4', type: 'separator', text: 'testText4', disabled: false },
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