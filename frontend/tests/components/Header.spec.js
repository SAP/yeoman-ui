import {initComponent, destroy} from '../Utils'
import Header from '../../src/components/Header.vue'
//There are issues of importing vuetify components https://github.com/vuejs/vue-cli/issues/1584
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
        expect(_.keys(wrapper.props())).toHaveLength(4)
    })

    test('generator brand', () => {
        const testGen = 'Yeoman Generators'
        wrapper = initComponent(Header, { headerTitle: testGen})
        expect(wrapper.find('v-toolbar-title-stub').text()).toBe(testGen)
        expect(wrapper.find('v-icon-stub').text()).toBe("mdi-console")
    })

    test('click triggers collapseOutput method', async () => {
        const rpcInvokeMockFunction = jest.fn()
        wrapper = initComponent(Header, {
            rpc: {
                invoke: rpcInvokeMockFunction
            }
        }, true)
        
        wrapper.findAll("button").wrappers[0].trigger('click')
        expect(rpcInvokeMockFunction).toHaveBeenCalled()
    })

    test('click triggers reload method', async () => {
        const rpcInvokeMockFunction = jest.fn()
        wrapper = initComponent(Header, {
            rpc: {
                invoke: rpcInvokeMockFunction
            }
        }, true)
        
        wrapper.findAll("button").wrappers[1].trigger('click')
        expect(rpcInvokeMockFunction).not.toHaveBeenCalled()
    })
})
