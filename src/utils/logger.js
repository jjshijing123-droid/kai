/**
 * 日志系统
 */

/**
 * 日志级别枚举
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
}

/**
 * 日志输出目标
 */
export const LogTarget = {
  CONSOLE: 'console',
  FILE: 'file',
  SERVER: 'server',
  LOCAL_STORAGE: 'localStorage',
  INDEXED_DB: 'indexedDB'
}

/**
 * 日志记录器类
 */
export class Logger {
  constructor(name, options = {}) {
    this.name = name
    this.options = {
      level: options.level || LogLevel.INFO,
      enabled: options.enabled !== false,
      targets: options.targets || [LogTarget.CONSOLE],
      format: options.format || 'json',
      maxEntries: options.maxEntries || 1000,
      flushInterval: options.flushInterval || 5000,
      enableColors: options.enableColors !== false,
      ...options
    }
    
    this.entries = []
    this.flushTimer = null
    this.setupTargets()
    this.startFlushTimer()
  }

  /**
   * 设置日志输出目标
   */
  setupTargets() {
    this.targetHandlers = {}
    
    this.options.targets.forEach(target => {
      switch (target) {
        case LogTarget.CONSOLE:
          this.targetHandlers[target] = this.handleConsoleLog.bind(this)
          break
        case LogTarget.LOCAL_STORAGE:
          this.targetHandlers[target] = this.handleLocalStorageLog.bind(this)
          break
        case LogTarget.SERVER:
          this.targetHandlers[target] = this.handleServerLog.bind(this)
          break
      }
    })
  }

  /**
   * 检查日志级别
   */
  shouldLog(level) {
    return this.options.enabled && level >= this.options.level
  }

  /**
   * 创建日志条目
   */
  createEntry(level, message, data = {}, meta = {}) {
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      levelName: this.getLevelName(level),
      logger: this.name,
      message,
      data,
      meta: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        ...meta
      }
    }
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取级别名称
   */
  getLevelName(level) {
    const names = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.ERROR]: 'ERROR',
      [LogLevel.FATAL]: 'FATAL'
    }
    return names[level] || 'UNKNOWN'
  }

  /**
   * 格式化输出
   */
  formatEntry(entry) {
    const { format } = this.options
    
    if (format === 'simple') {
      return `[${entry.timestamp}] ${entry.levelName} [${entry.logger}] ${entry.message}`
    }
    
    // JSON格式
    return JSON.stringify(entry, null, 2)
  }

  /**
   * 控制台输出
   */
  handleConsoleLog(entry) {
    const consoleMethod = {
      [LogLevel.DEBUG]: 'debug',
      [LogLevel.INFO]: 'info',
      [LogLevel.WARN]: 'warn',
      [LogLevel.ERROR]: 'error',
      [LogLevel.FATAL]: 'error'
    }[entry.level] || 'log'

    const console = window.console
    
    if (console[consoleMethod]) {
      if (entry.data && Object.keys(entry.data).length > 0) {
        console[consoleMethod](
          `[${entry.logger}] ${entry.message}`,
          entry.data,
          entry.meta
        )
      } else {
        console[consoleMethod](`[${entry.logger}] ${entry.message}`, entry.meta)
      }
    }
  }

  /**
   * 本地存储输出
   */
  handleLocalStorageLog(entry) {
    try {
      const key = `app_logs_${this.name}`
      const existingLogs = localStorage.getItem(key)
      let logs = existingLogs ? JSON.parse(existingLogs) : []
      
      logs.push(entry)
      
      // 限制条目数量
      if (logs.length > this.options.maxEntries) {
        logs = logs.slice(-this.options.maxEntries)
      }
      
      localStorage.setItem(key, JSON.stringify(logs))
    } catch (error) {
      // 忽略存储错误
    }
  }

  /**
   * 服务器输出
   */
  handleServerLog(entry) {
    // 异步发送到服务器
    fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entry)
    }).catch(() => {
      // 忽略网络错误
    })
  }

  /**
   * 记录日志
   */
  log(level, message, data = {}, meta = {}) {
    if (!this.shouldLog(level)) return

    const entry = this.createEntry(level, message, data, meta)
    
    // 添加到本地记录
    this.entries.push(entry)
    
    // 限制内存中的条目数量
    if (this.entries.length > this.options.maxEntries) {
      this.entries = this.entries.slice(-this.options.maxEntries)
    }
    
    // 输出到目标
    Object.values(this.targetHandlers).forEach(handler => {
      try {
        handler(entry)
      } catch (error) {
        // 忽略输出错误
      }
    })
  }

  /**
   * Debug级别
   */
  debug(message, data = {}, meta = {}) {
    this.log(LogLevel.DEBUG, message, data, meta)
  }

  /**
   * Info级别
   */
  info(message, data = {}, meta = {}) {
    this.log(LogLevel.INFO, message, data, meta)
  }

  /**
   * Warn级别
   */
  warn(message, data = {}, meta = {}) {
    this.log(LogLevel.WARN, message, data, meta)
  }

  /**
   * Error级别
   */
  error(message, data = {}, meta = {}) {
    this.log(LogLevel.ERROR, message, data, meta)
  }

  /**
   * Fatal级别
   */
  fatal(message, data = {}, meta = {}) {
    this.log(LogLevel.FATAL, message, data, meta)
  }

  /**
   * 记录性能指标
   */
  performance(name, duration, meta = {}) {
    this.info('Performance', { name, duration }, meta)
  }

  /**
   * 记录用户操作
   */
  userAction(action, data = {}, meta = {}) {
    this.info('UserAction', { action, ...data }, meta)
  }

  /**
   * 记录API请求
   */
  apiRequest(url, method, options = {}) {
    this.info('API Request', {
      url,
      method,
      options
    })
  }

  /**
   * 记录API响应
   */
  apiResponse(url, method, response, duration, options = {}) {
    const isError = response.status >= 400
    const level = isError ? LogLevel.ERROR : LogLevel.INFO
    
    this.log(level, 'API Response', {
      url,
      method,
      status: response.status,
      duration,
      options
    })
  }

  /**
   * 开始计时
   */
  startTimer(name) {
    const startTime = performance.now()
    return {
      end: (meta = {}) => {
        const duration = performance.now() - startTime
        this.performance(name, duration, meta)
        return duration
      }
    }
  }

  /**
   * 批量记录
   */
  batch(logs) {
    logs.forEach(({ level, message, data, meta }) => {
      this.log(level, message, data, meta)
    })
  }

  /**
   * 获取所有日志
   */
  getLogs(filter = {}) {
    let logs = [...this.entries]
    
    if (filter.level) {
      logs = logs.filter(log => log.level === filter.level)
    }
    
    if (filter.levelMin) {
      logs = logs.filter(log => log.level >= filter.levelMin)
    }
    
    if (filter.levelMax) {
      logs = logs.filter(log => log.level <= filter.levelMax)
    }
    
    if (filter.since) {
      const sinceTime = new Date(filter.since).getTime()
      logs = logs.filter(log => new Date(log.timestamp).getTime() >= sinceTime)
    }
    
    return logs
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.entries = []
    
    // 清空存储
    if (this.options.targets.includes(LogTarget.LOCAL_STORAGE)) {
      const key = `app_logs_${this.name}`
      localStorage.removeItem(key)
    }
  }

  /**
   * 导出日志
   */
  exportLogs(format = 'json') {
    const logs = this.getLogs()
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2)
    }
    
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'logger', 'message']
      const rows = logs.map(log => [
        log.timestamp,
        log.levelName,
        log.logger,
        log.message
      ])
      
      return [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')
    }
    
    return logs
  }

  /**
   * 设置日志级别
   */
  setLevel(level) {
    this.options.level = level
  }

  /**
   * 启用/禁用日志
   */
  setEnabled(enabled) {
    this.options.enabled = enabled
  }

  /**
   * 开始定时刷新
   */
  startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.options.flushInterval)
  }

  /**
   * 刷新日志（发送到服务器等）
   */
  flush() {
    if (this.entries.length === 0) return
    
    // 批量发送到服务器
    if (this.options.targets.includes(LogTarget.SERVER)) {
      const batch = [...this.entries]
      this.entries = [] // 清空内存记录
      
      fetch('/api/logs/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logger: this.name,
          logs: batch
        })
      }).catch(() => {
        // 恢复记录（发送到服务器失败）
        this.entries.unshift(...batch)
      })
    }
  }

  /**
   * 销毁日志器
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    
    this.flush() // 最后刷新一次
  }
}

/**
 * 日志工厂函数
 */
export function createLogger(name, options = {}) {
  return new Logger(name, options)
}

/**
 * 全局日志管理器
 */
class LogManager {
  constructor() {
    this.loggers = new Map()
    this.defaultOptions = {
      level: LogLevel.INFO,
      enabled: true,
      targets: [LogTarget.CONSOLE],
      maxEntries: 1000
    }
  }

  /**
   * 创建或获取日志器
   */
  getLogger(name, options = {}) {
    if (!this.loggers.has(name)) {
      const loggerOptions = { ...this.defaultOptions, ...options }
      this.loggers.set(name, createLogger(name, loggerOptions))
    }
    
    return this.loggers.get(name)
  }

  /**
   * 设置全局配置
   */
  configure(options = {}) {
    this.defaultOptions = { ...this.defaultOptions, ...options }
  }

  /**
   * 获取所有日志器
   */
  getAllLoggers() {
    return Array.from(this.loggers.values())
  }

  /**
   * 清空所有日志
   */
  clearAllLogs() {
    this.loggers.forEach(logger => logger.clearLogs())
  }

  /**
   * 销毁所有日志器
   */
  destroy() {
    this.loggers.forEach(logger => logger.destroy())
    this.loggers.clear()
  }
}

// 创建全局实例
export const logManager = new LogManager()

// 导出常用日志器
export const logger = logManager.getLogger('App')

// Vue插件
export const LoggerPlugin = {
  install(app, options = {}) {
    logManager.configure(options)
    
    // 提供全局方法
    app.config.globalProperties.$logger = logManager.getLogger('Vue')
    app.provide('logger', logManager.getLogger('Vue'))
    app.provide('logManager', logManager)
  }
}

export default {
  LogLevel,
  LogTarget,
  Logger,
  createLogger,
  logManager,
  logger,
  LoggerPlugin
}