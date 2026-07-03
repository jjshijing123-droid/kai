import { useThemeStore } from '../stores/themeStore'

/**
 * @deprecated 请使用 useThemeStore 代替
 * 保留此文件仅为向后兼容，新代码请直接 import { useThemeStore } from '@/stores/themeStore'
 */
export function useTheme() {
  const store = useThemeStore()
  return {
    currentTheme: store.currentTheme,
    initTheme: store.initTheme,
    applyTheme: store.applyTheme,
    toggleTheme: store.toggleTheme
  }
}
