import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { globalErrorHandler } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import { useNotifications } from './useNotifications'

/**
 * 错误监控和恢复系统
 */
export function useErrorMonitoring() {
  const { notifyError, notifyInfo } = useNotifications()
  
  // 监控状态
  const monitoring = reactive({
    isEnabled: true,
    healthCheckInterval: 30000, // 30秒
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000
    }
  })
  
  // 错误统计
  const errorStats = reactive({
    total: 0,
    byType: {},
    bySeverity: {},
    recent: [],
    lastError: null,
    uptime: Date.now()
  })
  
  // 恢复策略
  const recoveryStrategies = reactive(new Map())
  
  // 健康检查定时器
  let healthCheckTimer = null
  let performanceMonitor = null
  
  /**
   * 注册错误类型处理器
   */
  const registerErrorType = (errorType, strategy) => {
    recoveryStrategies.set(errorType, strategy)
  }
  
  /**
   * 发送健康检查
   */
  const performHealthCheck = async () => {
    try {
      // 检查网络连接
      const isOnline = navigator.onLine
      if (!isOnline) {
        logger.warn('Health check: Network offline')
        return false
      }
      
      // 检查关键API
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        logger.warn('Health check: API unavailable', { status: response.status })
        return false
      }
      
      return true
    } catch (error) {
      logger.error('Health check failed', error)
      return false
    }
  }
  
  /**
   * 自动错误恢复
   */
  const attemptRecovery = async (errorInfo) => {
    const strategy = recoveryStrategies.get(errorInfo.type)
    
    if (!strategy) {
      logger.debug('No recovery strategy found', { errorType: errorInfo.type })
      return false
    }
    
    try {
      logger.info('Attempting recovery', { 
        errorType: errorInfo.type, 
        strategy: strategy.name 
      })
      
      const result = await strategy.recover(errorInfo)
      
      if (result.success) {
        logger.info('Recovery successful', { 
          errorType: errorInfo.type,
          details: result.details
        })
        
        notifyInfo('系统已自动恢复正常', {
          title: '系统恢复',
          duration: 3000
        })
        
        return true
      } else {
        logger.warn('Recovery failed', { 
          errorType: errorInfo.type,
          reason: result.reason
        })
        
        return false
      }
    } catch (recoveryError) {
      logger.error('Recovery error', recoveryError)
      return false
    }
  }
  
  /**
   * 统计错误
   */
  const trackError = (errorInfo) => {
    errorStats.total++
    errorStats.lastError = errorInfo
    
    // 按类型统计
    errorStats.byType[errorInfo.type] = (errorStats.byType[errorInfo.type] || 0) + 1
    
    // 按严重程度统计
    errorStats.bySeverity[errorInfo.severity] = (errorStats.bySeverity[errorInfo.severity] || 0) + 1
    
    // 最近错误记录
    errorStats.recent.unshift({
      ...errorInfo,
      timestamp: new Date().toISOString()
    })
    
    // 只保留最近50个错误
    if (errorStats.recent.length > 50) {
      errorStats.recent = errorStats.recent.slice(0, 50)
    }
    
    // 检查是否需要告警
    checkErrorThreshold(errorInfo)
  }
  
  /**
   * 检查错误阈值
   */
  const checkErrorThreshold = (errorInfo) => {
    const errorCount = errorStats.total
    const timeWindow = 60000 // 1分钟
    const recentErrors = errorStats.recent.filter(error => 
      Date.now() - new Date(error.timestamp).getTime() < timeWindow
    )
    
    if (recentErrors.length >= 10) {
      logger.error('High error rate detected', { 
        errorCount: recentErrors.length,
        timeWindow: '1 minute'
      })
      
      notifyError('系统错误率过高，请检查网络连接或联系技术支持', {
        title: '系统告警',
        duration: 0
      })
    }
  }
  
  /**
   * 指数退避重试
   */
  const exponentialBackoffRetry = async (fn, options = {}) => {
    const {
      maxAttempts = monitoring.retryConfig.maxAttempts,
      baseDelay = monitoring.retryConfig.baseDelay,
      maxDelay = monitoring.retryConfig.maxDelay
    } = options
    
    let lastError
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn()
        logger.info('Retry successful', { attempt })
        return result
      } catch (error) {
        lastError = error
        
        if (attempt === maxAttempts) {
          logger.error('Max retry attempts reached', { 
            maxAttempts, 
            finalError: error.message 
          })
          break
        }
        
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
        logger.warn('Retry attempt', { 
          attempt, 
          maxAttempts, 
          delay,
          error: error.message 
        })
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }
  
  /**
   * 熔断器模式
   */
  const createCircuitBreaker = (key, options = {}) => {
    const config = {
      failureThreshold: options.failureThreshold || 5,
      timeout: options.timeout || 60000, // 1分钟
      ...options
    }
    
    const state = {
      status: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failures: 0,
      lastFailureTime: null,
      nextRetryTime: null
    }
    
    return {
      async execute(fn) {
        const now = Date.now()
        
        // 检查熔断器状态
        if (state.status === 'OPEN') {
          if (now >= state.nextRetryTime) {
            state.status = 'HALF_OPEN'
            logger.info('Circuit breaker half-open', { key })
          } else {
            throw new Error('Circuit breaker is OPEN')
          }
        }
        
        try {
          const result = await fn()
          
          // 成功时重置熔断器
          if (state.status === 'HALF_OPEN') {
            state.status = 'CLOSED'
            state.failures = 0
            logger.info('Circuit breaker closed', { key })
          }
          
          return result
        } catch (error) {
          state.failures++
          state.lastFailureTime = now
          
          if (state.failures >= config.failureThreshold) {
            state.status = 'OPEN'
            state.nextRetryTime = now + config.timeout
            logger.warn('Circuit breaker opened', { 
              key, 
              failures: state.failures 
            })
          }
          
          throw error
        }
      },
      
      getState() {
        return { ...state }
      }
    }
  }
  
  /**
   * 错误恢复钩子
   */
  const createErrorRecoveryHook = (context = {}) => {
    const recoveryId = Date.now()
    const startTime = Date.now()
    
    return {
      async recover(errorInfo) {
        logger.info('Starting recovery process', { 
          recoveryId, 
          context, 
          errorType: errorInfo.type 
        })
        
        // 检查是否达到最大恢复时间
        const maxRecoveryTime = context.maxRecoveryTime || 30000 // 30秒
        const elapsed = Date.now() - startTime
        
        if (elapsed > maxRecoveryTime) {
          logger.warn('Recovery timeout', { recoveryId, elapsed })
          return { success: false, reason: 'Recovery timeout' }
        }
        
        // 根据错误类型选择恢复策略
        const strategy = recoveryStrategies.get(errorInfo.type)
        
        if (strategy) {
          return await strategy.recover(errorInfo, context)
        }
        
        // 通用恢复策略
        return await performGenericRecovery(errorInfo, context)
      }
    }
  }
  
  /**
   * 通用恢复策略
   */
  const performGenericRecovery = async (errorInfo, context) => {
    try {
      // 重试操作
      if (context.retryable && context.retryFn) {
        await exponentialBackoffRetry(context.retryFn)
        return { success: true, method: 'retry' }
      }
      
      // 清理缓存
      if (errorInfo.type === 'NETWORK_ERROR') {
        await clearStaleCache()
        return { success: true, method: 'cache_cleanup' }
      }
      
      // 重新认证
      if (errorInfo.type === 'AUTHORIZATION_ERROR') {
        await reAuthenticate()
        return { success: true, method: 'reauth' }
      }
      
      // 页面刷新
      if (errorInfo.severity === 'CRITICAL') {
        setTimeout(() => {
          window.location.reload()
        }, 2000)
        return { success: true, method: 'page_reload' }
      }
      
      return { success: false, reason: 'No suitable recovery strategy' }
    } catch (recoveryError) {
      logger.error('Generic recovery failed', recoveryError)
      return { success: false, reason: recoveryError.message }
    }
  }
  
  /**
   * 清理缓存
   */
  const clearStaleCache = async () => {
    try {
      // 清理localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key.startsWith('app_cache_')) {
          const item = localStorage.getItem(key)
          if (item) {
            const data = JSON.parse(item)
            if (Date.now() - data.timestamp > 3600000) { // 1小时
              keysToRemove.push(key)
            }
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      logger.info('Cache cleanup completed', { removedKeys: keysToRemove.length })
    } catch (error) {
      logger.error('Cache cleanup failed', error)
    }
  }
  
  /**
   * 重新认证
   */
  const reAuthenticate = async () => {
    try {
      // 触发重新登录
      document.dispatchEvent(new CustomEvent('app:reauthenticate'))
      logger.info('Re-authentication triggered')
    } catch (error) {
      logger.error('Re-authentication failed', error)
      throw error
    }
  }
  
  /**
   * 开始监控
   */
  const startMonitoring = () => {
    if (monitoring.isEnabled) {
      healthCheckTimer = setInterval(() => {
        performHealthCheck()
      }, monitoring.healthCheckInterval)
      
      logger.info('Error monitoring started')
    }
  }
  
  /**
   * 停止监控
   */
  const stopMonitoring = () => {
    if (healthCheckTimer) {
      clearInterval(healthCheckTimer)
      healthCheckTimer = null
    }
    
    logger.info('Error monitoring stopped')
  }
  
  /**
   * 获取错误统计
   */
  const getErrorStats = () => ({
    total: errorStats.total,
    byType: { ...errorStats.byType },
    bySeverity: { ...errorStats.bySeverity },
    recent: [...errorStats.recent],
    lastError: errorStats.lastError,
    uptime: Date.now() - errorStats.uptime
  })
  
  /**
   * 重置统计
   */
  const resetStats = () => {
    errorStats.total = 0
    errorStats.byType = {}
    errorStats.bySeverity = {}
    errorStats.recent = []
    errorStats.lastError = null
    errorStats.uptime = Date.now()
    
    logger.info('Error statistics reset')
  }
  
  // 生命周期
  onMounted(() => {
    // 注册默认错误恢复策略
    registerDefaultRecoveryStrategies()
    
    // 开始监控
    startMonitoring()
    
    // 监听全局错误
    document.addEventListener('app:error', (event) => {
      trackError(event.detail.error)
      attemptRecovery(event.detail.error)
    })
  })
  
  onUnmounted(() => {
    stopMonitoring()
  })
  
  return {
    monitoring,
    errorStats,
    recoveryStrategies,
    registerErrorType,
    attemptRecovery,
    exponentialBackoffRetry,
    createCircuitBreaker,
    createErrorRecoveryHook,
    performHealthCheck,
    getErrorStats,
    resetStats,
    startMonitoring,
    stopMonitoring
  }
}

/**
 * 注册默认恢复策略
 */
function registerDefaultRecoveryStrategies() {
  const { registerErrorType } = useErrorMonitoring()
  
  // 网络错误恢复策略
  registerErrorType('NETWORK_ERROR', {
    name: 'Network Recovery',
    recover: async (errorInfo) => {
      // 检查网络状态
      if (!navigator.onLine) {
        return { success: false, reason: 'Network offline' }
      }
      
      // 等待网络恢复
      await new Promise(resolve => {
        const checkOnline = () => {
          if (navigator.onLine) {
            window.removeEventListener('online', checkOnline)
            resolve()
          }
        }
        window.addEventListener('online', checkOnline)
        
        // 超时处理
        setTimeout(resolve, 30000) // 30秒超时
      })
      
      return { success: true, method: 'network_recovery' }
    }
  })
  
  // 服务器错误恢复策略
  registerErrorType('SERVER_ERROR', {
    name: 'Server Error Recovery',
    recover: async (errorInfo) => {
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 5000))
      return { success: true, method: 'server_retry' }
    }
  })
  
  // 授权错误恢复策略
  registerErrorType('AUTHORIZATION_ERROR', {
    name: 'Authorization Recovery',
    recover: async (errorInfo) => {
      // 触发重新登录
      document.dispatchEvent(new CustomEvent('app:reauthenticate'))
      return { success: true, method: 'reauth' }
    }
  })
}