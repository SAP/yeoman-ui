import { shallowMount, mount } from '@vue/test-utils'
import Header from '../../src/components/Header.vue'
import Vue from 'vue'
import BootstrapVue, { BButton } from 'bootstrap-vue'
import _ from 'lodash'

Vue.use(BootstrapVue)


let wrapper

describe('Header.vue', () => {
    afterEach(() => {
        if (wrapper) {
            wrapper.destroy();
        }
    })

    test('component name', () => {
        wrapper = shallowMount(Header)
        expect(wrapper.name()).toBe('Header')
    })

    test('component props', () => {
        wrapper = shallowMount(Header)
        expect(_.keys(wrapper.props())).toHaveLength(5)
    })

    test('generator brand', () => {
        const testGen = 'testGenerator'
        wrapper = shallowMount(Header, {
            propsData: { generatorName: testGen }
        })
        expect(wrapper.find('#genBrand').text()).toBe(`Generator: ${testGen}`)
    })

    test('step text', () => {
        const testPrompt = 'testPrompt'
        const testNumOfSteps = 3
        wrapper = shallowMount(Header, {
            propsData: { currentPrompt: testPrompt, numOfSteps: testNumOfSteps }
        })
        expect(wrapper.find('#textStep').text()).toBe(`Step: ${testPrompt}/${testNumOfSteps}`)
    })

    test('step name text', () => {
        const testStepName = 'testStepName'
        wrapper = shallowMount(Header, {
            propsData: { stepName: testStepName }
        })
        expect(wrapper.find('#textStepName').text()).toBe(testStepName)
    })

    test('click triggers collapseLog method', async () => {
        const rpcInvokeMockFunction = jest.fn()
        wrapper = mount(Header, {
            propsData: {
                rpc: {
                    invoke: rpcInvokeMockFunction
                }
            }
        })
        
        wrapper.find(BButton).trigger('click')
        await wrapper.vm.$nextTick()
        expect(rpcInvokeMockFunction).toHaveBeenCalled()  
    })
})