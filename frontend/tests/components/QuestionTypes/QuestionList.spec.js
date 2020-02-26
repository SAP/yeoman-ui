import QuestionList from '../../../src/components/QuestionTypes/QuestionList.vue'
import {initComponent, destroy} from '../../Utils'

let wrapper


describe('QuestionList.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    describe('default - computed', () => {
        test('default is number', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { name: 'testName1' },
                        { name: 'testName2' }
                    ],
                    default: 1
                },
                updateQuestionsFromIndex: () => {}
            })
            
            expect(wrapper.vm.default).toBe('testName2')
        })

        test('default is string', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { name: 'testName1' },
                        { name: 'testName2' }
                    ],
                    default: 'testName1'
                },
                updateQuestionsFromIndex: () => {}
            })
            
            expect(wrapper.vm.default).toBe('testName1')
        })

        test('default is boolean', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { name: 'testName1' },
                        { name: 'testName2' }
                    ],
                    default: true
                },
                updateQuestionsFromIndex: () => {}
            })
            
            expect(wrapper.vm.default).toBeUndefined()
        })

        test('default is undefined', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { name: 'testName1' },
                        { name: 'testName2' }
                    ]
                },
                updateQuestionsFromIndex: () => {}
            })
            
            expect(wrapper.vm.default).toBeUndefined()
        })

        test('default is undefined and choices are strings', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: ['testName1', 'testName2']
                },
                updateQuestionsFromIndex: () => {}
            })
            
            expect(wrapper.vm.default).toBeUndefined()
        })

        test('change selected', async () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { name: 'testName1' },
                        { name: 'testName2' }
                    ],
                    default: 1
                },
                updateQuestionsFromIndex: () => {}
            })
            expect(wrapper.vm.default).toBe('testName2')
            wrapper.vm.$options.watch.default.handler.call(wrapper.vm, 'testName1')
            await wrapper.vm.$nextTick()
            expect(wrapper.vm.currentQuestion.answer).toBe('testName1')
        })

        test('default is calculated from choice value', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    choices: [
                        { name: 'testName1', value: 't1' },
                        { name: 'testName2', value: 't2' }
                    ],
                    default: 1
                },
                updateQuestionsFromIndex: () => {}
            })
            
            expect(wrapper.vm.default).toBe('t2')
        })
    })

    describe('options - computed', () => {
        test('values parameter is not an array', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    name: 'testName1', checked: true, text: 'testText1'
                },
                updateQuestionsFromIndex: () => {}
            })
            
            const options = wrapper.find('v-select-stub').vm.items
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
                },
                updateQuestionsFromIndex: () => {}
            })

            const options = wrapper.find('v-select-stub').vm.items
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

    describe('errorMessages - computed', () => {
        test('data.selected is empty', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    name: 'testName1', text: 'testText1'
                },
                updateQuestionsFromIndex: () => {}
            })

            expect(wrapper.vm.errorMessages).toBe("Click to display the list of options")
        })

        test('data.selected is not empty, currentQuestion.isValid = true', async () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    name: 'testName1', isValid: true, text: 'testText1'
                },
                updateQuestionsFromIndex: () => {}
            })

            wrapper.vm.$data.selected = "test"
            await wrapper.vm.$nextTick()
            expect(wrapper.vm.errorMessages).toBe("")
        })

        test('data.selected is not empty, currentQuestion.isValid = false', () => {
            wrapper = initComponent(QuestionList, {
                currentQuestion: {
                    name: 'testName1', isValid: false, validationMessage: 'validationMessageTest'
                },
                updateQuestionsFromIndex: () => {}
            })

            wrapper.vm.$data.selected = "test"
            expect(wrapper.vm.errorMessages).toBe("validationMessageTest")
        })
    })
})
