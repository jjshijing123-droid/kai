import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import LoadingState from '../../../components/ui/LoadingState.vue'
import { createMockData, ComponentTestHelper } from '../../../tests/utils/testUtils'

describe('LoadingState Component', () => {
  let wrapper
  let helper

  beforeEach(() => {
    helper = new ComponentTestHelper(LoadingState)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('基本功能测试', () => {
    it('应该正常渲染加载状态组件', () => {
      wrapper = helper.mount({
        message: '加载中...'
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.loading-state').exists()).toBe(true)
    })

    it('应该显示正确的加载消息', () => {
      const message = '正在加载数据...'
      wrapper = helper.mount({ message })

      expect(wrapper.text()).toContain(message)
    })

    it('应该显示默认消息当没有提供消息时', () => {
      wrapper = helper.mount()

      expect(wrapper.text()).toContain('加载中')
    })

    it('应该显示加载动画', () => {
      wrapper = helper.mount()

      expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    })
  })

  describe('属性测试', () => {
    it('应该正确处理大小属性', () => {
      wrapper = helper.mount({ size: 'large' })

      expect(wrapper.classes()).toContain('loading-state--large')
    })

    it('应该正确处理颜色属性', () => {
      wrapper = helper.mount({ color: 'primary' })

      expect(wrapper.classes()).toContain('loading-state--primary')
    })

    it('应该正确处理是否显示文本属性', () => {
      wrapper = helper.mount({ showText: false })

      expect(wrapper.find('.loading-text').exists()).toBe(false)
    })
  })

  describe('可访问性测试', () => {
    it('应该具有正确的aria属性', () => {
      wrapper = helper.mount({ message: '加载中' })

      const loadingElement = wrapper.find('[role="status"]')
      expect(loadingElement.exists()).toBe(true)
      expect(loadingElement.attributes('aria-live')).toBe('polite')
    })

    it('应该包含可访问的加载状态描述', () => {
      const message = '正在加载产品数据...'
      wrapper = helper.mount({ message })

      expect(wrapper.attributes('aria-busy')).toBe('true')
    })
  })

  describe('性能测试', () => {
    it('应该在合理时间内渲染', async () => {
      const start = performance.now()
      
      wrapper = helper.mount()
      await flushPromises()
      
      const renderTime = performance.now() - start
      expect(renderTime).toBeLessThan(100) // 小于100ms
    })
  })

  describe('样式测试', () => {
    it('应该有正确的默认样式类', () => {
      wrapper = helper.mount()

      expect(wrapper.classes()).toContain('loading-state')
    })

    it('应该根据属性应用不同的样式类', () => {
      wrapper = helper.mount({
        variant: 'overlay',
        size: 'small',
        color: 'secondary'
      })

      expect(wrapper.classes()).toContain('loading-state--overlay')
      expect(wrapper.classes()).toContain('loading-state--small')
      expect(wrapper.classes()).toContain('loading-state--secondary')
    })
  })

  describe('交互测试', () => {
    it('应该支持键盘导航', () => {
      wrapper = helper.mount()

      // 加载状态组件应该可以接收焦点
      const loadingElement = wrapper.find('.loading-state')
      expect(loadingElement.attributes('tabindex')).toBeDefined()
    })
  })
})