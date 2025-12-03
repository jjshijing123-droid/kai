<template>
  <div v-if="visible" class="shortcut-help-modal" @click="handleOverlayClick">
    <div class="shortcut-help-content" @click.stop>
      <div class="shortcut-help-header">
        <h3>{{ $t('shortcut.help.title') }}</h3>
        <button class="shortcut-help-close" @click="close">
          <LucideIcon name="X" size="20" />
        </button>
      </div>
      
      <div class="shortcut-help-body">
        <div class="shortcut-help-search">
          <input
            v-model="searchQuery"
            :placeholder="$t('shortcut.help.searchPlaceholder')"
            class="shortcut-help-search-input"
          />
        </div>
        
        <div class="shortcut-help-tabs">
          <button
            v-for="category in categories"
            :key="category.key"
            :class="['shortcut-help-tab', { active: activeCategory === category.key }]"
            @click="activeCategory = category.key"
          >
            {{ category.label }}
          </button>
        </div>
        
        <div class="shortcut-help-list">
          <div
            v-for="shortcut in filteredShortcuts"
            :key="shortcut.key"
            class="shortcut-help-item"
          >
            <div class="shortcut-help-description">
              {{ shortcut.description }}
            </div>
            <div class="shortcut-help-keys">
              <kbd
                v-for="(key, index) in formatKeys(shortcut.key)"
                :key="index"
                class="shortcut-help-key"
              >
                {{ key }}
              </kbd>
            </div>
          </div>
          
          <div v-if="filteredShortcuts.length === 0" class="shortcut-help-empty">
            {{ $t('shortcut.help.noResults') }}
          </div>
        </div>
      </div>
      
      <div class="shortcut-help-footer">
        <div class="shortcut-help-tip">
          <LucideIcon name="Info" size="16" />
          <span>{{ $t('shortcut.help.tip') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useKeyboardShortcuts, createShortcutRegistry } from '../../composables/useKeyboardShortcuts'
import LucideIcon from './LucideIcon.vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close'])

// 响应式数据
const searchQuery = ref('')
const activeCategory = ref('navigation')
const shortcuts = ref([])

// 快捷键管理
const { getShortcutsByCategory } = createShortcutRegistry()
const { register, setEnabled } = useKeyboardShortcuts()

// 分类定义
const categories = [
  { key: 'navigation', label: '导航' },
  { key: 'editing', label: '编辑' },
  { key: 'file', label: '文件' },
  { key: 'view', label: '视图' },
  { key: 'developer', label: '开发' },
  { key: 'system', label: '系统' }
]

// 过滤后的快捷键
const filteredShortcuts = computed(() => {
  const categoryShortcuts = getShortcutsByCategory(activeCategory.value)
  
  if (!searchQuery.value) {
    return categoryShortcuts
  }
  
  const query = searchQuery.value.toLowerCase()
  return categoryShortcuts.filter(shortcut => 
    shortcut.description.toLowerCase().includes(query) ||
    shortcut.key.toLowerCase().includes(query)
  )
})

// 格式化按键显示
const formatKeys = (keyString) => {
  return keyString.split('+').map(key => {
    const keyMap = {
      'Control': 'Ctrl',
      'Alt': 'Alt',
      'Shift': 'Shift',
      'Meta': 'Cmd',
      ' ': 'Space',
      'Enter': 'Enter',
      'Escape': 'Esc',
      'Tab': 'Tab',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'PageUp': 'Page Up',
      'PageDown': 'Page Down',
      'Home': 'Home',
      'End': 'End'
    }
    return keyMap[key] || key.toUpperCase()
  })
}

// 关闭对话框
const close = () => {
  emit('close')
}

// 点击遮罩关闭
const handleOverlayClick = () => {
  close()
}

// 初始化预设快捷键
const initializeShortcuts = () => {
  const { registerCommonShortcuts, registerProductShortcuts } = createShortcutRegistry()
  
  registerCommonShortcuts()
  registerProductShortcuts()
  
  // 更新快捷键列表
  updateShortcutsList()
}

// 更新快捷键列表
const updateShortcutsList = () => {
  const allShortcuts = []
  categories.forEach(category => {
    const categoryShortcuts = getShortcutsByCategory(category.key)
    allShortcuts.push(...categoryShortcuts)
  })
  shortcuts.value = allShortcuts
}

// 处理快捷键事件
const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.visible) {
    close()
  }
  
  if (event.key === '?' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    close()
  }
  
  if (event.key >= 'A' && event.key <= 'Z' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    // 在搜索框聚焦时，让字母键正常输入
    const activeElement = document.activeElement
    if (activeElement && activeElement.tagName === 'INPUT') {
      return
    }
    
    // 在帮助对话框中，允许字母键进行搜索
    if (props.visible) {
      event.preventDefault()
      const searchInput = document.querySelector('.shortcut-help-search-input')
      if (searchInput) {
        searchInput.focus()
        searchInput.value += event.key.toLowerCase()
        searchQuery.value = searchInput.value
      }
    }
  }
}

// 生命周期钩子
onMounted(() => {
  initializeShortcuts()
  document.addEventListener('keydown', handleKeydown)
  
  // 禁用页面其他快捷键
  setEnabled(false)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  setEnabled(true)
})

// 监听对话框显示状态
watch(() => props.visible, (visible) => {
  setEnabled(!visible)
  
  if (visible) {
    // 重置搜索
    searchQuery.value = ''
    activeCategory.value = 'navigation'
    
    // 聚焦搜索框
    setTimeout(() => {
      const searchInput = document.querySelector('.shortcut-help-search-input')
      if (searchInput) {
        searchInput.focus()
      }
    }, 100)
  }
})
</script>

<style scoped>
.shortcut-help-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.shortcut-help-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.shortcut-help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.shortcut-help-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.shortcut-help-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  color: #8c8c8c;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shortcut-help-close:hover {
  background: #f5f5f5;
  color: #595959;
}

.shortcut-help-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.shortcut-help-search {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.shortcut-help-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.shortcut-help-search-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.shortcut-help-tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f0;
  overflow-x: auto;
}

.shortcut-help-tab {
  background: none;
  border: none;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #595959;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.shortcut-help-tab:hover {
  color: #262626;
}

.shortcut-help-tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.shortcut-help-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.shortcut-help-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  transition: background-color 0.2s;
}

.shortcut-help-item:hover {
  background: #fafafa;
}

.shortcut-help-description {
  flex: 1;
  font-size: 14px;
  color: #262626;
  margin-right: 16px;
}

.shortcut-help-keys {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.shortcut-help-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  color: #595959;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.shortcut-help-empty {
  text-align: center;
  padding: 40px 24px;
  color: #8c8c8c;
  font-size: 14px;
}

.shortcut-help-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.shortcut-help-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #8c8c8c;
}

/* 深色主题 */
.dark .shortcut-help-content {
  background: #1f1f1f;
  color: #f0f0f0;
}

.dark .shortcut-help-header {
  border-bottom-color: #333333;
}

.dark .shortcut-help-header h3 {
  color: #f0f0f0;
}

.dark .shortcut-help-close:hover {
  background: #333333;
  color: #f0f0f0;
}

.dark .shortcut-help-search {
  border-bottom-color: #333333;
}

.dark .shortcut-help-search-input {
  background: #262626;
  border-color: #404040;
  color: #f0f0f0;
}

.dark .shortcut-help-tabs {
  border-bottom-color: #333333;
}

.dark .shortcut-help-tab {
  color: #a6a6a6;
}

.dark .shortcut-help-tab:hover {
  color: #f0f0f0;
}

.dark .shortcut-help-item:hover {
  background: #262626;
}

.dark .shortcut-help-description {
  color: #f0f0f0;
}

.dark .shortcut-help-key {
  background: #333333;
  border-color: #404040;
  color: #a6a6a6;
}

.dark .shortcut-help-footer {
  border-top-color: #333333;
  background: #262626;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .shortcut-help-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .shortcut-help-header,
  .shortcut-help-search,
  .shortcut-help-footer {
    padding: 16px 20px;
  }
  
  .shortcut-help-item {
    padding: 10px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .shortcut-help-description {
    margin-right: 0;
  }
  
  .shortcut-help-keys {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .shortcut-help-tabs {
    padding: 0 16px;
  }
  
  .shortcut-help-tab {
    padding: 10px 12px;
    font-size: 13px;
  }
  
  .shortcut-help-search {
    padding: 12px 16px;
  }
  
  .shortcut-help-item {
    padding: 8px 16px;
  }
}
</style>