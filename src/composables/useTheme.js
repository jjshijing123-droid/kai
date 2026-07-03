import { ref, onMounted, onUnmounted } from 'vue'

const THEME_KEY = 'theme'

const currentTheme = ref('light')

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  const html = document.documentElement
  html.classList.remove('light', 'dark')
  html.classList.add(theme)
  localStorage.setItem(THEME_KEY, theme)
  currentTheme.value = theme
}

export function useTheme() {
  function initTheme() {
    const html = document.documentElement
    const existing = html.classList.contains('dark') ? 'dark' : html.classList.contains('light') ? 'light' : null
    if (existing) {
      currentTheme.value = existing
      return
    }
    const saved = localStorage.getItem(THEME_KEY)
    const system = getSystemTheme()
    const initial = (saved === 'light' || saved === 'dark') ? saved : system
    currentTheme.value = initial
    applyTheme(initial)
  }

  function toggleTheme(theme) {
    const newTheme = theme || (currentTheme.value === 'light' ? 'dark' : 'light')
    applyTheme(newTheme)
  }

  return {
    currentTheme,
    initTheme,
    applyTheme,
    toggleTheme
  }
}
