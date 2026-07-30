import { getTranslation, languages, updateTranslations, translations } from './translations.js'

/**
 * 多语言服务
 *
 * 翻译数据来源：
 *   - 前端默认：静态文件 translations.js（内含 en + zh-CN）
 *   - 运行时：从 /api/i18n/translations 获取（SQLite 存储，管理面板修改后生效）
 *   - 优先级：API 数据 > 静态文件数据
 */
class I18nService {
  constructor() {
    this.currentLanguage = 'en'
    this.listeners = new Set()
    this.remoteTranslations = null  // 从 API 加载的翻译数据
    this.init()
    this.loadFromLocalStorage()
  }

  // 初始化 - 从 API 加载翻译数据
  async init() {
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
      this.currentLanguage = 'en'
    }

    // 从 API 加载最新翻译数据（后台异步，不影响当前语言切换）
    this.loadTranslationsFromApi().catch(err => {
      console.warn('从 API 加载翻译数据失败，使用本地静态数据:', err.message)
    })
  }

  // 从后端 API 加载翻译
  async loadTranslationsFromApi() {
    try {
      const response = await fetch('/api/i18n/translations')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json()
      if (result.success && result.data) {
        this.remoteTranslations = result.data
        // 合并到本地 translations 对象
        updateTranslations(result.data)
        console.log('✅ 翻译数据已从 API 同步（SQLite 存储）')
      }
    } catch (error) {
      console.warn('加载远程翻译数据失败:', error.message)
    }
  }

  // 获取浏览器语言
  getBrowserLanguage() {
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language || navigator.userLanguage
      return browserLang.startsWith('zh') ? 'zh-CN' : 'en'
    } else {
      return 'en'
    }
  }

  // 翻译函数 - 优先使用远程数据
  t(key, params = {}, lang) {
    const targetLang = lang || this.currentLanguage
    let text

    // 优先从远程数据查找
    if (this.remoteTranslations && this.remoteTranslations[targetLang] && this.remoteTranslations[targetLang][key]) {
      text = this.remoteTranslations[targetLang][key]
    } else {
      text = getTranslation(key, targetLang)
    }

    // 处理参数替换
    Object.keys(params).forEach((param) => {
      const escapedParam = param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      text = text.replace(new RegExp(`\\{${escapedParam}\\}`, 'g'), params[param])
      text = text.replace(new RegExp(`\\{\\{${escapedParam}\\}\\}`, 'g'), params[param])
    })

    return text
  }

  // 设置语言
  setLanguage(lang) {
    if (languages[lang]) {
      this.currentLanguage = lang
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('preferredLanguage', lang)
      }
      this.notifyListeners()
      return true
    }
    return false
  }

  // 切换语言
  toggleLanguage() {
    const newLang = this.currentLanguage === 'zh-CN' ? 'en' : 'zh-CN'
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

  // 批量添加翻译（远程）
  async addTranslations(newTranslations) {
    updateTranslations(newTranslations)
    // 同步到服务器
    try {
      const response = await fetch('/api/i18n/translations/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: Object.keys(newTranslations[this.currentLanguage] || newTranslations)[0], translations: newTranslations }),
      })
      if (response.ok) {
        // 刷新远程数据
        await this.loadTranslationsFromApi()
      }
    } catch (error) {
      console.error('同步翻译到服务器失败:', error)
    }
  }

  // 更新单个翻译（远程）
  async updateTranslation(lang, key, value) {
    updateTranslations({ [lang]: { [key]: value } })
    try {
      const response = await fetch(`/api/i18n/translations/keys/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translations: { [lang]: value } }),
      })
      if (response.ok) {
        await this.loadTranslationsFromApi()
      }
    } catch (error) {
      console.error('更新远程翻译失败:', error)
    }
  }

  // 删除翻译（远程）
  async deleteTranslation(key) {
    // 本地删除
    Object.keys(languages).forEach(lang => {
      if (translations[lang] && translations[lang][key] !== undefined) {
        delete translations[lang][key]
      }
      if (this.remoteTranslations && this.remoteTranslations[lang] && this.remoteTranslations[lang][key] !== undefined) {
        delete this.remoteTranslations[lang][key]
      }
    })
    // 远程删除
    try {
      const response = await fetch(`/api/i18n/translations/keys/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        await this.loadTranslationsFromApi()
      }
    } catch (error) {
      console.error('删除远程翻译失败:', error)
    }
  }

  // 从localStorage加载翻译（已废弃，保留兼容）
  loadFromLocalStorage() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const savedTranslations = localStorage.getItem('i18n_translations')
        if (savedTranslations) {
          localStorage.removeItem('i18n_translations')
          console.log('已清除旧版 localStorage 翻译数据，现在使用 SQLite 存储')
        }
      }
    } catch (error) {
      console.error('处理 localStorage 翻译数据失败:', error)
    }
  }

  // 获取所有翻译键（合并本地 + 远程）
  getTranslationKeys() {
    const keys = new Set()

    // 从远程数据收集
    if (this.remoteTranslations) {
      Object.keys(this.remoteTranslations).forEach(lang => {
        Object.keys(this.remoteTranslations[lang]).forEach(key => keys.add(key))
      })
    }

    // 从本地数据收集
    try {
      const langTranslations = translations || {}
      Object.keys(langTranslations).forEach(key => keys.add(key))
    } catch (error) {
      console.error('获取翻译键失败:', error)
    }

    return Array.from(keys).sort()
  }

  // 获取所有翻译数据
  getAllTranslations() {
    const allTranslations = {}
    const source = this.remoteTranslations || translations

    Object.keys(languages).forEach(lang => {
      allTranslations[lang] = {}
      try {
        const langTranslations = source[lang] || {}
        Object.keys(langTranslations).forEach(key => {
          const value = langTranslations[key]
          if (value !== undefined) {
            allTranslations[lang][key] = value
          }
        })
      } catch (error) {
        console.error(`获取 ${lang} 翻译数据失败:`, error)
      }
    })
    return allTranslations
  }

  // 保存所有翻译到后端（SQLite）
  async saveTranslationsToFile() {
    try {
      const translationsData = this.getAllTranslations()

      const response = await fetch('/api/i18n/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(translationsData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `保存失败: ${response.status}`)
      }

      // 刷新远程数据
      await this.loadTranslationsFromApi()
      return true
    } catch (error) {
      console.error('保存翻译到后端失败:', error)
      return false
    }
  }

  // 添加单个翻译键
  async addTranslationKey(key, translationsData) {
    try {
      const response = await fetch('/api/i18n/translations/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, translations: translationsData }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `添加翻译键失败: ${response.status}`)
      }

      // 刷新远程数据
      await this.loadTranslationsFromApi()
      return true
    } catch (error) {
      console.error('添加翻译键失败:', error)
      return false
    }
  }

  // 更新单个翻译键
  async updateTranslationKey(key, lang, value) {
    try {
      const translationsData = { [lang]: value }

      const response = await fetch(`/api/i18n/translations/keys/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translations: translationsData }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `更新翻译键失败: ${response.status}`)
      }

      await this.loadTranslationsFromApi()
      return true
    } catch (error) {
      console.error('更新翻译键失败:', error)
      return false
    }
  }

  // 删除单个翻译键
  async deleteTranslationKey(key) {
    try {
      const response = await fetch(`/api/i18n/translations/keys/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `删除翻译键失败: ${response.status}`)
      }

      await this.loadTranslationsFromApi()
      return true
    } catch (error) {
      console.error('删除翻译键失败:', error)
      return false
    }
  }

  // 检查翻译完整性（合并本地 + 远程数据）
  checkTranslationCompleteness() {
    const allKeys = this.getTranslationKeys()
    const completeness = {}
    const source = this.remoteTranslations || translations

    Object.keys(languages).forEach(lang => {
      try {
        const langTranslations = source[lang] || {}
        let translatedCount = 0
        const missingKeys = []

        allKeys.forEach(key => {
          const value = langTranslations[key]
          if (value && String(value).trim() !== '') {
            translatedCount++
          } else {
            missingKeys.push(key)
          }
        })

        const total = allKeys.length
        const percentage = total > 0 ? Number(((translatedCount / total) * 100).toFixed(1)) : 0

        completeness[lang] = {
          total,
          translated: translatedCount,
          missing: missingKeys,
          percentage
        }
      } catch (error) {
        console.error(`检查 ${lang} 翻译完整性失败:`, error)
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
