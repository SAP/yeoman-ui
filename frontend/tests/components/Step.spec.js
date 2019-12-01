import { mount } from '@vue/test-utils'
import Step from '../../src/components/Step.vue'
import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import GeneratorSelection from "../../src/components/QuestionTypes/GeneratorSelection"

Vue.use(BootstrapVue)

let wrapper

describe('Step.vue', () => {
    afterEach(() => {
        if (wrapper) {
            wrapper.destroy();
        }
    })

    test('onGeneratorSelected event handler method', async () => {
        wrapper = mount(Step, {
            propsData: {
                currentPrompt: {
                    questions: [{isWhen: true, message: "testMessage", type: 'generators'}]
                }
              }
        })
        wrapper.find(GeneratorSelection).vm.$emit('generatorSelected', "testGenerator")
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('generatorSelected')[0]).toEqual(['testGenerator'])
    })

    test('watch currentPrompt.questions', () => {
        
    })
})