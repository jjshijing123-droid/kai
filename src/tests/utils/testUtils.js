/**
 * 测试工具函数
 * 提供测试辅助函数和模拟数据生成器
 */

/**
 * 创建模拟数据
 * @param {Object} options - 配置选项
 * @returns {Object} 模拟数据对象
 */
export const createMockData = (options = {}) => {
  const defaults = {
    count: 5,
    type: 'product',
    withImages: true,
    withMetadata: true
  }
  
  const config = { ...defaults, ...options }
  const mockData = []
  
  for (let i = 0; i < config.count; i++) {
    const item = {
      id: `mock-${config.type}-${i + 1}`,
      name: `${config.type} ${i + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    if (config.type === 'product') {
      item.description = `Product ${i + 1} description`
      item.category = ['electronics', 'clothing', 'books'][i % 3]
      item.price = (Math.random() * 100 + 10).toFixed(2)
      item.status = ['active', 'inactive', 'pending'][i % 3]
      
      if (config.withImages) {
        item.images = [
          `/images/product-${i + 1}-1.jpg`,
          `/images/product-${i + 1}-2.jpg`
        ]
      }
    }
    
    if (config.withMetadata) {
      item.metadata = {
        author: 'Test User',
        version: '1.0.0',
        tags: ['test', 'mock', `tag-${i}`]
      }
    }
    
    mockData.push(item)
  }
  
  return config.count === 1 ? mockData[0] : mockData
}

/**
 * 组件测试辅助类
 */
export class ComponentTestHelper {
  /**
   * 创建Vue组件挂载选项
   * @param {Object} options - 组件选项
   * @returns {Object} 挂载选项
   */
  static createMountOptions(options = {}) {
    return {
      global: {
        stubs: {
          RouterLink: true,
          RouterView: true
        }
      },
      ...options
    }
  }
  
  /**
   * 等待下一个tick
   * @returns {Promise} Promise对象
   */
  static async nextTick() {
    await new Promise(resolve => {
      setTimeout(resolve, 0)
    })
  }
  
  /**
   * 模拟异步操作
   * @param {number} delay - 延迟时间（毫秒）
   * @returns {Promise} Promise对象
   */
  static async mockAsync(delay = 100) {
    return new Promise(resolve => {
      setTimeout(resolve, delay)
    })
  }
  
  /**
   * 创建模拟事件
   * @param {string} eventName - 事件名称
   * @param {Object} data - 事件数据
   * @returns {Event} 模拟事件
   */
  static createMockEvent(eventName, data = {}) {
    const event = new Event(eventName)
    Object.assign(event, data)
    return event
  }
  
  /**
   * 检查组件是否包含特定文本
   * @param {Object} wrapper - Vue Test Utils包装器
   * @param {string} text - 要检查的文本
   * @returns {boolean} 是否包含文本
   */
  static hasText(wrapper, text) {
    return wrapper.html().includes(text)
  }
  
  /**
   * 检查组件是否包含特定的类名
   * @param {Object} wrapper - Vue Test Utils包装器
   * @param {string} className - 要检查的类名
   * @returns {boolean} 是否包含类名
   */
  static hasClass(wrapper, className) {
    return wrapper.classes().includes(className)
  }
}

/**
 * 创建用户交互模拟器
 */
export class UserInteractionSimulator {
  /**
   * 模拟点击事件
   * @param {Object} element - DOM元素
   */
  static simulateClick(element) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    })
    element.dispatchEvent(event)
  }
  
  /**
   * 模拟输入事件
   * @param {Object} element - DOM元素
   * @param {string} value - 输入值
   */
  static simulateInput(element, value) {
    const event = new Event('input', { bubbles: true })
    element.value = value
    element.dispatchEvent(event)
  }
  
  /**
   * 模拟键盘事件
   * @param {Object} element - DOM元素
   * @param {string} key - 按键
   */
  static simulateKeyPress(element, key) {
    const event = new KeyboardEvent('keydown', {
      key: key,
      bubbles: true
    })
    element.dispatchEvent(event)
  }
}

/**
 * 等待DOM更新
 * @param {Object} wrapper - Vue Test Utils包装器
 * @returns {Promise} Promise对象
 */
export const waitForUpdate = async (wrapper) => {
  await wrapper.vm.$nextTick()
  await new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * 创建模拟路由
 * @param {Object} routes - 路由配置
 * @returns {Object} 模拟路由对象
 */
export const createMockRouter = (routes = []) => {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    currentRoute: {
      value: {
        path: '/',
        params: {},
        query: {}
      }
    }
  }
}

/**
 * 创建模拟存储
 * @param {Object} state - 初始状态
 * @returns {Object} 模拟存储对象
 */
export const createMockStore = (state = {}) => {
  return {
    state: { ...state },
    commit: jest.fn(),
    dispatch: jest.fn(),
    getters: {}
  }
}
