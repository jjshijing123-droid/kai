import { getTranslation, languages, updateTranslations, reloadTranslations, translations } from './translations.js'

// 多语言服务
class I18nService {
  constructor() {
    this.currentLanguage = 'en'
    this.listeners = new Set()
    this.init()
  }

  // 初始化
  init() {
    // 检查是否在浏览器环境中
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem('preferredLanguage')
      const browserLang = this.getBrowserLanguage()
      
      if (savedLang && languages[savedLang]) {
        this.currentLanguage = savedLang
      } else {
        this.currentLanguage = browserLang
        localStorage.setItem('preferredLanguage', this.currentLanguage)
      }
    } else {
      // 服务器端渲染时使用默认语言
      this.currentLanguage = 'en'
    }
  }

  // 获取浏览器语言
  getBrowserLanguage() {
    // 检查是否在浏览器环境中
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language || navigator.userLanguage
      return browserLang.startsWith('zh') ? 'zh-CN' : 'en'
    } else {
      // 服务器端渲染时返回默认语言
      return 'en'
    }
  }

  // 翻译函数
  t(key, params = {}, lang) {
    const targetLang = lang || this.currentLanguage
    let text = getTranslation(key, targetLang)
    
    // 处理参数替换 - 支持 {param} 和 {{param}} 两种格式
    Object.keys(params).forEach(param => {
      // 先尝试替换 {param} 格式
      text = text.replace(new RegExp(`{${param}}`, 'g'), params[param])
      // 再尝试替换 {{param}} 格式
      text = text.replace(new RegExp(`{{${param}}}`, 'g'), params[param])
    })
    
    return text
  }

  // 设置语言
  setLanguage(lang) {
    if (languages[lang]) {
      this.currentLanguage = lang
      localStorage.setItem('preferredLanguage', lang)
      this.notifyListeners()
      return true
    }
    return false
  }

  // 切换语言
  toggleLanguage() {
    const newLang = this.currentLanguage === 'zh-CN' ? 'en' : 'zh-CN'
    console.log('Toggling language from', this.currentLanguage, 'to', newLang)
    return this.setLanguage(newLang)
  }

  // 获取当前语言
  getCurrentLanguage() {
    return this.currentLanguage
  }

  // 获取支持的语言列表
  getLanguages() {
    return Object.keys(languages).map(code => ({
      code,
      ...languages[code]
    }))
  }

  // 添加翻译监听器
  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // 通知监听器
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentLanguage))
  }

  // 批量添加翻译
  addTranslations(newTranslations) {
    updateTranslations(newTranslations)
  }

  // 更新单个翻译
  updateTranslation(lang, key, value) {
    const newTranslations = { [lang]: { [key]: value } }
    updateTranslations(newTranslations)
  }

  // 删除翻译
  deleteTranslation(key) {
    // 从所有语言中删除该翻译键
    Object.keys(languages).forEach(lang => {
      this.updateTranslation(lang, key, '')
    })
  }

  // 保存翻译到文件
  async saveTranslationsToFile() {
    // 调用后端API保存到文件
    try {
      const response = await fetch('/api/save-translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translations: this.getAllTranslations() })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Translations saved to file:', result.message)
      } else {
        console.error('Failed to save translations to file:', response.statusText)
      }
    } catch (error) {
      console.error('Error calling save API:', error)
      console.log('Note: Translation server might not be running. Translations are not saved.')
    }
  }

  // 获取所有翻译键
  getTranslationKeys() {
    const keys = new Set()
    Object.keys(languages).forEach(lang => {
      // 从动态翻译数据中获取所有键
      try {
        const langTranslations = translations[lang] || {}
        Object.keys(langTranslations).forEach(key => keys.add(key))
      } catch (error) {
        console.error(`Error getting translations for language ${lang}:`, error)
      }
    })
    return Array.from(keys).sort()
  }

  // 获取所有翻译数据
  getAllTranslations() {
    const allTranslations = {}
    Object.keys(languages).forEach(lang => {
      allTranslations[lang] = {}
      // 直接从翻译对象中获取所有键和值
      try {
        const langTranslations = translations[lang] || {}
        Object.keys(langTranslations).forEach(key => {
          const value = langTranslations[key]
          if (value && value.trim() !== '') { // 排除空值
            allTranslations[lang][key] = value
          }
        })
      } catch (error) {
        console.error(`Error getting all translations for language ${lang}:`, error)
      }
    })
    return allTranslations
  }

  // 检查翻译完整性 - 简化版本
  checkTranslationCompleteness() {
    const allKeys = this.getTranslationKeys()
    const completeness = {}
    
    Object.keys(languages).forEach(lang => {
      try {
        const langTranslations = translations[lang] || {}
        const langKeys = Object.keys(langTranslations)
        
        // 计算有效的翻译数量
        const validTranslations = langKeys.filter(key => {
          const value = langTranslations[key]
          return value && value.trim() !== ''
        })
        
        const missingKeys = allKeys.filter(key => !langKeys.includes(key))
        
        const total = allKeys.length
        const percentage = total > 0 ? Math.round((validTranslations.length / total) * 100) : 0
        
        completeness[lang] = {
          total: total,
          translated: validTranslations.length,
          missing: missingKeys,
          percentage: percentage
        }
      } catch (error) {
        console.error(`Error checking translation completeness for language ${lang}:`, error)
        completeness[lang] = {
          total: 0,
          translated: 0,
          missing: [],
          percentage: 0
        }
      }
    })
    
    return completeness
  }
}

// 创建全局实例
const i18n = new I18nService()

// Vue 插件
const I18nPlugin = {
  install(app) {
    app.config.globalProperties.$t = i18n.t.bind(i18n)
    app.config.globalProperties.$i18n = i18n
    app.provide('i18n', i18n)
  }
}

// 导出
export { i18n, I18nPlugin, I18nService }
export default i18n
