import { initComponent, destroy } from '../Utils'
import Navigation from '../../src/components/Navigation.vue'
import Vue from 'vue'
//There are issues of importing vuetify components https://github.com/vuejs/vue-cli/issues/1584
// import { VBtn } from 'vuetify/lib'

import _ from 'lodash'

let wrapper

describe('Navigation.vue', () => {

    afterEach(() => {
        destroy(wrapper)
    });

    test('component name', () => {
        wrapper = initComponent(Navigation,{promptIndex: 1,prompts: 1}, true)
        expect(wrapper.name()).toBe('Navigation')
    })

    test('component props', () => {
        wrapper = initComponent(Navigation,{promptIndex: 1,prompts: 1}, true)
        expect(_.keys(wrapper.props())).toHaveLength(2)
    })

    test('component props', () => {
        wrapper = initComponent(Navigation,{promptIndex: 1,prompts: 1}, true)
        expect(wrapper.vm.steps).toEqual(1)
        expect(wrapper.vm.currentStep).toEqual(1)
        wrapper.vm.$options.watch.prompts.call(wrapper.vm, [1,2,3])
        expect(wrapper.vm.steps).toEqual(3)
        wrapper.vm.$options.watch.promptIndex.call(wrapper.vm, 5)
        return wrapper.vm.$nextTick().then(() => {
            expect(wrapper.vm.currentStep).toEqual(6)
        });        
    })

    describe('gotoStep', () => {
        test('numOfSteps > 0', async () => {
            wrapper = initComponent(Navigation,{promptIndex: 1,prompts: 1}, true)
            expect(wrapper.vm.steps).toEqual(1)
            expect(wrapper.vm.currentStep).toEqual(1)
            wrapper.vm.$options.watch.prompts.call(wrapper.vm, [1,2,3])
            expect(wrapper.vm.steps).toEqual(3)
            wrapper.vm.$options.watch.promptIndex.call(wrapper.vm, 2)
    
            await Vue.nextTick()
            expect(wrapper.vm.currentStep).toEqual(3);
    
            let numOfSteps = wrapper.vm.currentStep - 1;
            wrapper.vm.gotoStep(numOfSteps);
    
            expect(wrapper.emitted().onGotoStep).toBeTruthy();
        })

        test('numOfSteps = 0', async () => {
            wrapper = initComponent(Navigation,{promptIndex: 1,prompts: 1}, true)
            expect(wrapper.vm.steps).toEqual(1)
            expect(wrapper.vm.currentStep).toEqual(1)
            wrapper.vm.$options.watch.prompts.call(wrapper.vm, [1,2,3])
            expect(wrapper.vm.steps).toEqual(3)
            wrapper.vm.$options.watch.promptIndex.call(wrapper.vm, 2)
    
            await Vue.nextTick()
            expect(wrapper.vm.currentStep).toEqual(3);
    
            let numOfSteps = wrapper.vm.currentStep - 3;
            wrapper.vm.gotoStep(numOfSteps);
    
            expect(wrapper.emitted().onGotoStep).toBeFalsy();
        })
    })

    test('getStepClass method', async () => {
        wrapper = initComponent(Navigation,{promptIndex: 1,prompts: 1}, true)
        expect(wrapper.vm.steps).toEqual(1)
        expect(wrapper.vm.currentStep).toEqual(1)
        wrapper.vm.$options.watch.prompts.call(wrapper.vm, [1,2,3])
        expect(wrapper.vm.steps).toEqual(3)
        wrapper.vm.$options.watch.promptIndex.call(wrapper.vm, 2)

        await Vue.nextTick()
        expect(wrapper.vm.currentStep).toEqual(3);

        let claz = wrapper.vm.getStepClass(wrapper.vm.currentStep, 1);
        expect(claz).toEqual({'step-linkable' : true});

        claz = wrapper.vm.getStepClass(wrapper.vm.currentStep, 3);
        expect(claz).toEqual({'step-linkable' : false});
    })
})
