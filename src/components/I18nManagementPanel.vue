<template>
  <div class="containeruser">
    <!-- 管理员内容 -->
    <div v-if="isAdminLoggedIn" class="admin-content">
      <!-- 页面头部 -->
      <div class="page-header">
        <!-- Frame 348 -->
        <div class="frame348">
          <div class="frame335">
            <Button @click="goBack" variant="no" size="icon40" class="back-button1">
              <LucideIcon name="ChevronLeft" class="16" />
            </Button>
            <h1 class="page-title">{{ t('i18nManager_title') }}</h1>
          </div>
          <div class="header-actions">
            <Button @click="exportTranslations" variant="line" size="40">
              <LucideIcon name="Upload" class="h-4 w-4" />
              {{ t('i18nManager_export') }}
            </Button>
            <Button @click="loadTranslations" variant="line" size="40">
              <LucideIcon name="RefreshCw" class="h-4 w-4" />
              {{ t('component_empty_refresh') }}
            </Button>
          </div>
        </div>
      </div>

      <!-- 翻译完整性概览 -->
      <div class="rounded-lg border bg-card text-card-foreground shadow-sm completeness-section p-[20px] mb-6">
        <h3 class="text-lg font-semibold mb-4">{{ t('i18nManager_completeness') }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
          <template v-for="lang in availableLanguages" :key="lang.code">
            <div
              :class="{ 'ring-2 --primary-9': lang.code === currentLanguage }"
              class="rounded-md border p-4 hover:shadow-md transition-shadow cursor-pointer"
              @click="setLanguage(lang.code)"
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
            </div>
          </template>
        </div>
      </div>

      <!-- 翻译表格 -->
      <Card :className="'translations-section'">
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
                    color="red"
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
          :className="'add-translation-section'" 
          :size="'small'"
        >
          <h3 class="text-lg font-semibold mb-4">{{ currentLanguage === 'zh-CN' ? '添加新翻译' : 'Add New Translation' }}</h3>
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
                variant="fill"
                size="40"
                style="width: 100%;"
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
import { ref, computed, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import i18n from '../i18n/index.js'
import { useI18n } from '../composables/useI18n.js'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import AdminLoginModal from './AdminLoginModal.vue'
import Button from './ui/button.vue'
import Card from './ui/card.vue'
import Input from './ui/input.vue'
import Progress from './ui/progress.vue'
import Badge from './ui/badge.vue'
import Table from './ui/table.vue'
import LucideIcon from './ui/LucideIcon.vue'

import { showToast } from '../lib/toast.js'

// 全局消息提示
const showMessage = showToast
// 使用实际的 i18n 数据
const { currentLanguage, availableLanguages, translationCompleteness, t, getTranslationKeys, addTranslations, updateTranslation, deleteTranslation, setLanguage, refreshCompleteness } = useI18n()

// 使用管理员认证
const { isAdminLoggedIn } = useAdminAuth()

// 响应式数据
const searchTerm = ref('')
const showLoginModal = ref(!isAdminLoggedIn.value)
const newKey = ref('')
const newTranslations = reactive({})
const refreshTrigger = ref(0) // 用于触发列表刷新的响应式触发器

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
  return i18n.remoteTranslations?.[lang]?.[key] || ''
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
  if (percentage >= 90) return 'var(--green-9)'
  if (percentage >= 70) return 'var(--orange-9)'
  return 'var(--red-9)'
}

// 从实际的翻译数据加载 - 确保数据一致性
const loadTranslations = async (showNotification = true) => {
  try {
    // 从 i18n 服务重新加载远程数据
    await i18n.loadTranslationsFromApi()

    // 触发刷新触发器，确保列表自动更新
    refreshTrigger.value++
    // 触发翻译完整性重新计算
    refreshCompleteness()

    // 显示刷新成功提示
    if (showNotification) {
      showMessage('success', t('i18nManager_refreshSuccess'))
    }
  } catch (error) {
    console.error('Error loading translations:', error)
    // 显示刷新失败提示
    if (showNotification) {
      showMessage('error', t('i18nManager_refreshFailed'))
    }
  }

  // 更新浏览器标题
  setPageTitle()
}

// 获取所有翻译键
const allKeys = computed(() => {
  refreshTrigger.value // 依赖于refreshTrigger，确保每次refreshTrigger更新时都会重新计算
  return getTranslationKeys()
})

// 过滤翻译键
const filteredKeys = computed(() => {
  if (!searchTerm.value) return allKeys.value
  const searchLower = searchTerm.value.toLowerCase()
  return allKeys.value.filter(key => {
    // 检查翻译键
    if (key.toLowerCase().includes(searchLower)) return true
    // 检查所有语言的翻译内容
    if (!availableLanguages.value || !Array.isArray(availableLanguages.value)) {
      return false
    }
    return availableLanguages.value.some(lang => {
      if (!lang || !lang.code) return false
      const translation = i18n.remoteTranslations?.[lang.code]?.[key] || ''
      return translation.toLowerCase().includes(searchLower)
    })
  })
})

// 直接更新翻译值（触发 API 调用）
const updateTranslationValue = (lang, key, value) => {
  // 调用 i18n 服务同步到后端
  i18n.updateTranslation(lang, key, value)
}

// 提交翻译 - 失焦时自动保存
const commitTranslation = async (lang, key) => {
  const value = editingValues[`${lang}_${key}`] || ''
  editingCell.value = null
  delete editingValues[`${lang}_${key}`]

  // 调用后端 API 更新单个翻译键
  const updateResult = await i18n.updateTranslationKey(key, lang, value)

  if (updateResult) {
    showMessage('success', t('i18nManager_translationSaved'))
    // 触发刷新触发器和翻译完整性重新计算
    refreshTrigger.value++
    refreshCompleteness()
  } else {
    showMessage('error', t('i18nManager_errorSavingTranslation'))
  }
}

// 添加新翻译
const addTranslation = async () => {
  try {
    if (!newKey.value) return
    
    // 准备翻译数据格式
    const translationsData = {}
    availableLanguages.value.forEach(lang => {
      translationsData[lang.code] = newTranslations[lang.code] || ''
    })
    
    // 调用后端API添加翻译键
    const addResult = await i18n.addTranslationKey(newKey.value, translationsData)
    
    if (addResult) {
      // 保存新翻译键的名称，因为我们稍后会重置表单
      const newTranslationKey = newKey.value;

      // 重置表单
      newKey.value = ''
      availableLanguages.value.forEach(lang => {
        newTranslations[lang.code] = ''
      })

      // 触发刷新触发器，确保列表自动更新
      refreshTrigger.value++
      // 触发翻译完整性重新计算
      refreshCompleteness()
      showMessage('success', t('i18nManager_newTranslationAdded'))
    } else {
      showMessage('error', t('i18nManager_errorAddingTranslation'))
    }
  } catch (error) {
    console.error('Error adding translation:', error)
    showMessage('error', t('i18nManager_errorAddingTranslation'))
  }
}



// 删除翻译
const handleDeleteTranslation = async (key) => {
  try {
    // 调用后端API删除翻译键
    const deleteResult = await i18n.deleteTranslationKey(key)
    
    if (deleteResult) {
      showMessage('success', t('i18nManager_translationDeleted'))
      // 刷新列表和完成度
      refreshTrigger.value++
      refreshCompleteness()
    } else {
      showMessage('error', t('i18nManager_errorDeletingTranslation'))
    }
  } catch (error) {
    console.error('Error deleting translation:', error)
    showMessage('error', t('i18nManager_errorDeletingTranslation'))
  }
}



// 导出翻译 — 导出为 JSON 文件（作为 translations.js 的种子数据备份）
const exportTranslations = () => {
  const translationsData = i18n.getAllTranslations()
  const fileContent = JSON.stringify(translationsData, null, 2)

  const blob = new Blob([fileContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'translations-export.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 设置浏览器标题
const setPageTitle = () => {
  document.title = t('i18nManager_title')
}

onMounted(async () => {
  console.log('I18nManager mounted')
  
  // 等待所有数据加载完成，不显示刷新提示
  await loadTranslations(false)
  
  // 设置初始标题
  setPageTitle()
  
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

// 监听语言变化，更新浏览器标题
watch(
  () => currentLanguage.value,
  () => {
    setPageTitle()
  }
)
</script>

<style scoped>

.admin-content{
  width: 100%;
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
  justify-content: space-between; /* 左右对齐 */
  align-items: center; /* 垂直居中 */
  border-radius: 12px;
  background: var(--background);
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





/* 刷新按钮 */
.refresh-button {
  background: var(--neutral-1);
  border: 1px solid var(--neutral-6);
  color: var(--neutral-12);
  font-size: 14px;
  border-radius: 6px;
  padding: 11px 15px;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 15px;
  letter-spacing: 0;
}

.refresh-button.primary {
  background: var(--primary-9);
  border: none;
  color: var(--background);
}

.header-actions {
  display: flex;
  gap: 6px;
}

/* 卡片样式 */
.review-section,
.translations-section {
  margin-bottom: 20px;
  border: 1px solid var(--neutral-4);
  border-radius: 12px;
  background: var(--background);
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
  border: 2px solid var(--primary-9) !important;
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
  color: var(--neutral-12);
  flex: 1;
}

.progress-section {
  margin-bottom: 12px;
}

.stats {
  font-size: 12px;
  color: var(--neutral-11);
  text-align: center;
  margin-top: 8px;
  font-weight: normal;
}

.quality-info,
.review-info {
  margin-top: 8px;
}

/* 审核卡片 */
.review-card {
  border: 1px solid var(--neutral-4);
  background: var(--background);
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
  border-bottom: 1px solid var(--neutral-3);
  transition: background-color 0.2s ease;
  padding: 12px 0;
}

.review-item:hover {
  background: var(--neutral-2);
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
  background: var(--neutral-3);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
}

.review-value {
  font-size: 12px;
  color: var(--neutral-11);
  margin-bottom: 4px;
  word-break: break-word;
}

.review-reason {
  margin-top: 4px;
}

.review-more {
  text-align: center;
  padding: 8px;
  border-top: 1px solid var(--neutral-3);
  background: var(--neutral-2);
}

.secondary-text {
  font-size: 12px;
  color: var(--neutral-11);
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--neutral-4);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--neutral-12);
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
  border: 1px solid var(--neutral-4);
  border-radius: 8px;
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
  background: var(--neutral-2);
}

.translation-text {
  flex: 1;
  font-size: 13px;
  color: var(--neutral-12);
}

.placeholder-text {
  color: var(--neutral-9);
  font-style: italic;
}

.editing-cell {
  padding: 0;
}

.edit-icon {
  color: var(--neutral-9);
  margin-left: 8px;
  flex-shrink: 0;
}

.display-cell:hover .edit-icon {
  color: var(--primary-9);
}



/* 添加翻译区域 */
.add-translation-section {
  margin-top: 20px;
  border: 1px dashed var(--neutral-7);
  border-radius: 8px;
  background: var(--neutral-2);
  transition: all 0.2s ease;
  padding: 20px;
}

.add-translation-section:hover {
  border-color: var(--primary-9);
  background: var(--primary-1);
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
  color: var(--neutral-12);
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

  
  .page-header {
  }
  



  /* Frame 330 - 搜索和操作区域 */
  .frame330 {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 20px;
  }

  .header-actions {
    flex-direction: row-reverse;
    align-items: center;
    gap: 12px;
    width: 100%;
  }
  
  .lang-grid,
  .review-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {

  
  .frame348 {
  display:grid;
  grid-template-columns: 1fr; /* 单列 */
  gap: 16px;

  }

  /* 卡片头部样式 */
  .card-header {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 12px;
  }

  .input-wrapper {
    width: 100% !important;
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
