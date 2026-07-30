import { ref, computed, onUnmounted, unref } from 'vue'
import i18n, { state as i18nState } from '../i18n/index.js'

// 现代化的多语言 composable - 统一使用 I18nService
export function useI18n() {
  // currentLanguage 使用 computed 保持响应式 — Vue 模板中自动解包为字符串
  const currentLanguage = computed(() => i18nState.currentLanguage)

  // 监听语言变化 - 确保响应式更新
  const unsubscribe = i18n.addListener((lang) => {
    currentLanguage.value = lang
  })

  // 翻译函数 — 普通函数（非 computed）
  // i18n.t() 内部读取 reactive state，Vue 自动追踪依赖
  // API 数据加载后 state.remoteTranslations 变化 → Vue 重渲染
  function t(key, params = {}, lang) {
    return i18n.t(key, params, lang)
  }

  // 计算属性：支持的语言列表
  const availableLanguages = computed(() => i18n.getLanguages())

  // 计算属性：翻译完整性检查
  const translationCompleteness = computed(() => i18n.checkTranslationCompleteness())

  // 设置语言
  const setLanguage = (lang) => {
    const result = i18n.setLanguage(lang)
    if (result) {
      currentLanguage.value = lang
    }
    return result
  }

  // 切换语言
  const toggleLanguage = () => {
    return i18n.toggleLanguage()
  }

  // 批量添加翻译
  const addTranslations = (newTranslations) => i18n.addTranslations(newTranslations)

  // 更新单个翻译
  const updateTranslation = (lang, key, value) => i18n.updateTranslation(lang, key, value)

  // 删除翻译
  const deleteTranslation = (key) => i18n.deleteTranslation(key)

  // 获取所有翻译键
  const getTranslationKeys = () => i18n.getTranslationKeys()

  // 添加监听器方法
  const addListener = (callback) => i18n.addListener(callback)

  // 在组件卸载时清理监听器
  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
  })

  return {
    // 响应式状态
    currentLanguage,
    availableLanguages,
    translationCompleteness,

    // 方法
    t,
    setLanguage,
    toggleLanguage,
    addTranslations,
    updateTranslation,
    deleteTranslation,
    getTranslationKeys,
    addListener,

    // 快捷方法 — 使用 unref 兼容模板和 JS 调用
    isLanguage: (lang) => unref(currentLanguage) === lang,
    formatNumber: (number) => new Intl.NumberFormat(unref(currentLanguage)).format(number),
    formatDate: (date, options = {}) => new Intl.DateTimeFormat(unref(currentLanguage), options).format(date),
    formatCurrency: (amount, currency = 'USD') =>
      new Intl.NumberFormat(unref(currentLanguage), {
        style: 'currency',
        currency: currency
      }).format(amount)
  }
}

// 快捷使用方式
export function useT() {
  const { t } = useI18n()
  return t
}

// 语言切换专用 composable
export function useLanguageSwitcher() {
  const { currentLanguage, availableLanguages, setLanguage, toggleLanguage } = useI18n()

  return {
    currentLanguage,
    availableLanguages,
    setLanguage,
    toggleLanguage
  }
}
