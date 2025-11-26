import { useNotificationStore, createNotificationMethods } from '../stores/notificationStore'
import { useI18n } from './useI18n'

/**
 * 通知系统 Hook
 */
export function useNotifications() {
  const store = useNotificationStore()
  const { t } = useI18n()
  
  // 创建便捷方法
  const methods = createNotificationMethods(store)

  /**
   * 成功通知
   */
  const notifySuccess = (message, options = {}) => {
    return methods.success(message, {
      ...options,
      title: options.title || t('notification.success')
    })
  }

  /**
   * 错误通知
   */
  const notifyError = (message, options = {}) => {
    return methods.error(message, {
      ...options,
      title: options.title || t('notification.error')
    })
  }

  /**
   * 警告通知
   */
  const notifyWarning = (message, options = {}) => {
    return methods.warning(message, {
      ...options,
      title: options.title || t('notification.warning')
    })
  }

  /**
   * 信息通知
   */
  const notifyInfo = (message, options = {}) => {
    return methods.info(message, {
      ...options,
      title: options.title || t('notification.info')
    })
  }

  /**
   * 加载通知
   */
  const notifyLoading = (message, options = {}) => {
    return methods.loading(message, {
      ...options,
      title: options.title || t('notification.loading')
    })
  }

  /**
   * 持久化通知（不自动关闭）
   */
  const notifyPersistent = (type, message, options = {}) => {
    return store.add({
      type,
      message,
      duration: 0,
      ...options
    })
  }

  /**
   * 操作确认通知
   */
  const notifyConfirm = (message, onConfirm, onCancel = null, options = {}) => {
    const confirmId = store.add({
      type: 'warning',
      title: options.title || t('notification.confirm'),
      message,
      duration: 0,
      actions: [
        {
          label: options.confirmText || t('common.confirm'),
          type: 'primary',
          handler: () => {
            if (onConfirm) onConfirm()
            store.remove(confirmId)
          }
        },
        {
          label: options.cancelText || t('common.cancel'),
          type: 'default',
          handler: () => {
            if (onCancel) onCancel()
            store.remove(confirmId)
          }
        }
      ]
    })
    
    return confirmId
  }

  /**
   * 网络错误通知
   */
  const notifyNetworkError = (retryFn = null, options = {}) => {
    const networkId = store.add({
      type: 'error',
      title: options.title || t('notification.networkError'),
      message: options.message || t('notification.networkErrorMessage'),
      duration: 0,
      actions: [
        {
          label: options.retryText || t('common.retry'),
          type: 'primary',
          handler: () => {
            if (retryFn) retryFn()
            store.remove(networkId)
          }
        },
        {
          label: options.closeText || t('common.close'),
          type: 'default',
          handler: () => {
            store.remove(networkId)
          }
        }
      ]
    })
    
    return networkId
  }

  /**
   * 保存成功通知
   */
  const notifySaveSuccess = (message = null, options = {}) => {
    return methods.success(message || t('notification.saveSuccess'), {
      duration: 3000,
      ...options
    })
  }

  /**
   * 删除确认通知
   */
  const notifyDeleteConfirm = (message, onDelete, onCancel = null, options = {}) => {
    const deleteId = store.add({
      type: 'warning',
      title: options.title || t('notification.deleteConfirm'),
      message,
      duration: 0,
      actions: [
        {
          label: options.deleteText || t('common.delete'),
          type: 'primary',
          handler: () => {
            if (onDelete) onDelete()
            store.remove(deleteId)
          }
        },
        {
          label: options.cancelText || t('common.cancel'),
          type: 'default',
          handler: () => {
            if (onCancel) onCancel()
            store.remove(deleteId)
          }
        }
      ]
    })
    
    return deleteId
  }

  /**
   * API错误处理包装器
   */
  const wrapApiCall = async (apiCall, options = {}) => {
    const loadingId = options.loadingMessage ? 
      notifyLoading(options.loadingMessage) : null

    try {
      const result = await apiCall()
      
      if (loadingId) {
        store.remove(loadingId)
      }
      
      if (options.successMessage) {
        notifySuccess(options.successMessage)
      }
      
      return result
    } catch (error) {
      if (loadingId) {
        store.remove(loadingId)
      }
      
      if (options.errorMessage) {
        notifyError(options.errorMessage)
      } else {
        notifyError(error.message || t('notification.operationFailed'))
      }
      
      throw error
    }
  }

  /**
   * 批量操作通知
   */
  const notifyBatchOperation = (operation, total, success, failed, options = {}) => {
    const message = options.message || t('notification.batchOperation', {
      operation,
      success,
      failed,
      total
    })

    if (failed === 0) {
      notifySuccess(message)
    } else if (success === 0) {
      notifyError(message)
    } else {
      notifyWarning(message, {
        duration: 8000,
        actions: options.showRetry ? [
          {
            label: t('common.retry'),
            type: 'primary',
            handler: options.onRetry
          },
          {
            label: t('common.close'),
            type: 'default',
            handler: () => {}
          }
        ] : undefined
      })
    }
  }

  /**
   * 进度通知
   */
  const notifyProgress = (message, progress, options = {}) => {
    const progressId = store.add({
      type: 'info',
      title: options.title || t('notification.inProgress'),
      message: `${message} (${Math.round(progress)}%)`,
      duration: 0,
      ...options
    })

    // 更新进度的方法
    const updateProgress = (newProgress, newMessage = null) => {
      const notification = store.notifications.find(n => n.id === progressId)
      if (notification) {
        notification.message = newMessage || `${message} (${Math.round(newProgress)}%)`
        notification.startTime = Date.now() // 重置时间以防止自动关闭
      }
    }

    // 完成的方法
    const complete = (successMessage = null) => {
      if (successMessage) {
        notifySuccess(successMessage)
      }
      store.remove(progressId)
    }

    // 失败的方法
    const fail = (errorMessage = null) => {
      if (errorMessage) {
        notifyError(errorMessage)
      }
      store.remove(progressId)
    }

    return {
      id: progressId,
      updateProgress,
      complete,
      fail
    }
  }

  return {
    // 基础方法
    add: store.add,
    remove: store.remove,
    clear: store.clear,
    removeByType: store.removeByType,
    
    // 便捷方法
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyLoading,
    notifyPersistent,
    
    // 高级方法
    notifyConfirm,
    notifyNetworkError,
    notifySaveSuccess,
    notifyDeleteConfirm,
    notifyBatchOperation,
    notifyProgress,
    
    // 工具方法
    wrapApiCall,
    
    // 状态
    notifications: store.notifications
  }
}