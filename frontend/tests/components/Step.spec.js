import {initComponent, destroy} from '../Utils'
import Step from '../../src/components/Step.vue'
import GeneratorSelection from "../../src/components/QuestionTypes/GeneratorSelection"
import QuestionInput from "../../src/components/QuestionTypes/QuestionInput"

let wrapper


describe('Step.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    });

    test('onChangedQuestionIndex event handler method', async () => {
        wrapper = initComponent(Step, {
            currentPrompt: {
                questions: [{ isWhen: true, message: "testMessage", type: 'input', isValid: true }]
            }
        }, true)
        wrapper.find(QuestionInput).vm.$emit('changedQuestionIndex', 123)
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('changedQuestionIndex')[0]).toEqual([123])
    })

    test('onGeneratorSelected event handler method', async () => {
        wrapper = initComponent(Step, {
            currentPrompt: {
                questions: [{isWhen: true, message: "testMessage", type: 'generators', choices: [{name:"testGenerator"}]}]
            }
        }, true)
        wrapper.find(GeneratorSelection).vm.$emit('generatorSelected', "testGenerator")
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('generatorSelected')[0]).toEqual(['testGenerator'])
    })

    test('watch currentPrompt.questions - step is invalid, no \'stepvalidated\' emitted', async () => {
        wrapper = initComponent(Step, {
            currentPrompt: {
                questions: [
                    {isWhen: true, message: "testMessage1", type: 'generators', isValid: true},
                    {isWhen: true, message: "testMessage2", type: 'input', isValid: false},
                    {isWhen: true, message: "testMessage3", type: 'editor', isValid: false}
                ]
            }
        })

        wrapper.setProps({
            currentPrompt: {
                questions: [
                    { isWhen: true, message: "testMessage1", type: 'generators', isValid: true },
                    { isWhen: true, message: "testMessage2", type: 'input', isValid: true },
                    { isWhen: true, message: "testMessage3", type: 'editor', isValid: false }
                ]
            }
        })

        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('stepvalidated')[0][0]).toBeFalsy()
    })

    test('watch currentPrompt.questions - step is valid, event \'stepvalidated\' emitted', async () => {
        wrapper = initComponent(Step, {
            currentPrompt: {
                questions: [
                    {isWhen: true, message: "testMessage1", type: 'generators', isValid: true},
                    {isWhen: true, message: "testMessage2", type: 'input', isValid: false},
                    {isWhen: true, message: "testMessage3", type: 'editor', isValid: false}
                ]
            }
        })
        wrapper.setProps({
            currentPrompt: {
                questions: [
                    { isWhen: true, message: "testMessage1", type: 'generators', isValid: true },
                    { isWhen: true, message: "testMessage2", type: 'input', isValid: true },
                    { isWhen: true, message: "testMessage3", type: 'editor', isValid: true }
                ]
            }
        })
        await wrapper.vm.$nextTick() 
        expect(wrapper.emitted('stepvalidated')[0][0]).toBeTruthy()
    })
})