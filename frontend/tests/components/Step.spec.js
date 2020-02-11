import {initComponent, destroy} from '../Utils'
import Step from '../../src/components/Step.vue'

let wrapper


describe('Step.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    });

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

    test('currentPrompt name,description', () => {
        const testName = 'testName'
        const testDescription = 'testDescription'
        wrapper = initComponent(Step, {
            currentPrompt: {
                name: testName,
                description: testDescription,
                questions: [
                    {isWhen: true, message: "testMessage", type: 'input', isValid: true}
                ]
            }
        })
        expect(wrapper.find('v-card-title-stub').text()).toBe(testName)
        expect(wrapper.find('v-card-subtitle-stub').text()).toBe(testDescription)
    })
})