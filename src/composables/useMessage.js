import { createApp } from 'vue'
import Message from '../components/ui/Message.vue'

// 消息队列，用于处理多个消息的显示位置
const messageQueue = []
const MESSAGE_HEIGHT = 60 // 每条消息的高度
const MESSAGE_GAP = 12 // 消息之间的间距

/**
 * 显示消息通知
 * @param {Object|string} options - 消息配置或消息文本
 * @param {string} [options.message] - 消息文本
 * @param {string} [options.type] - 消息类型：info, success, error, warning
 * @param {number} [options.duration] - 显示时长（毫秒）
 * @param {boolean} [options.showClose] - 是否显示关闭按钮
 * @returns {Object} - 消息实例，包含close方法
 */
export const useMessage = () => {
  const showMessage = (options) => {
    // 处理字符串参数
    if (typeof options === 'string') {
      options = { message: options }
    }
    
    const {
      message,
      type = 'info',
      duration = 3000,
      showClose = true
    } = options
    
    // 创建消息容器
    const container = document.createElement('div')
    document.body.appendChild(container)
    
    // 计算消息的top值
    const top = messageQueue.length * (MESSAGE_HEIGHT + MESSAGE_GAP) + 20
    
    // 创建Vue应用实例
    const app = createApp(Message, {
      message,
      type,
      duration,
      showClose,
      top
    })
    
    // 挂载组件
    const instance = app.mount(container)
    
    // 添加到消息队列
    messageQueue.push(instance)
    
    // 监听消息关闭事件
    const handleClose = () => {
      // 从队列中移除
      const index = messageQueue.indexOf(instance)
      if (index > -1) {
        messageQueue.splice(index, 1)
        // 更新后续消息的位置
        updateMessagePositions()
      }
      // 销毁组件
      app.unmount()
      document.body.removeChild(container)
    }
    
    // 监听组件的close事件 - 使用自定义事件监听
    const originalEmit = instance.emit
    instance.emit = (...args) => {
      if (args[0] === 'close') {
        handleClose()
      }
      originalEmit(...args)
    }
    
    // 返回消息实例，包含close方法
    return {
      close: () => {
        instance.close()
      }
    }
  }
  
  /**
   * 更新所有消息的位置
   */
  const updateMessagePositions = () => {
    messageQueue.forEach((instance, index) => {
      instance.top = index * (MESSAGE_HEIGHT + MESSAGE_GAP) + 20
    })
  }
  
  // 返回各种类型的消息方法
  return {
    info: (message, options = {}) => showMessage({ message, type: 'info', ...options }),
    success: (message, options = {}) => showMessage({ message, type: 'success', ...options }),
    error: (message, options = {}) => showMessage({ message, type: 'error', ...options }),
    warning: (message, options = {}) => showMessage({ message, type: 'warning', ...options }),
    show: showMessage
  }
}

// 导出全局消息实例，方便直接调用
export const message = useMessage()