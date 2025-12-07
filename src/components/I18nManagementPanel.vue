<template>
  <div class="i18n-manager">
    <!-- 管理员内容 -->
    <div v-if="isAdminLoggedIn" class="admin-content">
      <!-- 页面头部 -->
      <div class="page-header">
        <!-- Frame 348 -->
        <div class="frame348">
          <div class="frame335">
            <Button @click="goBack" variant="text" class="back-button">
              <LucideIcon name="ChevronLeft" class="h-4 w-4" />
            </Button>
            <h1 class="page-title">{{ t('i18nManager_title') }}</h1>
          </div>
          <div class="header-actions">
            <Button @click="exportTranslations" variant="secondary" class="refresh-button">
              <LucideIcon name="Upload" class="h-4 w-4" />
              {{ t('i18nManager_export') }}
            </Button>
            <Button @click="saveAllTranslations" :loading="saving" variant="primary" class="refresh-button">
              <LucideIcon name="Save" class="h-4 w-4" />
              {{ t('i18nManager_saveAll') }}
            </Button>
          </div>
        </div>
      </div>

      <!-- 翻译完整性概览 -->
      <div class="rounded-lg border bg-card text-card-foreground shadow-sm completeness-section p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">{{ t('i18nManager_completeness') }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            v-for="lang in availableLanguages"
            :key="lang.code"
            :class="{ 'ring-2 ring-primary': lang.code === currentLanguage }"
            class="rounded-md border p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex justify-between items-center mb-3">
              <div class="flex items-center gap-2">
                <span class="text-xl">{{ lang.flag }}</span>
                <span class="font-medium">{{ lang.name }}</span>
              </div>
              <Badge 
                v-if="lang.code === currentLanguage" 
                variant="default"
              >
                {{ currentLanguage === 'zh-CN' ? '当前' : 'Current' }}
              </Badge>
            </div>
            
            <div class="mb-3">
              <div class="flex justify-between text-sm mb-1">
                <span>{{ t('i18nManager_completeness') }}</span>
                <span class="font-medium">{{ translationCompleteness[lang.code]?.percentage || 0 }}%</span>
              </div>
              <Progress
                :percent="translationCompleteness[lang.code]?.percentage || 0"
                :stroke-color="getProgressColor(translationCompleteness[lang.code]?.percentage || 0)"
                size="small"
              />
              <div class="text-xs text-muted-foreground mt-1">
                {{ translationCompleteness[lang.code]?.translated || 0 }}/{{ translationCompleteness[lang.code]?.total || 0 }} {{ t('i18nManager_keys') }}
              </div>
            </div>
            
            <div class="flex flex-wrap gap-2">
              <Badge 
                v-if="translationCompleteness[lang.code]?.quality" 
                variant="success"
                size="small"
              >
                {{ currentLanguage === 'zh-CN' ? '质量' : 'Quality' }}: {{ translationCompleteness[lang.code]?.quality }}%
              </Badge>
              
              <Badge 
                v-if="translationCompleteness[lang.code]?.needsReview?.length" 
                variant="warning"
                size="small"
              >
                {{ currentLanguage === 'zh-CN' ? '需要审核' : 'Needs Review' }}: {{ translationCompleteness[lang.code]?.needsReview?.length }}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <!-- 需要审核的翻译 -->
      <Card
        v-if="hasTranslationsNeedingReview"
        :title="currentLanguage === 'zh-CN' ? '需要审核的翻译' : 'Translations Needing Review'"
        class="review-section"
      >
        <div class="review-grid">
          <Card
            v-for="lang in availableLanguages"
            :key="lang.code"
            v-if="translationCompleteness[lang.code]?.needsReview?.length"
            size="small"
            :bordered="false"
            class="review-card"
          >
            <template #header>
              <div class="review-header">
                <span class="flag">{{ lang.flag }}</span>
                <span class="lang-name">{{ lang.name }}</span>
                <Badge 
                  :count="translationCompleteness[lang.code]?.needsReview?.length"
                  :number-style="{ backgroundColor: '#ff4d4f' }"
                />
              </div>
            </template>
            
            <div class="review-list">
              <div
                v-for="item in translationCompleteness[lang.code]?.needsReview?.slice(0, 3)"
                :key="item.key"
                class="review-item"
              >
                <div class="review-content">
                  <div class="review-key">
                    <code>{{ item.key }}</code>
                  </div>
                  <div class="review-value">{{ item.value }}</div>
                  <div class="review-reason">
                    <Badge color="red" size="small">{{ item.reason }}</Badge>
                  </div>
                </div>
              </div>
              
              <div v-if="translationCompleteness[lang.code]?.needsReview?.length > 3" class="review-more">
                <span class="secondary-text">
                  {{ currentLanguage === 'zh-CN' ? '还有' : 'More' }} {{ translationCompleteness[lang.code]?.needsReview?.length - 3 }} {{ currentLanguage === 'zh-CN' ? '项' : 'items' }} {{ currentLanguage === 'zh-CN' ? '需要审核...' : 'need review...' }}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      <!-- 翻译表格 -->
      <Card class="translations-section">
        <div class="card-header">
          <h3 class="card-title">{{ t('i18nManager_allTranslations') }}</h3>
          <div class="card-extra">
            <Input
              v-model="searchTerm"
              :placeholder="t('i18nManager_search')"
              style="width: 250px"
              size="small"
            />
          </div>
        </div>

        <div class="translations-table-container">
          <Table
            :data-source="filteredKeys.map(key => ({ key }))"
            :columns="tableColumns"
            :pagination="false"
            size="small"
            class="translations-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'key'">
                <code class="translation-key">{{ record.key }}</code>
              </template>
              
              <template v-else-if="column.dataIndex === 'actions'">
                <div class="action-buttons">
                  <Button
                    variant="text"
                    size="small"
                    @click="handleDeleteTranslation(record.key)"
                    class="danger"
                  >
                    <LucideIcon name="Trash2" size="16" />
                    {{ t('i18nManager_delete') }}
                  </Button>
                </div>
              </template>
              
              <template v-else>
                <div v-if="isEditing(record.key, column.dataIndex)" class="editing-cell">
                  <Input
                    v-model="editingValues[`${column.dataIndex}_${record.key}`]"
                    :placeholder="getPlaceholder(record.key, column.dataIndex)"
                    size="small"
                    @blur="commitTranslation(column.dataIndex, record.key)"
                    @keydown.enter="commitTranslation(column.dataIndex, record.key)"
                    autofocus
                  />
                </div>
                <div v-else class="display-cell" @click="startEditing(record.key, column.dataIndex)">
                  <span class="translation-text">
                    <template v-if="getTranslationValue(column.dataIndex, record.key)">
                      {{ getTranslationValue(column.dataIndex, record.key) }}
                    </template>
                    <template v-else>
                      <span class="placeholder-text">{{ getPlaceholder(record.key, column.dataIndex) }}</span>
                    </template>
                  </span>
                  <LucideIcon name="Edit3" class="edit-icon" size="14" />
                </div>
              </template>
            </template>
          </Table>
        </div>
        
        <!-- 添加新翻译 -->
        <Card 
          :title="currentLanguage === 'zh-CN' ? '添加新翻译' : 'Add New Translation'" 
          class="add-translation-section" 
          size="small"
        >
          <div class="add-form">
            <div class="form-row">
              <div class="form-item full-width">
                <label class="form-label">{{ currentLanguage === 'zh-CN' ? '翻译键' : 'Translation Key' }}</label>
                <Input
                  v-model="newKey"
                  :placeholder="t('i18nManager_newKey')"
                  size="small"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div
                v-for="lang in availableLanguages"
                :key="lang.code"
                class="form-item"
              >
                <label class="form-label">{{ `${lang.flag} ${lang.name}` }}</label>
                <Input
                  v-model="newTranslations[lang.code]"
                  :placeholder="t('i18nManager_newTranslation')"
                  size="small"
                />
              </div>
            </div>
            
            <div class="form-actions">
              <Button
                @click="addTranslation"
                :disabled="!newKey"
                variant="primary"
                block
              >
                <LucideIcon name="Plus" size="16" />
                {{ t('i18nManager_add') }}
              </Button>
            </div>
          </div>
        </Card>
      </Card>
    </div>
  </div>

  <!-- 登录模态框 -->
  <AdminLoginModal
    v-model:open="showLoginModal"
    @login-success="handleLoginSuccess"
  />
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import i18n from '../i18n/index.js'
import { useI18n } from '../composables/useI18n.js'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import { translations, getTranslationKeys as getAllTranslationKeys } from '../i18n/translations.js'
import AdminLoginModal from './AdminLoginModal.vue'
import Button from './ui/button.vue'
import Card from './ui/card.vue'
import Input from './ui/input.vue'
import Progress from './ui/progress.vue'
import Badge from './ui/badge.vue'
import Table from './ui/table.vue'
import LucideIcon from './ui/LucideIcon.vue'

// 全局消息提示
const showMessage = (type, text) => {
  const messageDiv = document.createElement('div')
  messageDiv.className = `message-${type}`
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
    padding: 12px 20px;
    border-radius: 10px;
    color: white;
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    max-width: 400px;
    word-wrap: break-word;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    opacity: 0;
  `
  
  if (type === 'warning') {
    messageDiv.style.backgroundColor = 'var(--orange-8)'
  } else if (type === 'error') {
    messageDiv.style.backgroundColor = 'var(--red-9)'
  } else if (type === 'success') {
    messageDiv.style.backgroundColor = 'var(--green-8)'
  } else {
    messageDiv.style.backgroundColor = 'var(--primary-8)'
  }
  
  messageDiv.textContent = text
  document.body.appendChild(messageDiv)
  
  // 入场动画
  setTimeout(() => {
    messageDiv.style.opacity = '1'
    messageDiv.style.transform = 'translateX(-50%) translateY(0)'
  }, 10)
  
  // 3秒后自动移除
  setTimeout(() => {
    messageDiv.style.opacity = '0'
    messageDiv.style.transform = 'translateX(-50%) translateY(-100%)'
    setTimeout(() => {
      if (messageDiv.parentNode) {
        document.body.removeChild(messageDiv)
      }
    }, 300)
  }, 3000)
}

// 使用实际的 i18n 数据
const { currentLanguage, availableLanguages, translationCompleteness, t, getTranslationKeys, addTranslations, updateTranslation, deleteTranslation } = useI18n()

// 使用管理员认证
const { isAdminLoggedIn } = useAdminAuth()

// 响应式数据
const searchTerm = ref('')
const showLoginModal = ref(!isAdminLoggedIn.value)
const newKey = ref('')
const newTranslations = reactive({})
const saving = ref(false)

// 临时存储当前编辑的翻译值
const editingValues = reactive({})
const editingCell = ref(null)

// 检查是否正在编辑指定单元格
const isEditing = (rowKey, columnKey) => {
  return editingCell.value &&
         editingCell.value.rowKey === rowKey &&
         editingCell.value.columnKey === columnKey
}

// 开始编辑
const startEditing = (rowKey, columnKey) => {
  editingCell.value = { rowKey, columnKey }
  const value = getTranslationValue(columnKey, rowKey)
  editingValues[`${columnKey}_${rowKey}`] = value
}

// 获取翻译值的辅助函数
const getTranslationValue = (lang, key) => {
  return translations[lang]?.[key] || ''
}

// 获取占位符文本
const getPlaceholder = (key, lang) => {
  return `请输入 ${key} 的${lang === 'en' ? '英文' : '中文'}翻译`
}

// 表格列配置
const tableColumns = computed(() => {
  // 如果数据还没有准备好，返回基本列
  if (!availableLanguages.value || !Array.isArray(availableLanguages.value)) {
    return [
      {
        title: t('i18nManager_translationKey'),
        dataIndex: 'key',
        width: 200,
        fixed: 'left'
      },
      {
        title: t('i18nManager_actions'),
        dataIndex: 'actions',
        width: 100,
        fixed: 'right'
      }
    ]
  }
  
  const columns = [
    {
      title: t('i18nManager_translationKey'),
      dataIndex: 'key',
      width: 200,
      fixed: 'left'
    }
  ]
  
  // 添加语言列
  availableLanguages.value.forEach(lang => {
    columns.push({
      title: `${lang.flag} ${lang.name}`,
      dataIndex: lang.code,
      width: 200
    })
  })
  
  // 添加操作列
  columns.push({
    title: t('i18nManager_actions'),
    dataIndex: 'actions',
    width: 100,
    fixed: 'right'
  })
  
  return columns
})

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage >= 90) return '#52c41a'
  if (percentage >= 70) return '#faad14'
  return '#ff4d4f'
}

// 从实际的翻译数据加载
const loadTranslations = async () => {
  try {
    // 等待语言数据加载完成
    await nextTick()
    
    // 首先从localStorage恢复数据
    restoreFromLocalStorage()
    
    const keys = getAllTranslationKeys()
    console.log('Loaded translation keys:', keys.length)
    
    // 确保 translations 对象结构完整
    if (availableLanguages.value && Array.isArray(availableLanguages.value)) {
      availableLanguages.value.forEach(lang => {
        if (!translations[lang.code]) {
          translations[lang.code] = {}
        }
        // 验证数据完整性
        keys.forEach(key => {
          if (translations[lang.code][key] === undefined) {
            translations[lang.code][key] = ''
          }
        })
      })
      
      console.log('Available languages:', availableLanguages.value.map(l => `${l.code}: ${translations[l.code] ? Object.keys(translations[l.code]).length : 0} keys`))
    }
    
    // 强制重新渲染表格
    await nextTick()
  } catch (error) {
    console.error('Error loading translations:', error)
  }
}

// 从localStorage恢复翻译数据的函数
const restoreFromLocalStorage = () => {
  try {
    const savedTranslations = localStorage.getItem('i18n_translations')
    if (savedTranslations) {
      const parsedTranslations = JSON.parse(savedTranslations)
      console.log('Restoring from localStorage:', parsedTranslations)
      
      // 恢复数据到translations对象
      Object.keys(parsedTranslations).forEach(lang => {
        if (!translations[lang]) {
          translations[lang] = {}
        }
        // 使用Object.assign确保响应式更新
        translations[lang] = { ...translations[lang], ...parsedTranslations[lang] }
      })
      
      console.log('Translations after restoration:', translations)
    }
  } catch (error) {
    console.error('Failed to restore from localStorage:', error)
  }
}

// 获取所有翻译键
const allKeys = computed(() => {
  return getAllTranslationKeys()
})

// 过滤翻译键
const filteredKeys = computed(() => {
  if (!searchTerm.value) return allKeys.value
  const searchLower = searchTerm.value.toLowerCase()
  return allKeys.value.filter(key => {
    // 检查翻译键
    if (key.toLowerCase().includes(searchLower)) return true
    // 检查所有语言的翻译内容
    return availableLanguages.value.some(lang => {
      const translation = translations[lang.code]?.[key] || ''
      return translation.toLowerCase().includes(searchLower)
    })
  })
})

// 检查是否有需要审核的翻译
const hasTranslationsNeedingReview = computed(() => {
  return availableLanguages.value.some(lang =>
    translationCompleteness.value[lang.code]?.needsReview?.length > 0
  )
})

// 直接更新翻译值
const updateTranslationValue = (lang, key, value) => {
  if (!translations[lang]) {
    translations[lang] = {}
  }
  translations[lang][key] = value
  // 同步更新到 i18n 系统
  i18n.updateTranslation(lang, key, value)
}

// 提交翻译 - 失焦时自动保存
const commitTranslation = async (lang, key) => {
  const value = editingValues[`${lang}_${key}`] || ''
  
  updateTranslationValue(lang, key, value)
  editingCell.value = null
  delete editingValues[`${lang}_${key}`]
  
  // 自动保存到文件
  const saveResult = await i18n.saveTranslationsToFile()
  
  if (saveResult) {
    showMessage('success', t('i18nManager_translationSaved'))
  } else {
    showMessage('warning', t('i18nManager_translationUpdatedLocally'))
  }
}

// 添加新翻译
const addTranslation = async () => {
  try {
    if (!newKey.value) return
    
    const newTranslationsData = {}
    availableLanguages.value.forEach(lang => {
      newTranslationsData[lang.code] = {
        [newKey.value]: newTranslations[lang.code] || ''
      }
    })
    
    // 使用实际的 i18n 系统保存
    addTranslations(newTranslationsData)
    
    // 更新本地数据 - 使用Vue的响应式方法
    availableLanguages.value.forEach(lang => {
      if (!translations[lang.code]) {
        translations[lang.code] = {}
      }
      // 使用展开运算符确保响应式更新
      translations[lang.code] = {
        ...translations[lang.code],
        [newKey.value]: newTranslations[lang.code] || ''
      }
    })
    
    // 重置表单
    newKey.value = ''
    availableLanguages.value.forEach(lang => {
      newTranslations[lang.code] = ''
    })
    
    // 静默保存到文件
    await i18n.saveTranslationsToFile()
    
    // 重新加载翻译数据
    setTimeout(() => {
      loadTranslations()
    }, 100)
    
    showMessage('success', t('i18nManager_newTranslationAdded'))
  } catch (error) {
    console.error('Error adding translation:', error)
    showMessage('error', t('i18nManager_errorAddingTranslation'))
  }
}

// 保存翻译 - 已废弃，使用 commitTranslation 代替
const saveTranslation = async (lang, key, value) => {
  if (!translations[lang]) {
    translations[lang] = {}
  }
  translations[lang][key] = value
  
  // 使用实际的 i18n 系统保存
  updateTranslation(lang, key, value)
  
  // 静默保存到文件
  await i18n.saveTranslationsToFile()
}

// 删除翻译
const handleDeleteTranslation = async (key) => {
  try {
    // 使用实际的 i18n 系统删除
    deleteTranslation(key)
    
    // 更新本地数据
    availableLanguages.value.forEach(lang => {
      if (translations[lang.code] && translations[lang.code][key]) {
        delete translations[lang.code][key]
      }
    })
    
    // 静默保存到文件
    await i18n.saveTranslationsToFile()
    
    showMessage('success', t('i18nManager_translationDeleted'))
  } catch (error) {
    console.error('Error deleting translation:', error)
    showMessage('error', t('i18nManager_errorDeletingTranslation'))
  }
}

// 保存所有翻译
const saveAllTranslations = async () => {
  console.log('Starting to save all translations...')
  
  // 设置加载状态
  saving.value = true
  
  try {
    // 遍历所有翻译键和语言，保存每个翻译
    allKeys.value.forEach(key => {
      availableLanguages.value.forEach(lang => {
        const value = translations[lang.code][key]
        if (value !== undefined) {
          updateTranslation(lang.code, key, value)
        }
      })
    })
    
    // 保存所有更改到文件 - 使用静默保存
    await i18n.saveTranslationsToFile()
    
    // 显示成功消息
    showMessage('success', t('i18nManager_saveSuccess'))
    
    // 强制重新加载翻译数据以确保界面显示最新内容
    setTimeout(() => {
      loadTranslations()
    }, 200)
  } catch (error) {
    showMessage('error', t('i18nManager_errorDuringSave'))
  } finally {
    saving.value = false
  }
}

// 导出翻译
const exportTranslations = () => {
  const data = JSON.stringify(translations, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'translations.json'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  console.log('I18nManager mounted')
  
  // 等待所有数据加载完成
  await loadTranslations()
  
  // 初始化新翻译对象
  if (availableLanguages.value) {
    availableLanguages.value.forEach(lang => {
      newTranslations[lang.code] = ''
    })
  }
})

// 管理员登录成功回调
const handleLoginSuccess = () => {
  // 登录成功后重新加载翻译数据
  loadTranslations()
}

// 返回上一页
const goBack = () => {
  window.history.back()
}
</script>

<style scoped>
.i18n-manager {
  padding: 20px;
  max-width: 1160px;
  margin: 0 auto;
  background-color: white;
  /* 利用App.vue中已经计算好的高度空间，确保减去header后充分利用可用空间 */
  min-height: calc(100vh - 64px); /* 与App.vue的main-content保持一致 */
  box-sizing: border-box;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
}

/* 页面头部 */
.page-header {
  margin-bottom: 20px;
  padding: 0;
  background: transparent;
  border-radius: 0;
  border: none;
  box-shadow: none;
}

/* Frame 348 - 页面头部 */
.frame348 {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  align-self: stretch;
  justify-content: space-between;
  border-radius: 12px;
  background: #ffffff;
  padding-top: 20px;
  padding-bottom: 20px;
  width: 100%;
  height: auto;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.frame335 {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  column-gap: 12px;
}

/* 页面标题 */
.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #202020;
  margin: 0;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 24px;
  letter-spacing: 0;
}

/* 返回按钮 */
.back-button {
  color: #202020;
  font-size: 14px;
  padding: 0;
  height: 24px;
  width: 24px;
  min-width: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #f0f0f0;
}

.back-button svg {
  width: 24px;
  height: 24px;
}

/* 刷新按钮 */
.refresh-button {
  background: #fdfdfd;
  border: 1px solid #d9d9d9;
  color: #202020;
  font-size: 14px;
  border-radius: 6px;
  padding: 11px 15px;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 15px;
  letter-spacing: 0;
}

.refresh-button.primary {
  background: #00a0d9;
  border: none;
  color: #ffffff;
}

.header-actions {
  display: flex;
  gap: 6px;
}

/* 卡片样式 */
.review-section,
.translations-section {
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  background: #ffffff;
  padding: 20px;
  box-sizing: border-box;
}

/* 翻译完整性概览 */
.completeness-section {
  margin-bottom: 20px;
}

/* 搜索和操作区域 */
.frame330 {
  display: grid;
  grid-template-columns: 2fr max-content;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
}

/* 搜索输入容器 */
.search-input-container {
  flex: 1;
  display: block;
  height: 32px;
  min-height: 32px;
}

/* 搜索输入框 */
.search-input {
  height: 32px;
  min-height: 32px;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  font-size: 12px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 6px;
}

/* 语言网格 */
.lang-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  width: 100%;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  width: 100%;
}

/* 语言卡片 */
.current-language {
  border: 2px solid #00a0d9 !important;
  box-shadow: 0 2px 8px rgba(0, 160, 217, 0.15);
}

.lang-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flag {
  font-size: 18px;
}

.lang-name {
  font-weight: 700;
  color: #202020;
  flex: 1;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
}

.progress-section {
  margin-bottom: 12px;
}

.stats {
  font-size: 12px;
  color: #626262;
  text-align: center;
  margin-top: 8px;
  font-weight: normal;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
}

.quality-info,
.review-info {
  margin-top: 8px;
}

/* 审核卡片 */
.review-card {
  border: 1px solid #e8e8e8;
  background: #ffffff;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-list {
  max-height: 200px;
  overflow-y: auto;
}

.review-item {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  padding: 12px 0;
}

.review-item:hover {
  background: #fafafa;
}

.review-item:last-child {
  border-bottom: none;
}

.review-content {
  width: 100%;
}

.review-key {
  margin-bottom: 4px;
}

.translation-key {
  background: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
}

.review-value {
  font-size: 12px;
  color: #626262;
  margin-bottom: 4px;
  word-break: break-word;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
}

.review-reason {
  margin-top: 4px;
}

.review-more {
  text-align: center;
  padding: 8px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.secondary-text {
  font-size: 12px;
  color: #626262;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #202020;
  margin: 0;
}

.card-extra {
  display: flex;
  align-items: center;
}

/* 翻译表格 */
.translations-table-container {
  margin-bottom: 20px;
  overflow: auto;
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.translations-table {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

/* 表格单元格编辑样式 */
.display-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  min-height: 32px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.display-cell:hover {
  background: #f5f5f5;
}

.translation-text {
  flex: 1;
  font-size: 13px;
  color: #202020;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
}

.placeholder-text {
  color: #999;
  font-style: italic;
}

.editing-cell {
  padding: 0;
}

.edit-icon {
  color: #999;
  margin-left: 8px;
  flex-shrink: 0;
}

.display-cell:hover .edit-icon {
  color: #00a0d9;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* 添加翻译区域 */
.add-translation-section {
  margin-top: 20px;
  border: 1px dashed #cecece;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.2s ease;
  padding: 20px;
}

.add-translation-section:hover {
  border-color: #00a0d9;
  background: #f0f9ff;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: #202020;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

/* 搜索和操作区域 */
.frame330 {
  display: grid;
  grid-template-columns: 2fr max-content;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
}

/* 搜索输入容器 */
.search-input-container {
  flex: 1;
  display: block;
  height: 32px;
  min-height: 32px;
}

/* 搜索输入框 */
.search-input {
  height: 32px;
  min-height: 32px;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  font-size: 12px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 6px;
}

/* 图标样式 */
.icon {
  display: inline-block;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .i18n-manager {
    padding: 16px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  /* Frame 330 - 搜索和操作区域 */
  .frame330 {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 20px;
  }

  .header-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
  }
  
  .lang-grid,
  .review-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .page-title {
    font-size: 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  
  .header-actions button {
    width: 100%;
    justify-content: center;
  }
}
</style>
