import { ref, onMounted, onBeforeUnmount, reactive } from 'vue'

/**
 * 快捷键管理系统
 */
export function useKeyboardShortcuts() {
  const shortcuts = reactive(new Map())
  const isEnabled = ref(true)
  let keydownListener = null

  /**
   * 注册快捷键
   */
  const register = (key, handler, options = {}) => {
    const shortcutKey = normalizeKey(key)
    
    shortcuts.set(shortcutKey, {
      handler,
      description: options.description || '',
      category: options.category || 'general',
      preventDefault: options.preventDefault !== false,
      stopPropagation: options.stopPropagation || false,
      enabled: options.enabled !== false
    })
    
    return () => unregister(shortcutKey)
  }

  /**
   * 注销快捷键
   */
  const unregister = (key) => {
    const shortcutKey = normalizeKey(key)
    shortcuts.delete(shortcutKey)
  }

  /**
   * 启用/禁用快捷键
   */
  const setEnabled = (enabled) => {
    isEnabled.value = enabled
  }

  /**
   * 检查是否有冲突
   */
  const hasConflict = (key, excludeKey = null) => {
    const shortcutKey = normalizeKey(key)
    
    for (const [registeredKey] of shortcuts) {
      if (registeredKey === shortcutKey && registeredKey !== excludeKey) {
        return true
      }
    }
    
    return false
  }

  /**
   * 获取所有快捷键
   */
  const getAllShortcuts = () => {
    const result = []
    
    for (const [key, shortcut] of shortcuts) {
      result.push({
        key,
        ...shortcut
      })
    }
    
    return result
  }

  /**
   * 按分类获取快捷键
   */
  const getShortcutsByCategory = (category) => {
    const result = []
    
    for (const [key, shortcut] of shortcuts) {
      if (shortcut.category === category) {
        result.push({
          key,
          ...shortcut
        })
      }
    }
    
    return result
  }

  /**
   * 标准化按键组合
   */
  const normalizeKey = (key) => {
    if (typeof key !== 'string') {
      throw new Error('Key must be a string')
    }
    
    // 处理特殊键名
    const specialKeys = {
      'space': ' ',
      'enter': 'Enter',
      'esc': 'Escape',
      'escape': 'Escape',
      'tab': 'Tab',
      'backspace': 'Backspace',
      'delete': 'Delete',
      'ins': 'Insert',
      'insert': 'Insert',
      'home': 'Home',
      'end': 'End',
      'pageup': 'PageUp',
      'pagedown': 'PageDown',
      'left': 'ArrowLeft',
      'right': 'ArrowRight',
      'up': 'ArrowUp',
      'down': 'ArrowDown'
    }
    
    // 标准化按键名
    key = key.toLowerCase()
    key = specialKeys[key] || key
    
    // 处理组合键
    const parts = key.split('+').map(part => part.trim())
    const modifiers = []
    const mainKey = []
    
    parts.forEach(part => {
      if (['ctrl', 'alt', 'shift', 'meta', 'cmd'].includes(part)) {
        if (part === 'cmd') modifiers.push('Meta')
        else modifiers.push(part.charAt(0).toUpperCase() + part.slice(1))
      } else {
        mainKey.push(part)
      }
    })
    
    // 构建标准化的按键字符串
    const normalizedParts = [...modifiers, ...mainKey]
    return normalizedParts.join('+')
  }

  /**
   * 处理按键事件
   */
  const handleKeyDown = (event) => {
    if (!isEnabled.value) return
    
    // 构建当前按键组合
    const parts = []
    if (event.ctrlKey) parts.push('Control')
    if (event.altKey) parts.push('Alt')
    if (event.shiftKey) parts.push('Shift')
    if (event.metaKey) parts.push('Meta')
    parts.push(event.key)
    
    const currentKey = parts.join('+')
    
    // 查找匹配的快捷键
    const shortcut = shortcuts.get(currentKey)
    if (shortcut && shortcut.enabled) {
      if (shortcut.preventDefault) {
        event.preventDefault()
      }
      if (shortcut.stopPropagation) {
        event.stopPropagation()
      }
      
      // 执行处理器
      try {
        shortcut.handler(event)
      } catch (error) {
        console.error('Error executing keyboard shortcut:', error)
      }
    }
  }

  /**
   * 挂载事件监听器
   */
  const mount = () => {
    if (!keydownListener) {
      keydownListener = handleKeyDown
      document.addEventListener('keydown', keydownListener)
    }
  }

  /**
   * 卸载事件监听器
   */
  const unmount = () => {
    if (keydownListener) {
      document.removeEventListener('keydown', keydownListener)
      keydownListener = null
    }
  }



  return {
    register,
    unregister,
    setEnabled,
    hasConflict,
    getAllShortcuts,
    getShortcutsByCategory,
    mount,
    unmount,
    isEnabled
  }
}

/**
 * 预设的快捷键集合
 */
export const CommonShortcuts = {
  // 通用操作
  save: 'ctrl+s',
  copy: 'ctrl+c',
  paste: 'ctrl+v',
  cut: 'ctrl+x',
  selectAll: 'ctrl+a',
  undo: 'ctrl+z',
  redo: 'ctrl+shift+z',
  
  // 导航
  escape: 'Escape',
  focusSearch: 'ctrl+f',
  focusCommand: 'ctrl+k',
  nextTab: 'ctrl+tab',
  prevTab: 'ctrl+shift+tab',
  
  // 文件操作
  newFile: 'ctrl+n',
  openFile: 'ctrl+o',
  closeTab: 'ctrl+w',
  refresh: 'f5',
  
  // 开发调试
  toggleDevTools: 'f12',
  console: 'ctrl+shift+j',
  elements: 'ctrl+shift+c',
  
  // 国际化
  switchLanguage: 'ctrl+l',
  
  // 主题切换
  toggleTheme: 'ctrl+shift+t'
}

/**
 * 快捷键注册器
 * 用于管理和注册应用程序的快捷键
 */
// 全局快捷键实例
let globalKeyboardShortcuts = null

/**
 * 获取全局快捷键实例
 */
export function getGlobalKeyboardShortcuts() {
  if (!globalKeyboardShortcuts) {
    globalKeyboardShortcuts = useKeyboardShortcuts()
  }
  return globalKeyboardShortcuts
}

/**
 * 注册通用快捷键
 */
export function registerCommonShortcuts() {
  const { register } = getGlobalKeyboardShortcuts()
  
  const categories = {
    navigation: 'navigation',
    editing: 'editing',
    file: 'file',
    view: 'view',
    developer: 'developer',
    system: 'system'
  }
  
  // 保存
  register(CommonShortcuts.save, () => {
    // 触发保存操作
    document.dispatchEvent(new CustomEvent('shortcut:save'))
  }, {
    description: '保存当前文档',
    category: categories.file
  })
  
  // 复制
  register(CommonShortcuts.copy, (e) => {
    if (document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA') {
      return // 不在输入框中处理
    }
    document.execCommand('copy')
  }, {
    description: '复制选中文本',
    category: categories.editing
  })
  
  // 粘贴
  register(CommonShortcuts.paste, (e) => {
    if (document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA') {
      return // 不在输入框中处理
    }
    document.execCommand('paste')
  }, {
    description: '粘贴文本',
    category: categories.editing
  })
  
  // 取消/关闭
  register(CommonShortcuts.escape, () => {
    // 触发取消操作
    document.dispatchEvent(new CustomEvent('shortcut:escape'))
  }, {
    description: '取消当前操作或关闭对话框',
    category: categories.navigation
  })
  
  // 搜索
  register(CommonShortcuts.focusSearch, () => {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="搜索"], input[placeholder*="search"]')
    if (searchInput) {
      searchInput.focus()
    } else {
      document.dispatchEvent(new CustomEvent('shortcut:search'))
    }
  }, {
    description: '聚焦到搜索框',
    category: categories.navigation
  })
  
  // 主题切换
  register(CommonShortcuts.toggleTheme, () => {
    document.dispatchEvent(new CustomEvent('shortcut:toggle-theme'))
  }, {
    description: '切换深色/浅色主题',
    category: categories.view
  })
  
  // 语言切换
  register(CommonShortcuts.switchLanguage, () => {
    document.dispatchEvent(new CustomEvent('shortcut:switch-language'))
  }, {
    description: '切换界面语言',
    category: categories.view
  })
}

/**
 * 注册产品管理相关快捷键
 */
export function registerProductShortcuts() {
  const { register } = getGlobalKeyboardShortcuts()
  
  const categories = {
    navigation: 'navigation',
    editing: 'editing',
    file: 'file',
    view: 'view',
    developer: 'developer',
    system: 'system'
  }
  
  // 新建产品
  register('ctrl+shift+n', () => {
    document.dispatchEvent(new CustomEvent('shortcut:new-product'))
  }, {
    description: '新建产品',
    category: categories.file
  })
  
  // 编辑产品
  register('ctrl+e', () => {
    document.dispatchEvent(new CustomEvent('shortcut:edit-product'))
  }, {
    description: '编辑选中产品',
    category: categories.editing
  })
  
  // 删除产品
  register('ctrl+delete', () => {
    document.dispatchEvent(new CustomEvent('shortcut:delete-product'))
  }, {
    description: '删除选中产品',
    category: categories.editing
  })
  
  // 批量操作
  register('ctrl+b', () => {
    document.dispatchEvent(new CustomEvent('shortcut:batch-operation'))
  }, {
    description: '批量操作',
    category: categories.editing
  })
  
  // 3D 视图
  register('ctrl+3', () => {
    document.dispatchEvent(new CustomEvent('shortcut:toggle-3d-view'))
  }, {
    description: '切换 3D 视图',
    category: categories.view
  })
  
  // 列表视图
  register('ctrl+1', () => {
    document.dispatchEvent(new CustomEvent('shortcut:list-view'))
  }, {
    description: '列表视图',
    category: categories.view
  })
}

/**
 * 创建快捷键目录组件（兼容旧代码）
 */
export function createShortcutRegistry() {
  const keyboardShortcuts = getGlobalKeyboardShortcuts()
  
  return {
    registerCommonShortcuts,
    registerProductShortcuts,
    categories: {
      navigation: 'navigation',
      editing: 'editing',
      file: 'file',
      view: 'view',
      developer: 'developer',
      system: 'system'
    },
    getShortcutsByCategory: keyboardShortcuts.getShortcutsByCategory,
    mount: keyboardShortcuts.mount,
    unmount: keyboardShortcuts.unmount
  }
}

export default {
  useKeyboardShortcuts,
  CommonShortcuts,
  createShortcutRegistry
}