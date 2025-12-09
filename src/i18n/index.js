import { getTranslation, languages, updateTranslations, reloadTranslations, translations } from './translations.js'

// 多语言服务
class I18nService {
  constructor() {
    this.currentLanguage = 'en'
    this.listeners = new Set()
    this.init()
    this.loadFromLocalStorage()
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
      if (translations[lang] && translations[lang][key] !== undefined) {
        delete translations[lang][key]
      }
    })
  }

  // 从localStorage加载翻译（已废弃，仅用于兼容旧版本）
  loadFromLocalStorage() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const savedTranslations = localStorage.getItem('i18n_translations')
        
        if (savedTranslations) {
          // 清除旧的localStorage数据，因为现在使用后端API保存到文件
          localStorage.removeItem('i18n_translations')
          console.log('Removed old localStorage translations data, now using file storage')
        }
      }
    } catch (error) {
      console.error('Failed to process localStorage translations:', error)
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
          if (value !== undefined) { // 保留所有值，包括空值
            allTranslations[lang][key] = value
          }
        })
      } catch (error) {
        console.error(`Error getting all translations for language ${lang}:`, error)
      }
    })
    return allTranslations
  }

  // 保存所有翻译到后端文件
  async saveTranslationsToFile() {
    try {
      const translationsData = this.getAllTranslations()
      console.log('Saving translations data to backend:', translationsData)
      
      // 调用后端API保存所有翻译
      const response = await fetch('/api/i18n/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(translationsData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to save translations: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Translations saved successfully to file:', result)
      
      // 更新全局 translations 对象，确保修改立即生效
      Object.keys(translationsData).forEach(lang => {
        translations[lang] = translationsData[lang]
      })
      
      return true
    } catch (error) {
      console.error('Error in saveTranslationsToFile:', error)
      return false
    }
  }
  
  // 添加单个翻译键
  async addTranslationKey(key, translationsData) {
    try {
      console.log('Adding translation key:', key, translationsData)
      
      const response = await fetch('/api/i18n/translations/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, translations: translationsData }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to add translation key: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Translation key added successfully:', result)
      
      return true
    } catch (error) {
      console.error('Error in addTranslationKey:', error)
      return false
    }
  }
  
  // 更新单个翻译键
  async updateTranslationKey(key, lang, value) {
    try {
      console.log('Updating translation key:', key, lang, value)
      
      // 构建后端期望的请求体格式
      const translationsData = {}
      translationsData[lang] = value
      
      const response = await fetch(`/api/i18n/translations/keys/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translations: translationsData }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to update translation key: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Translation key updated successfully:', result)
      
      return true
    } catch (error) {
      console.error('Error in updateTranslationKey:', error)
      return false
    }
  }
  
  // 删除单个翻译键
  async deleteTranslationKey(key) {
    try {
      console.log('Deleting translation key:', key)
      
      const response = await fetch(`/api/i18n/translations/keys/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to delete translation key: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Translation key deleted successfully:', result)
      
      return true
    } catch (error) {
      console.error('Error in deleteTranslationKey:', error)
      return false
    }
  }

  // 检查翻译完整性 - 精确计算版本
  checkTranslationCompleteness() {
    const allKeys = this.getTranslationKeys()
    const completeness = {}
    
    Object.keys(languages).forEach(lang => {
      try {
        const langTranslations = translations[lang] || {}
        
        // 遍历所有翻译键，检查每个键在当前语言中是否有有效值
        let translatedCount = 0
        const missingKeys = []
        
        allKeys.forEach(key => {
          const value = langTranslations[key]
          if (value && value.trim() !== '') {
            translatedCount++
          } else {
            missingKeys.push(key)
          }
        })
        
        const total = allKeys.length
        // 计算精确的百分比，保留一位小数
        const percentage = total > 0 ? Number(((translatedCount / total) * 100).toFixed(1)) : 0
        
        completeness[lang] = {
          total: total,
          translated: translatedCount,
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
