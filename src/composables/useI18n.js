import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import i18n from '../i18n/index.js'

// 现代化的多语言 composable - 统一使用 I18nManager
export function useI18n() {
  const currentLanguage = ref(i18n.getCurrentLanguage())
  // 用于触发翻译完整性重新计算的响应式触发器
  const completenessTrigger = ref(0)

  // 监听语言变化 - 确保响应式更新
  const unsubscribe = i18n.addListener((lang) => {
    console.log('Language changed to:', lang)
    currentLanguage.value = lang
    // 语言变化时，触发翻译完整性重新计算
    completenessTrigger.value++
  })

  // 计算属性：支持的语言列表
  const availableLanguages = computed(() => i18n.getLanguages())

  // 计算属性：翻译完整性检查
  const translationCompleteness = computed(() => {
    // 依赖于 completenessTrigger，确保每次 completenessTrigger 更新时都会重新计算
    completenessTrigger.value
    return i18n.checkTranslationCompleteness()
  })

  // 创建响应式翻译函数
  const t = (key, params = {}, lang) => {
    const currentLang = lang || currentLanguage.value
    return i18n.t(key, params, currentLang)
  }

  // 设置语言
  const setLanguage = (lang) => {
    const result = i18n.setLanguage(lang)
    if (result) {
      // 立即更新当前语言状态
      currentLanguage.value = lang
    }
    return result
  }

  // 切换语言
  const toggleLanguage = () => {
    const result = i18n.toggleLanguage()
    if (result) {
      // 立即更新当前语言状态
      currentLanguage.value = i18n.getCurrentLanguage()
    }
    return result
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

  // 触发翻译完整性重新计算的方法
  const refreshCompleteness = () => {
    completenessTrigger.value++
  }

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
    refreshCompleteness,
    
    // 快捷方法
    isLanguage: (lang) => currentLanguage.value === lang,
    formatNumber: (number) => new Intl.NumberFormat(currentLanguage.value).format(number),
    formatDate: (date, options = {}) => new Intl.DateTimeFormat(currentLanguage.value, options).format(date),
    formatCurrency: (amount, currency = 'USD') =>
      new Intl.NumberFormat(currentLanguage.value, {
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
