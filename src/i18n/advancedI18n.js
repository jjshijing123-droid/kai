import { ref, reactive } from 'vue'
import { commonTranslations } from './common/commonTranslations.js'
import { componentTranslations } from './components/componentTranslations.js'

/**
 * 改进的国际化管理系统
 * 支持模块化翻译、动态加载、性能优化
 */
class AdvancedI18nService {
  constructor() {
    this.currentLanguage = 'zh-CN'
    this.listeners = new Set()
    this.translations = reactive({
      common: commonTranslations,
      components: componentTranslations
    })
    this.cache = new Map()
    this.cacheTimeout = 30 * 60 * 1000 // 30分钟缓存
    this.initialized = false
  }

  /**
   * 初始化国际化服务
   */
  async init() {
    if (this.initialized) return

    try {
      // 检查浏览器语言偏好
      this.detectBrowserLanguage()
      
      // 加载本地存储的语言偏好
      this.loadSavedLanguage()
      
      // 预加载所有翻译
      await this.preloadTranslations()
      
      this.initialized = true
      console.log('✅ 国际化服务初始化完成')
      
    } catch (error) {
      console.error('❌ 国际化服务初始化失败:', error)
      // 使用默认语言
      this.currentLanguage = 'en'
    }
  }

  /**
   * 检测浏览器语言
   */
  detectBrowserLanguage() {
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language || navigator.userLanguage
      const supportedLanguages = ['en', 'zh-CN']
      
      // 检查是否支持浏览器语言
      for (const lang of supportedLanguages) {
        if (browserLang.startsWith(lang.split('-')[0])) {
          // 只在没有保存偏好时使用浏览器语言
          const savedLang = localStorage.getItem('preferredLanguage')
          if (!savedLang) {
            this.currentLanguage = lang
            break
          }
        }
      }
    }
  }

  /**
   * 加载保存的语言偏好
   */
  loadSavedLanguage() {
    if (typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem('preferredLanguage')
      if (savedLang && this.isValidLanguage(savedLang)) {
        this.currentLanguage = savedLang
      }
    }
  }

  /**
   * 预加载所有翻译
   */
  async preloadTranslations() {
    const loadPromises = []
    
    // 预加载所有模块的翻译
    Object.keys(this.translations).forEach(moduleName => {
      const module = this.translations[moduleName]
      Object.keys(module).forEach(lang => {
        if (!this.cache.has(`${moduleName}_${lang}`)) {
          loadPromises.push(this.loadTranslationModule(moduleName, lang))
        }
      })
    })
    
    await Promise.all(loadPromises)
    console.log('📦 所有翻译预加载完成')
  }

  /**
   * 加载翻译模块
   */
  async loadTranslationModule(moduleName, language) {
    const cacheKey = `${moduleName}_${language}`
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data
    }

    try {
      const module = this.translations[moduleName]
      if (!module[language]) {
        console.warn(`⚠️ 翻译模块 ${moduleName} 中未找到语言 ${language}`)
        return module['en'] || {}
      }

      const translationData = module[language]
      this.updateCache(cacheKey, translationData)
      
      return translationData
    } catch (error) {
      console.error(`❌ 加载翻译模块失败: ${moduleName}_${language}`, error)
      return {}
    }
  }

  /**
   * 翻译函数 - 支持参数替换和嵌套键
   */
  t(key, params = {}, language = null) {
    const targetLang = language || this.currentLanguage
    const translation = this.getNestedTranslation(key, targetLang)
    
    if (!translation) {
      console.warn(`⚠️ 翻译缺失: ${key} (${targetLang})`)
      return key // 返回原始键作为fallback
    }
    
    // 处理参数替换
    return this.replaceParams(translation, params)
  }

  /**
   * 获取嵌套翻译
   */
  getNestedTranslation(key, language) {
    // 优先从缓存获取
    const cacheKey = `translation_${key}_${language}`
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data
    }

    // 解析键路径（支持 "module.key.subkey" 格式）
    const parts = key.split('.')
    let translation = null

    if (parts.length > 1) {
      // 带有模块前缀的键
      const [moduleName, ...restKey] = parts
      const module = this.translations[moduleName]
      if (module && module[language]) {
        translation = this.getValueByPath(module[language], restKey.join('.'))
      }
    } else {
      // 扁平键，在所有模块中搜索
      for (const moduleName of Object.keys(this.translations)) {
        const module = this.translations[moduleName]
        if (module[language]) {
          translation = this.getValueByPath(module[language], key)
          if (translation) break
        }
      }
    }

    // 缓存结果
    if (translation) {
      this.updateCache(cacheKey, translation)
    }

    return translation
  }

  /**
   * 根据路径获取对象值
   */
  getValueByPath(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  /**
   * 替换翻译文本中的参数
   */
  replaceParams(text, params) {
    if (!params || typeof text !== 'string') return text
    
    let result = text
    
    // 支持 {param} 和 {{param}} 两种格式
    Object.keys(params).forEach(param => {
      const regex1 = new RegExp(`{${param}}`, 'g')
      const regex2 = new RegExp(`{{${param}}}`, 'g')
      result = result.replace(regex1, params[param])
      result = result.replace(regex2, params[param])
    })
    
    return result
  }

  /**
   * 设置语言
   */
  async setLanguage(language) {
    if (!this.isValidLanguage(language)) {
      console.warn(`⚠️ 不支持的语言: ${language}`)
      return false
    }

    const oldLanguage = this.currentLanguage
    this.currentLanguage = language
    
    // 保存到本地存储
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('preferredLanguage', language)
    }
    
    // 预加载新语言的翻译
    await this.preloadTranslationsForLanguage(language)
    
    // 通知监听器
    this.notifyListeners(language, oldLanguage)
    
    console.log(`🌐 语言已切换: ${oldLanguage} → ${language}`)
    return true
  }

  /**
   * 预加载指定语言的翻译
   */
  async preloadTranslationsForLanguage(language) {
    const loadPromises = []
    
    Object.keys(this.translations).forEach(moduleName => {
      const module = this.translations[moduleName]
      if (module[language] && !this.cache.has(`${moduleName}_${language}`)) {
        loadPromises.push(this.loadTranslationModule(moduleName, language))
      }
    })
    
    await Promise.all(loadPromises)
  }

  /**
   * 切换语言（便捷方法）
   */
  toggleLanguage() {
    const newLang = this.currentLanguage === 'zh-CN' ? 'en' : 'zh-CN'
    return this.setLanguage(newLang)
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage() {
    return this.currentLanguage
  }

  /**
   * 验证语言是否支持
   */
  isValidLanguage(language) {
    const supportedLanguages = ['en', 'zh-CN']
    return supportedLanguages.includes(language)
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'zh-CN', name: '中文', flag: '🇨🇳' }
    ]
  }

  /**
   * 检查翻译完整性
   */
  checkCompleteness() {
    const completeness = {}
    
    Object.keys(this.translations).forEach(moduleName => {
      const module = this.translations[moduleName]
      const allKeys = this.getAllTranslationKeys(module['en'] || {})
      
      completeness[moduleName] = {}
      Object.keys(module).forEach(lang => {
        const langKeys = this.getAllTranslationKeys(module[lang] || {})
        const missingKeys = allKeys.filter(key => !langKeys.includes(key))
        const completionRate = allKeys.length > 0 ? 
          Math.round(((allKeys.length - missingKeys.length) / allKeys.length) * 100) : 0
        
        completeness[moduleName][lang] = {
          total: allKeys.length,
          translated: allKeys.length - missingKeys.length,
          missing: missingKeys,
          completionRate
        }
      })
    })
    
    return completeness
  }

  /**
   * 获取翻译对象的所有键
   */
  getAllTranslationKeys(obj, prefix = '') {
    const keys = []
    
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...this.getAllTranslationKeys(obj[key], fullKey))
      } else {
        keys.push(fullKey)
      }
    })
    
    return keys
  }

  /**
   * 添加监听器
   */
  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * 通知监听器
   */
  notifyListeners(newLanguage, oldLanguage) {
    this.listeners.forEach(callback => {
      try {
        callback(newLanguage, oldLanguage)
      } catch (error) {
        console.error('❌ 监听器执行失败:', error)
      }
    })
  }

  /**
   * 添加新的翻译模块
   */
  addTranslationModule(moduleName, translations) {
    this.translations[moduleName] = translations
    console.log(`📦 添加翻译模块: ${moduleName}`)
  }

  /**
   * 动态添加翻译
   */
  addTranslations(newTranslations) {
    Object.keys(newTranslations).forEach(lang => {
      Object.keys(newTranslations[lang]).forEach(moduleName => {
        if (!this.translations[moduleName]) {
          this.translations[moduleName] = {}
        }
        if (!this.translations[moduleName][lang]) {
          this.translations[moduleName][lang] = {}
        }
        Object.assign(this.translations[moduleName][lang], newTranslations[lang][moduleName])
      })
    })
    
    // 清除相关缓存
    this.clearCache()
    
    console.log('🔄 动态翻译已添加')
  }

  // ==================== 缓存管理 ====================

  /**
   * 更新缓存
   */
  updateCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * 检查缓存是否有效
   */
  isCacheValid(key) {
    const cached = this.cache.get(key)
    if (!cached) return false
    
    const age = Date.now() - cached.timestamp
    return age < this.cacheTimeout
  }

  /**
   * 清除缓存
   */
  clearCache(key) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      total: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        age: Math.round((Date.now() - value.timestamp) / 1000),
        isValid: this.isCacheValid(key)
      }))
    }
  }
}

// 创建单例实例
const advancedI18n = new AdvancedI18nService()

// Vue 插件
const AdvancedI18nPlugin = {
  install(app) {
    // 全局方法
    app.config.globalProperties.$t = (key, params, lang) => advancedI18n.t(key, params, lang)
    app.config.globalProperties.$i18n = advancedI18n
    
    // 提供依赖注入
    app.provide('i18n', advancedI18n)
    
    // 在应用实例上提供
    app.i18n = advancedI18n
  }
}

// 导出
export { advancedI18n, AdvancedI18nPlugin }
export default advancedI18n