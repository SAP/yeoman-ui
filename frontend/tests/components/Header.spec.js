import {initComponent, destroy} from '../Utils'
import Header from '../../src/components/Header.vue'
import { BButton, BNavbarBrand } from 'bootstrap-vue'
import _ from 'lodash'

let wrapper


describe('Header.vue', () => {
    afterEach(() => {
        destroy(wrapper)
    });

    test('component name', () => {
        wrapper = initComponent(Header)
        expect(wrapper.name()).toBe('Header')
    })

    test('component props', () => {
        wrapper = initComponent(Header)
        expect(_.keys(wrapper.props())).toHaveLength(3)
    })

    test('generator brand', () => {
        const testGen = 'testGenerator'
        wrapper = initComponent(Header, { generatorName: testGen })
        expect(wrapper.find(BNavbarBrand).text()).toBe(`Yeoman UI Wizard: ${testGen}`)
    })

    test('click triggers collapseLog method', async () => {
        const rpcInvokeMockFunction = jest.fn()
        wrapper = initComponent(Header, {
            rpc: {
                invoke: rpcInvokeMockFunction
            }
        }, true)
        
        wrapper.find(BButton).trigger('click')
        expect(rpcInvokeMockFunction).toHaveBeenCalled()  
    })
})