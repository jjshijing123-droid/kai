import { defineStore } from 'pinia'
import { ref } from 'vue'

const THEME_KEY = 'theme'

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * 主题管理 Store
 * 使用 CSS class 切换实现亮色/暗色主题
 */
export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref('light')

  function applyTheme(theme) {
    const html = document.documentElement
    html.classList.remove('light', 'dark')
    html.classList.add(theme)
    localStorage.setItem(THEME_KEY, theme)
    currentTheme.value = theme
  }

  function initTheme() {
    const html = document.documentElement
    const existing = html.classList.contains('dark')
      ? 'dark'
      : html.classList.contains('light')
        ? 'light'
        : null
    if (existing) {
      currentTheme.value = existing
      return
    }
    const saved = localStorage.getItem(THEME_KEY)
    const system = getSystemTheme()
    const initial = (saved === 'light' || saved === 'dark') ? saved : system
    applyTheme(initial)
  }

  function toggleTheme(theme) {
    const newTheme = theme || (currentTheme.value === 'light' ? 'dark' : 'light')
    applyTheme(newTheme)
  }

  return { currentTheme, initTheme, applyTheme, toggleTheme }
})
