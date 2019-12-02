import GeneratorSelection from '../../../src/components/QuestionTypes/GeneratorSelection.vue'
import {BCard} from 'bootstrap-vue'
import {initComponent, destroy} from '../../Utils'

let wrapper


describe('GeneratorSelection.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    })

    describe('getImageUrl - method', () => {
        test('imageUrl is defined on currentQuestion', () => {
            const getImageUrlSpy = jest.spyOn(GeneratorSelection.methods, 'getImageUrl')
            wrapper = initComponent(GeneratorSelection, {
                currentQuestion: {
                    choices: [{imageUrl: 'testImageUrl', name: 'testName'}]
                }
            }, true)
            expect(getImageUrlSpy).toHaveReturnedWith('testImageUrl')
        })
        
        test('imageUrl is not defined on currentQuestion', async () => {
            wrapper = initComponent(GeneratorSelection, {
                currentQuestion: {
                    choices: [{name: 'testName'}]
                }
            }, true)
            wrapper.setData({publicPath: 'testPublicPath-'})
            expect(wrapper.vm.getImageUrl({})).toBe("testPublicPath-generator.png")
        })
    })

    describe('emitSelection - method', () => {
        beforeEach(() => {
            wrapper = initComponent(GeneratorSelection, {
                currentQuestion: {
                    choices: [{imageUrl: 'testImageUrl', name: 'testName'}]
                }
            }, true)
        })

        test('on click event of BCard', async () => {
            wrapper.find(BCard).trigger('click')
            await wrapper.vm.$nextTick()
            expect(wrapper.emitted('generatorSelected')).toBeTruthy()
            expect(wrapper.vm.$options.propsData.currentQuestion.answer).toBe('testName')
        })
    })
    
    describe('select - method', () => {
        beforeEach(() => {
            wrapper = initComponent(GeneratorSelection, {
                currentQuestion: {
                    choices: [
                        {imageUrl: 'testImageUrl1', name: 'testName1'}, 
                        {imageUrl: 'testImageUrl2', name: 'testName2'}
                    ]
                }
            }, true)
        })

        test('on click event of BCard', async () => {
            wrapper.find(BCard).trigger('click')
            await wrapper.vm.$nextTick()
            expect(wrapper.emitted('generatorSelected')).toBeTruthy()
            expect(wrapper.vm.$options.propsData.currentQuestion.answer).toBe('testName1')
        })

        test('selected 2 generators', async () => {
            const bCards = wrapper.findAll(BCard)
            bCards.wrappers[0].trigger('click')
            await wrapper.vm.$nextTick()
            expect(bCards.wrappers[0].classes()).toContain('selected')
            expect(bCards.wrappers[0].attributes()['border-style']).toBe('solid')

            bCards.wrappers[1].trigger('click')
            await wrapper.vm.$nextTick()
            expect(bCards.wrappers[1].classes()).toContain('selected')
            expect(bCards.wrappers[0].attributes()['border-style']).toBe('none')
            expect(bCards.wrappers[1].attributes()['border-style']).toBe('solid')
        })
    })
})
