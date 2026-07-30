/**
 * 多语言服务 — 完全由 SQLite 数据库驱动
 *
 * 翻译数据来源：
 *   - 启动时从 /api/i18n/translations 加载（SQLite 存储）
 *   - 运行时通过管理面板（I18nManagementPanel）修改后实时生效
 *   - src/i18n/translations.js 仅作为种子数据源，由后端在首次启动时自动导入
 *
 * 注意：此文件不再从 translations.js 导入任何数据，所有翻译必须通过 API 获取
 */

// 支持的语言列表
const LANGUAGES = {
  'en': { name: 'English', flag: '🇺🇸' },
  'zh-CN': { name: '中文', flag: '🇨🇳' }
}

class I18nService {
  constructor() {
    this.currentLanguage = 'en'
    this.listeners = new Set()
    this.remoteTranslations = null  // 从 API 加载的翻译数据，启动后才可用
    this._ready = false              // 标记翻译数据是否已就绪
  }

  // 等待翻译数据加载完成（用于启动时阻塞）
  async init() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem('preferredLanguage')
      const browserLang = this.getBrowserLanguage()

      if (savedLang && LANGUAGES[savedLang]) {
        this.currentLanguage = savedLang
      } else {
        this.currentLanguage = browserLang
        localStorage.setItem('preferredLanguage', this.currentLanguage)
      }
    } else {
      this.currentLanguage = 'en'
    }

    // 等待 API 加载完成后再标记就绪
    await this.loadTranslationsFromApi()
  }

  // 从后端 API 加载翻译数据（启动时必选，加载失败则抛出错误）
  async loadTranslationsFromApi() {
    try {
      const response = await fetch('/api/i18n/translations')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 翻译数据加载失败`)
      }
      const result = await response.json()
      if (result.success && result.data) {
        this.remoteTranslations = result.data
        this._ready = true
        console.log('✅ 翻译数据已从 API 加载（SQLite 存储）')
      } else {
        throw new Error('API 返回数据格式异常')
      }
    } catch (error) {
      console.error('❌ 加载翻译数据失败:', error)
      this._ready = false
      throw error  // 抛出错误，启动流程可以感知
    }
  }

  // 获取浏览器语言
  getBrowserLanguage() {
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language || navigator.userLanguage
      return browserLang.startsWith('zh') ? 'zh-CN' : 'en'
    }
    return 'en'
  }

  // 翻译函数 — 直接从远程数据读取，无本地 fallback
  t(key, params = {}, lang) {
    const targetLang = lang || this.currentLanguage

    if (!this.remoteTranslations) {
      console.warn(`[i18n] 翻译数据未就绪，无法翻译: "${key}"`)
      return key
    }

    const langData = this.remoteTranslations[targetLang]
    if (!langData) {
      console.warn(`[i18n] 语言 "${targetLang}" 无翻译数据，无法翻译: "${key}"`)
      return key
    }

    let text = langData[key]
    if (text === undefined) {
      // 缺少翻译时返回 key 本身，不做静默 fallback
      return key
    }

    // 处理参数替换 {param} 或 {{param}}
    Object.keys(params).forEach((param) => {
      const escapedParam = param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      text = text.replace(new RegExp(`\\{${escapedParam}\\}`, 'g'), params[param])
      text = text.replace(new RegExp(`\\{\\{${escapedParam}\\}\\}`, 'g'), params[param])
    })

    return text
  }

  // 设置语言
  setLanguage(lang) {
    if (!LANGUAGES[lang]) {
      console.warn(`[i18n] 不支持的语言: "${lang}"`)
      return false
    }
    this.currentLanguage = lang
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('preferredLanguage', lang)
    }
    this.notifyListeners()
    return true
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
    return Object.keys(LANGUAGES).map(code => ({
      code,
      ...LANGUAGES[code]
    }))
  }

  // 检查翻译数据是否已就绪
  isReady() {
    return this._ready && !!this.remoteTranslations
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

  // 保存所有翻译到后端（SQLite）
  async saveAllTranslations() {
    const translationsData = this.getAllTranslations()
    try {
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
      const response = await fetch(`/api/i18n/translations/keys/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translations: { [lang]: value } }),
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

  // 兼容旧接口 — 更新单个翻译（参数顺序：lang, key, value）
  async updateTranslation(lang, key, value) {
    return this.updateTranslationKey(key, lang, value)
  }

  // 兼容旧接口 — 删除翻译键
  async deleteTranslation(key) {
    return this.deleteTranslationKey(key)
  }

  // 获取所有翻译键（仅从远程数据）
  getTranslationKeys() {
    if (!this.remoteTranslations) return []
    const keys = new Set()
    Object.keys(this.remoteTranslations).forEach(lang => {
      Object.keys(this.remoteTranslations[lang]).forEach(key => keys.add(key))
    })
    return Array.from(keys).sort()
  }

  // 获取所有翻译数据（仅从远程数据）
  getAllTranslations() {
    const allTranslations = {}
    const source = this.remoteTranslations || {}

    Object.keys(LANGUAGES).forEach(lang => {
      allTranslations[lang] = {}
      const langTranslations = source[lang] || {}
      Object.keys(langTranslations).forEach(key => {
        const value = langTranslations[key]
        if (value !== undefined) {
          allTranslations[lang][key] = value
        }
      })
    })
    return allTranslations
  }

  // 检查翻译完整性（仅从远程数据）
  checkTranslationCompleteness() {
    if (!this.remoteTranslations) {
      return Object.fromEntries(
        Object.keys(LANGUAGES).map(lang => [lang, { total: 0, translated: 0, missing: [], percentage: 0 }])
      )
    }

    const allKeys = this.getTranslationKeys()
    const completeness = {}

    Object.keys(LANGUAGES).forEach(lang => {
      const langTranslations = this.remoteTranslations[lang] || {}
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
      completeness[lang] = {
        total,
        translated: translatedCount,
        missing: missingKeys,
        percentage: total > 0 ? Number(((translatedCount / total) * 100).toFixed(1)) : 0
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
export { i18n, I18nPlugin, I18nService, LANGUAGES }
export default i18n
