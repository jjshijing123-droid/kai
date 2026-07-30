/**
 * 多语言服务 — 完全由 SQLite 数据库驱动
 *
 * 翻译数据来源：
 *   - 启动时从 /api/i18n/translations 加载（SQLite 存储）
 *   - 运行时通过管理面板修改后实时生效
 *   - src/i18n/translations.js 仅作为种子数据源，由后端在首次启动时自动导入
 *
 * 注意：此文件不再从 translations.js 导入任何数据，所有翻译必须通过 API 获取
 */

import { reactive, readonly } from 'vue'

// 支持的语言列表
const LANGUAGES = {
  'en': { name: 'English', flag: '🇺🇸' },
  'zh-CN': { name: '中文', flag: '🇨🇳' }
}

/**
 * 响应式翻译状态 — 模块级别，Vue 直接追踪
 * 将 ref 放在 reactive 容器中，确保 Vue Proxy 能正确拦截 .value 访问
 */
const state = reactive({
  currentLanguage: 'en',
  remoteTranslations: null,  // { en: { key: value }, 'zh-CN': { ... } }
  _ready: false
})

class I18nService {
  constructor() {
    this.listeners = new Set()
    this._loadPromise = null

    // 启动时自动加载翻译数据
    this.init()
  }

  // 初始化 — 读取语言偏好并启动数据加载
  init() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem('preferredLanguage')
      const browserLang = this.getBrowserLanguage()

      if (savedLang && LANGUAGES[savedLang]) {
        state.currentLanguage = savedLang
      } else {
        state.currentLanguage = browserLang
        localStorage.setItem('preferredLanguage', state.currentLanguage)
      }
    }

    // 后台加载翻译数据（不阻塞启动）
    this.loadTranslationsFromApi().catch(err => {
      console.error('❌ 加载翻译数据失败:', err)
    })
  }

  // 从后端 API 加载翻译数据
  async loadTranslationsFromApi() {
    if (this._loadPromise) return this._loadPromise

    this._loadPromise = fetch('/api/i18n/translations')
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const result = await response.json()
        if (result.success && result.data) {
          state.remoteTranslations = result.data
          state._ready = true
          console.log('✅ 翻译数据已从 API 加载（SQLite 存储），共', this.getTranslationKeys().length, '个键')
        } else {
          throw new Error('API 返回数据格式异常')
        }
      })
      .catch(error => {
        console.error('❌ 加载翻译数据失败:', error)
        state._ready = false
        throw error
      })
      .finally(() => {
        this._loadPromise = null
      })

    return this._loadPromise
  }

  // 获取浏览器语言
  getBrowserLanguage() {
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language || navigator.userLanguage
      return browserLang.startsWith('zh') ? 'zh-CN' : 'en'
    }
    return 'en'
  }

  // 翻译函数
  // 读取 state.remoteTranslations，Vue 的 Proxy 会追踪此依赖。
  // API 数据加载完成后 state.remoteTranslations 变化 → Vue 自动重渲染
  t(key, params = {}, lang) {
    const targetLang = lang || state.currentLanguage
    const translations = state.remoteTranslations

    if (!translations || !translations[targetLang]) {
      // 数据未就绪时返回 key 本身，等 API 加载完成后自动重渲染
      return key
    }

    let text = translations[targetLang][key]
    if (text === undefined) return key

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
    if (!LANGUAGES[lang]) return false
    state.currentLanguage = lang
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('preferredLanguage', lang)
    }
    this.notifyListeners()
    return true
  }

  // 切换语言
  toggleLanguage() {
    const newLang = state.currentLanguage === 'zh-CN' ? 'en' : 'zh-CN'
    return this.setLanguage(newLang)
  }

  // 获取当前语言
  getCurrentLanguage() {
    return state.currentLanguage
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
    return state._ready && !!state.remoteTranslations
  }

  // 添加翻译监听器
  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // 通知监听器
  notifyListeners() {
    this.listeners.forEach(callback => callback(state.currentLanguage))
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
    if (!state.remoteTranslations) return []
    const keys = new Set()
    Object.keys(state.remoteTranslations).forEach(lang => {
      Object.keys(state.remoteTranslations[lang]).forEach(key => keys.add(key))
    })
    return Array.from(keys).sort()
  }

  // 获取所有翻译数据（仅从远程数据）
  getAllTranslations() {
    const allTranslations = {}
    const source = state.remoteTranslations || {}

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
    if (!state.remoteTranslations) {
      return Object.fromEntries(
        Object.keys(LANGUAGES).map(lang => [lang, { total: 0, translated: 0, missing: [], percentage: 0 }])
      )
    }

    const allKeys = this.getTranslationKeys()
    const completeness = {}

    Object.keys(LANGUAGES).forEach(lang => {
      const langTranslations = state.remoteTranslations[lang] || {}
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
    // 提供响应式 state 和 i18n 实例
    app.provide('i18nState', readonly(state))
    app.provide('i18n', i18n)
  }
}

// 导出响应式 state（供 composable 和组件直接使用）
export { state }
// 导出实例
export { i18n, I18nPlugin, I18nService, LANGUAGES }
export default i18n
