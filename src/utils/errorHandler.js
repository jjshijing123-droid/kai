/**
 * 全局错误处理系统
 */

import { createErrorHandler } from './errorHandler'
import { createLogger } from './logger'

// 创建全局实例
const errorHandler = createErrorHandler()
const logger = createLogger('GlobalErrorHandler')

/**
 * 错误类型枚举
 */
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  CLIENT_ERROR: 'CLIENT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

/**
 * 错误严重级别
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

/**
 * 创建错误对象
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN_ERROR, severity = ErrorSeverity.MEDIUM, details = {}) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.severity = severity
    this.details = details
    this.timestamp = new Date().toISOString()
    this.id = this.generateErrorId()
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
}

/**
 * 网络错误
 */
export class NetworkError extends AppError {
  constructor(message = 'Network connection failed', details = {}) {
    super(message, ErrorTypes.NETWORK_ERROR, ErrorSeverity.MEDIUM, details)
    this.name = 'NetworkError'
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', field = null, details = {}) {
    super(message, ErrorTypes.VALIDATION_ERROR, ErrorSeverity.LOW, { field, ...details })
    this.name = 'ValidationError'
  }
}

/**
 * 授权错误
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', details = {}) {
    super(message, ErrorTypes.AUTHORIZATION_ERROR, ErrorSeverity.HIGH, details)
    this.name = 'AuthorizationError'
  }
}

/**
 * 资源未找到错误
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', resource = null, details = {}) {
    super(message, ErrorTypes.NOT_FOUND_ERROR, ErrorSeverity.MEDIUM, { resource, ...details })
    this.name = 'NotFoundError'
  }
}

/**
 * 服务器错误
 */
export class ServerError extends AppError {
  constructor(message = 'Server error occurred', status = 500, details = {}) {
    super(message, ErrorTypes.SERVER_ERROR, status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM, { 
      status, 
      ...details 
    })
    this.name = 'ServerError'
  }
}

/**
 * 客户端错误
 */
export class ClientError extends AppError {
  constructor(message = 'Client error occurred', details = {}) {
    super(message, ErrorTypes.CLIENT_ERROR, ErrorSeverity.MEDIUM, details)
    this.name = 'ClientError'
  }
}

/**
 * 错误处理器工厂函数
 */
export function createErrorHandler(options = {}) {
  const config = {
    enableNotifications: options.enableNotifications !== false,
    enableLogging: options.enableLogging !== false,
    enableReporting: options.enableReporting || false,
    maxRetries: options.maxRetries || 3,
    retryDelay: options.retryDelay || 1000,
    ...options
  }

  /**
   * 处理错误的核心方法
   */
  const handle = async (error, context = {}) => {
    const errorInfo = normalizeError(error, context)
    
    // 记录错误
    if (config.enableLogging) {
      logger.error('Error occurred', {
        error: errorInfo,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      })
    }

    // 发送错误报告
    if (config.enableReporting) {
      try {
        await reportError(errorInfo)
      } catch (reportError) {
        logger.error('Failed to report error', { reportError })
      }
    }

    // 显示用户通知
    if (config.enableNotifications && errorInfo.severity !== ErrorSeverity.LOW) {
      showUserNotification(errorInfo)
    }

    // 执行错误回调
    if (context.onError) {
      try {
        await context.onError(errorInfo)
      } catch (callbackError) {
        logger.error('Error in error callback', { callbackError })
      }
    }

    return errorInfo
  }

  /**
   * 规范化错误信息
   */
  const normalizeError = (error, context) => {
    if (error instanceof AppError) {
      return error.toJSON()
    }

    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      const networkError = new NetworkError(error.message, { originalError: error })
      return networkError.toJSON()
    }

    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      const authError = new AuthorizationError(error.message || 'Authentication failed', { originalError: error })
      return authError.toJSON()
    }

    if (error.status === 404 || error.code === 'NOT_FOUND') {
      const notFoundError = new NotFoundError(error.message || 'Resource not found', context.resource, { originalError: error })
      return notFoundError.toJSON()
    }

    if (error.status >= 500) {
      const serverError = new ServerError(error.message || 'Server error', error.status, { originalError: error })
      return serverError.toJSON()
    }

    if (error.status >= 400) {
      const clientError = new ClientError(error.message || 'Client error', { status: error.status, originalError: error })
      return clientError.toJSON()
    }

    // 默认未知错误
    const unknownError = new AppError(
      error.message || 'An unknown error occurred',
      ErrorTypes.UNKNOWN_ERROR,
      ErrorSeverity.MEDIUM,
      { originalError: error }
    )
    return unknownError.toJSON()
  }

  /**
   * 显示用户通知
   */
  const showUserNotification = (errorInfo) => {
    try {
      // 尝试获取通知系统
      const event = new CustomEvent('app:error', {
        detail: {
          error: errorInfo,
          message: getUserFriendlyMessage(errorInfo),
          type: errorInfo.type,
          severity: errorInfo.severity
        }
      })
      
      document.dispatchEvent(event)
    } catch (notificationError) {
      console.error('Failed to show error notification:', notificationError)
    }
  }

  /**
   * 获取用户友好的错误消息
   */
  const getUserFriendlyMessage = (errorInfo) => {
    const messages = {
      [ErrorTypes.NETWORK_ERROR]: '网络连接出现问题，请检查网络设置',
      [ErrorTypes.VALIDATION_ERROR]: '输入信息有误，请检查后重试',
      [ErrorTypes.AUTHORIZATION_ERROR]: '权限不足，无法执行此操作',
      [ErrorTypes.NOT_FOUND_ERROR]: '请求的资源不存在',
      [ErrorTypes.SERVER_ERROR]: '服务器暂时不可用，请稍后重试',
      [ErrorTypes.CLIENT_ERROR]: '操作失败，请重试',
      [ErrorTypes.UNKNOWN_ERROR]: '发生了未知错误，请重试或联系技术支持'
    }

    return messages[errorInfo.type] || errorInfo.message || '发生了错误'
  }

  /**
   * 上报错误到远程服务
   */
  const reportError = async (errorInfo) => {
    if (!config.enableReporting) return

    try {
      await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: errorInfo,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      })
    } catch (fetchError) {
      logger.error('Failed to report error to server', { fetchError })
    }
  }

  /**
   * 异步错误包装器
   */
  const wrapAsync = (fn, context = {}) => {
    return async (...args) => {
      try {
        return await fn(...args)
      } catch (error) {
        await handle(error, { ...context, args })
        throw error
      }
    }
  }

  /**
   * Promise错误处理器
   */
  const handlePromise = (promise, context = {}) => {
    return promise.catch(error => {
      handle(error, context)
      throw error
    })
  }

  /**
   * 重试机制
   */
  const retry = async (fn, options = {}) => {
    const {
      maxAttempts = config.maxRetries,
      delay = config.retryDelay,
      backoff = false
    } = options

    let lastError

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        await handle(error, { attempt, maxAttempts })

        if (attempt === maxAttempts) {
          break
        }

        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    throw lastError
  }

  /**
   * 设置全局错误处理器
   */
  const setupGlobalHandlers = () => {
    // 未捕获的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      handle(event.reason, { type: 'unhandledrejection' })
    })

    // JavaScript错误
    window.addEventListener('error', (event) => {
      handle(new Error(event.message), {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    // Vue错误处理（如果在Vue环境中）
    if (typeof window !== 'undefined' && window.Vue) {
      window.Vue.config.errorHandler = (error, instance, info) => {
        handle(error, { type: 'vue', instance, info })
      }
    }
  }

  return {
    handle,
    wrapAsync,
    handlePromise,
    retry,
    setupGlobalHandlers,
    normalizeError
  }
}

/**
 * 创建全局实例
 */
export const globalErrorHandler = createErrorHandler()

/**
 * Vue错误处理插件
 */
export const ErrorHandlerPlugin = {
  install(app, options = {}) {
    const errorHandler = createErrorHandler(options)
    
    // 设置全局错误处理器
    errorHandler.setupGlobalHandlers()
    
    // 提供全局方法
    app.config.globalProperties.$handleError = errorHandler.handle
    app.config.globalProperties.$wrapAsync = errorHandler.wrapAsync
    app.config.globalProperties.$retry = errorHandler.retry
    
    // 提供注入
    app.provide('errorHandler', errorHandler)
    app.provide('logger', logger)
  }
}

export default {
  createErrorHandler,
  globalErrorHandler,
  ErrorHandlerPlugin,
  AppError,
  NetworkError,
  ValidationError,
  AuthorizationError,
  NotFoundError,
  ServerError,
  ClientError,
  ErrorTypes,
  ErrorSeverity
}