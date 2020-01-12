import {initComponent, destroy} from '../Utils'
import QuestionTypeSelector from '../../src/components/QuestionTypeSelector.vue'

let wrapper


describe('QuestionTypeSelector.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    });

    test('component name', () => {
        wrapper = initComponent(QuestionTypeSelector, {
            questions: []
        })
        expect(wrapper.vm.isValid({isValid: true, validationMessage: "test"} )).toBe('')
        expect(wrapper.vm.isValid({isValid: false, validationMessage: "test"} )).toBe("test")

    })

    // test('component props', () => {
    //     wrapper = initComponent(Header)
    //     expect(_.keys(wrapper.props())).toHaveLength(3)
    // })

    // test('generator brand', () => {
    //     const testGen = 'Selected Generator: testGenerator'
    //     wrapper = initComponent(Header, { selectedGeneratorHeader: testGen })
    //     expect(wrapper.find('v-toolbar-title-stub').text()).toBe(testGen)
    //     expect(wrapper.find('v-icon-stub').text()).toBe("mdi-console")
    // })

    // test('click triggers collapseLog method', async () => {
    //     const rpcInvokeMockFunction = jest.fn()
    //     wrapper = initComponent(Header, {
    //         rpc: {
    //             invoke: rpcInvokeMockFunction
    //         }
    //     }, true)
        
    //     wrapper.find("button").trigger('click')
    //     expect(rpcInvokeMockFunction).toHaveBeenCalled()  
    // })
})