/**
 * 性能监控工具类
 * 用于监控和优化应用程序性能
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = new Map()
    this.frameCount = 0
    this.lastTime = performance.now()
    this.fpsHistory = []
    this.maxFpsHistory = 60 // 保存60帧的FPS历史
    this.memoryUsage = null
  }

  /**
   * 开始性能测量
   */
  startMeasure(name, label = '') {
    const startTime = performance.now()
    const measureId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.metrics.set(measureId, {
      name,
      label,
      startTime,
      status: 'running'
    })
    
    return measureId
  }

  /**
   * 结束性能测量
   */
  endMeasure(measureId) {
    const measure = this.metrics.get(measureId)
    if (!measure || measure.status !== 'running') {
      console.warn(`⚠️ 性能测量 ${measureId} 不存在或已完成`)
      return null
    }
    
    const endTime = performance.now()
    const duration = endTime - measure.startTime
    
    measure.endTime = endTime
    measure.duration = duration
    measure.status = 'completed'
    
    // 保存到历史记录
    if (!this.metrics.has(`${measure.name}_history`)) {
      this.metrics.set(`${measure.name}_history`, [])
    }
    
    const history = this.metrics.get(`${measure.name}_history`)
    history.push({
      duration,
      timestamp: endTime,
      label: measure.label
    })
    
    // 只保留最近100次测量
    if (history.length > 100) {
      history.shift()
    }
    
    console.log(`⏱️ 性能测量完成: ${measure.name} ${measure.label ? `(${measure.label})` : ''} = ${duration.toFixed(2)}ms`)
    
    return duration
  }

  /**
   * 测量函数执行时间
   */
  async measureFunction(name, fn, label = '') {
    const measureId = this.startMeasure(name, label)
    try {
      const result = await fn()
      this.endMeasure(measureId)
      return result
    } catch (error) {
      this.endMeasure(measureId)
      throw error
    }
  }

  /**
   * 监控FPS
   */
  startFPSMonitor() {
    const measureFPS = () => {
      this.frameCount++
      const currentTime = performance.now()
      
      if (currentTime >= this.lastTime + 1000) {
        const fps = (this.frameCount * 1000) / (currentTime - this.lastTime)
        this.fpsHistory.push(fps)
        
        // 保持历史记录大小
        if (this.fpsHistory.length > this.maxFpsHistory) {
          this.fpsHistory.shift()
        }
        
        // 更新内存使用情况
        if (performance.memory) {
          this.memoryUsage = {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          }
        }
        
        console.log(`🎮 FPS: ${fps.toFixed(1)} | Memory: ${this.formatBytes(this.memoryUsage?.used || 0)}`)
        
        // 重置计数器
        this.frameCount = 0
        this.lastTime = currentTime
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
  }

  /**
   * 监控页面加载性能
   */
  monitorPageLoad() {
    if (typeof window === 'undefined') return
    
    // 等待页面完全加载
    if (document.readyState === 'complete') {
      this.recordPageLoadMetrics()
    } else {
      window.addEventListener('load', () => {
        this.recordPageLoadMetrics()
      })
    }
  }

  /**
   * 记录页面加载指标
   */
  recordPageLoadMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0]
    if (!navigation) return
    
    const metrics = {
      // DNS查询时间
      dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
      
      // TCP连接时间
      tcpTime: navigation.connectEnd - navigation.connectStart,
      
      // 服务器响应时间
      serverTime: navigation.responseStart - navigation.requestStart,
      
      // DOM解析时间
      domTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      
      // 资源加载时间
      loadTime: navigation.loadEventEnd - navigation.navigationStart,
      
      // 首次内容绘制
      fcp: this.getFirstContentfulPaint(),
      
      // 首次输入延迟
      fid: this.getFirstInputDelay(),
      
      // 最大内容绘制
      lcp: this.getLargestContentfulPaint()
    }
    
    console.log('📊 页面加载性能:', metrics)
    
    // 保存到localStorage用于分析
    localStorage.setItem('pagePerformance', JSON.stringify({
      ...metrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    }))
  }

  /**
   * 获取首次内容绘制时间
   */
  getFirstContentfulPaint() {
    const entries = performance.getEntriesByType('paint')
    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
    return fcpEntry ? fcpEntry.startTime : null
  }

  /**
   * 获取首次输入延迟（简化版本）
   */
  getFirstInputDelay() {
    return new Promise(resolve => {
      const startTime = performance.now()
      
      const measureFID = () => {
        const fid = performance.now() - startTime
        resolve(fid > 0 ? fid : null)
      }
      
      // 监听第一次用户交互
      const events = ['pointerdown', 'keydown', 'scroll']
      events.forEach(event => {
        window.addEventListener(event, measureFID, { once: true })
      })
      
      // 超时后返回null
      setTimeout(() => resolve(null), 5000)
    })
  }

  /**
   * 获取最大内容绘制时间
   */
  getLargestContentfulPaint() {
    return new Promise(resolve => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        resolve(lastEntry.startTime)
        observer.disconnect()
      })
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      
      // 10秒后超时
      setTimeout(() => {
        observer.disconnect()
        resolve(null)
      }, 10000)
    })
  }

  /**
   * 监控资源加载
   */
  monitorResourceLoad() {
    if (typeof window === 'undefined') return
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'img') {
          console.log(`🖼️ 图片加载: ${entry.name} (${this.formatBytes(entry.transferSize || 0)})`)
        }
      }
    })
    
    observer.observe({ entryTypes: ['resource'] })
  }

  /**
   * 创建自定义性能标记
   */
  mark(name) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name)
    }
  }

  /**
   * 测量两个标记之间的性能
   */
  measure(name, startMark, endMark) {
    if (typeof performance !== 'undefined' && performance.measure) {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name)[0]
      return measure ? measure.duration : null
    }
    return null
  }

  /**
   * 监控组件渲染性能
   */
  measureComponentRender(componentName) {
    const measureId = this.startMeasure('component_render', componentName)
    
    return {
      end: () => {
        const duration = this.endMeasure(measureId)
        if (duration && duration > 16) { // 超过16ms（60fps的一帧）
          console.warn(`⚠️ 组件渲染性能警告: ${componentName} 渲染时间 ${duration.toFixed(2)}ms`)
        }
        return duration
      }
    }
  }

  /**
   * 监控网络请求
   */
  monitorNetworkRequests() {
    if (typeof window === 'undefined') return
    
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const url = typeof args[0] === 'string' ? args[0] : args[0].url
      
      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - startTime
        console.log(`🌐 网络请求: ${url} (${duration.toFixed(2)}ms) - ${response.status}`)
        return response
      } catch (error) {
        const duration = performance.now() - startTime
        console.error(`❌ 网络请求失败: ${url} (${duration.toFixed(2)}ms) - ${error.message}`)
        throw error
      }
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const report = {
      timestamp: Date.now(),
      fps: {
        current: this.fpsHistory[this.fpsHistory.length - 1] || 0,
        average: this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length || 0,
        history: this.fpsHistory
      },
      memory: this.memoryUsage,
      measures: {}
    }
    
    // 收集所有性能测量结果
    for (const [key, value] of this.metrics.entries()) {
      if (key.endsWith('_history') && Array.isArray(value)) {
        const name = key.replace('_history', '')
        const durations = value.map(item => item.duration)
        report.measures[name] = {
          count: durations.length,
          average: durations.reduce((a, b) => a + b, 0) / durations.length,
          min: Math.min(...durations),
          max: Math.max(...durations),
          latest: durations[durations.length - 1],
          history: value
        }
      }
    }
    
    return report
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 清理旧数据
   */
  cleanup() {
    // 清理FPS历史
    if (this.fpsHistory.length > this.maxFpsHistory) {
      this.fpsHistory = this.fpsHistory.slice(-this.maxFpsHistory)
    }
    
    // 清理旧的性能测量
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    for (const [key, value] of this.metrics.entries()) {
      if (key.endsWith('_history')) {
        value.forEach(item => {
          if (item.timestamp < oneHourAgo) {
            value.splice(value.indexOf(item), 1)
          }
        })
      }
    }
  }

  /**
   * 导出性能数据
   */
  exportData() {
    const data = {
      report: this.getPerformanceReport(),
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// 创建单例实例
const performanceMonitor = new PerformanceMonitor()

// 自动启动监控
if (typeof window !== 'undefined') {
  // 启动FPS监控
  performanceMonitor.startFPSMonitor()
  
  // 监控页面加载
  performanceMonitor.monitorPageLoad()
  
  // 监控资源加载
  performanceMonitor.monitorResourceLoad()
  
  // 监控网络请求
  performanceMonitor.monitorNetworkRequests()
  
  // 定期清理
  setInterval(() => performanceMonitor.cleanup(), 5 * 60 * 1000) // 每5分钟清理一次
}

export default performanceMonitor