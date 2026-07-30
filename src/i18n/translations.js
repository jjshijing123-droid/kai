// ============================================================
// 翻译种子数据 — 从 JSON 种子文件加载（Vite 构建时自动包含）
// 前端不直接引用此文件，所有翻译通过 /api/i18n/translations 获取
// ============================================================
import seedData from './translations-seed.json'
export const baseTranslations = seedData

// 动态翻译对象 — 直接使用基础翻译，不再从 localStorage 加载
export let translations = { ...baseTranslations }

// 更新翻译对象（用于保存后更新）
export function updateTranslations(newTranslations) {
  Object.keys(newTranslations).forEach(lang => {
    if (!translations[lang]) {
      translations[lang] = {}
    }
    Object.assign(translations[lang], newTranslations[lang])
  })
}

// 重新加载翻译数据（用于保存后刷新）
export function reloadTranslations() {
  console.log('Reloading translations skipped, keeping existing data')
}

// 获取翻译函数
export function getTranslation(key, language = 'en') {
  const langTranslations = translations[language] || translations['en']
  return langTranslations[key] || key
}

// 获取所有翻译键
export function getTranslationKeys() {
  const keys = new Set()
  Object.keys(translations).forEach(lang => {
    Object.keys(translations[lang]).forEach(key => keys.add(key))
  })
  return Array.from(keys).sort()
}

// 语言配置
export const languages = {
  'en': { name: 'English', flag: '🇺🇸' },
  'zh-CN': { name: '中文', flag: '🇨🇳' }
}
