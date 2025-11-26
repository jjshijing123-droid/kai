import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 通知管理 Store
 */
export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  let notificationId = 0

  /**
   * 添加通知
   */
  const add = (notification) => {
    const id = ++notificationId
    const newNotification = {
      id,
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      duration: notification.duration || 5000, // 默认5秒
      startTime: Date.now(),
      actions: notification.actions || [],
      onClick: notification.onClick,
      ...notification
    }

    notifications.value.push(newNotification)

    // 如果设置了duration，自动移除
    if (newNotification.duration > 0) {
      setTimeout(() => {
        remove(id)
      }, newNotification.duration)
    }

    return id
  }

  /**
   * 移除通知
   */
  const remove = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * 清除所有通知
   */
  const clear = () => {
    notifications.value = []
  }

  /**
   * 批量移除通知
   */
  const removeByType = (type) => {
    notifications.value = notifications.value.filter(n => n.type !== type)
  }

  return {
    notifications,
    add,
    remove,
    clear,
    removeByType
  }
})

/**
 * 便捷的通知类型方法
 */
export const createNotificationMethods = (store) => ({
  success: (message, options = {}) => {
    return store.add({
      type: 'success',
      title: options.title || '操作成功',
      message,
      ...options
    })
  },

  error: (message, options = {}) => {
    return store.add({
      type: 'error',
      title: options.title || '操作失败',
      message,
      duration: options.duration || 8000, // 错误消息显示更久
      ...options
    })
  },

  warning: (message, options = {}) => {
    return store.add({
      type: 'warning',
      title: options.title || '注意事项',
      message,
      ...options
    })
  },

  info: (message, options = {}) => {
    return store.add({
      type: 'info',
      title: options.title || '提示',
      message,
      ...options
    })
  },

  loading: (message, options = {}) => {
    return store.add({
      type: 'info',
      title: options.title || '加载中',
      message,
      duration: 0, // 手动关闭
      ...options
    })
  }
})

/**
 * 通知配置预设
 */
export const NotificationPresets = {
  // 操作确认
  confirm: {
    duration: 0,
    actions: [
      {
        label: '确认',
        type: 'primary',
        handler: () => {}
      },
      {
        label: '取消',
        type: 'default',
        handler: () => {}
      }
    ]
  },

  // 网络错误
  networkError: {
    type: 'error',
    title: '网络错误',
    duration: 0,
    actions: [
      {
        label: '重试',
        type: 'primary',
        handler: () => {}
      },
      {
        label: '关闭',
        type: 'default',
        handler: () => {}
      }
    ]
  },

  // 保存成功
  saveSuccess: {
    type: 'success',
    title: '保存成功',
    duration: 3000
  },

  // 删除确认
  deleteConfirm: {
    type: 'warning',
    title: '确认删除',
    duration: 0,
    actions: [
      {
        label: '删除',
        type: 'primary',
        handler: () => {}
      },
      {
        label: '取消',
        type: 'default',
        handler: () => {}
      }
    ]
  }
}