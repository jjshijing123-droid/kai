
<template>
  <a-layout class="i18n-manager">
    <!-- 未登录提示 - 使用统一组件 -->
    <AdminAccessDenied
      v-if="!isAdminLoggedIn"
      subtitle-key="common_needAdminSubtitleI18n"
      :redirect-path="'/'"
      :back-button-text="t('common_backToHome')"
      :on-login-success="handleLoginSuccess"
    />

    <!-- 管理员内容 -->
    <div v-else class="admin-content">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <h2>{{ t('i18nManager_title') }}</h2>
          <div class="header-actions">
            <a-button type="primary" @click="saveAllTranslations" :loading="saving">
              <template #icon>
                <SaveOutlined />
              </template>
              {{ t('i18nManager_saveAll') }}
            </a-button>
            <a-button @click="exportTranslations">
              <template #icon>
                <ExportOutlined />
              </template>
              {{ t('i18nManager_export') }}
            </a-button>
          </div>
        </div>
      </div>

    <a-layout-content class="manager-content">
      <!-- 翻译完整性概览 -->
      <a-card :title="t('i18nManager_completeness')" class="completeness-section">
        <a-row :gutter="[16, 16]">
          <a-col v-for="lang in availableLanguages" :key="lang.code" :xs="24" :sm="12" :md="8" :lg="6">
            <a-card
              :class="{ 'current-language': lang.code === currentLanguage }"
              size="small"
            >
              <template #title>
                <div class="lang-header">
                  <span class="flag">{{ lang.flag }}</span>
                  <span class="lang-name">{{ lang.name }}</span>
                  <a-tag v-if="lang.code === currentLanguage" color="blue">{{ currentLanguage === 'zh-CN' ? '当前' : 'Current' }}</a-tag>
                </div>
              </template>
              
              <div class="progress-section">
                <a-progress
                  :percent="translationCompleteness[lang.code]?.percentage || 0"
                  :stroke-color="getProgressColor(translationCompleteness[lang.code]?.percentage || 0)"
                  size="small"
                />
                <div class="stats">
                  {{ translationCompleteness[lang.code]?.translated || 0 }}/{{ translationCompleteness[lang.code]?.total || 0 }}
                </div>
              </div>
              
              <div class="quality-info" v-if="translationCompleteness[lang.code]?.quality">
                <a-tag color="green">{{ currentLanguage === 'zh-CN' ? '质量' : 'Quality' }}: {{ translationCompleteness[lang.code]?.quality }}%</a-tag>
              </div>
              
              <div class="review-info" v-if="translationCompleteness[lang.code]?.needsReview?.length">
                <a-tag color="red">{{ currentLanguage === 'zh-CN' ? '需要审核' : 'Needs Review' }}: {{ translationCompleteness[lang.code]?.needsReview?.length }} {{ currentLanguage === 'zh-CN' ? '项' : 'items' }}</a-tag>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </a-card>

      <!-- 需要审核的翻译 -->
      <a-card
        v-if="hasTranslationsNeedingReview"
        :title="currentLanguage === 'zh-CN' ? '需要审核的翻译' : 'Translations Needing Review'"
        class="review-section"
        :head-style="{ borderBottom: '2px solid #ff4d4f' }"
      >
        <a-row :gutter="[16, 16]">
          <a-col v-for="lang in availableLanguages" :key="lang.code" :xs="24" :sm="12" :lg="8">
            <a-card
              v-if="translationCompleteness[lang.code]?.needsReview?.length"
              size="small"
              :bordered="false"
              class="review-card"
            >
              <template #title>
                <div class="review-header">
                  <span class="flag">{{ lang.flag }}</span>
                  <span class="lang-name">{{ lang.name }}</span>
                  <a-badge :count="translationCompleteness[lang.code]?.needsReview?.length" :number-style="{ backgroundColor: '#ff4d4f' }" />
                </div>
              </template>
              
              <a-list
                :data-source="translationCompleteness[lang.code]?.needsReview?.slice(0, 3)"
                size="small"
                :locale="{ emptyText: currentLanguage === 'zh-CN' ? '暂无需要审核的翻译' : 'No translations need review' }"
              >
                <template #renderItem="{ item }">
                  <a-list-item class="review-item">
                    <div class="review-content">
                      <div class="review-key">
                        <a-typography-text code>{{ item.key }}</a-typography-text>
                      </div>
                      <div class="review-value">{{ item.value }}</div>
                      <div class="review-reason">
                        <a-tag color="red" size="small">{{ item.reason }}</a-tag>
                      </div>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
              
              <div v-if="translationCompleteness[lang.code]?.needsReview?.length > 3" class="review-more">
                <a-typography-text type="secondary">
                  {{ currentLanguage === 'zh-CN' ? '还有' : 'More' }} {{ translationCompleteness[lang.code]?.needsReview?.length - 3 }} {{ currentLanguage === 'zh-CN' ? '项' : 'items' }} {{ currentLanguage === 'zh-CN' ? '需要审核...' : 'need review...' }}
                </a-typography-text>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </a-card>

      <!-- 翻译表格 -->
      <a-card :title="t('i18nManager_allTranslations')" class="translations-section">
        <template #extra>
          <a-input
            v-model:value="searchTerm"
            :placeholder="t('i18nManager_search')"
            style="width: 250px"
          />
        </template>
        
        <a-table
          :dataSource="filteredKeys.map(key => ({ key }))"
          :columns="tableColumns"
          :pagination="false"
          size="small"
          class="translations-table"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.dataIndex === 'key'">
              <a-typography-text code>{{ record.key }}</a-typography-text>
            </template>
            
            <template v-else-if="column.dataIndex === 'actions'">
              <a-space>
                <a-button
                  type="link"
                  danger
                  size="small"
                  @click="handleDeleteTranslation(record.key)"
                >
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                  {{ t('i18nManager_delete') }}
                </a-button>
              </a-space>
            </template>
            
            <template v-else>
              <a-input
                :value="translations[column.dataIndex] && translations[column.dataIndex][record.key] ? translations[column.dataIndex][record.key] : ''"
                :placeholder="record.key"
                @input="updateTranslationValue(column.dataIndex, record.key, $event.target.value)"
                @blur="saveTranslation(column.dataIndex, record.key, $event.target.value)"
                size="small"
              />
            </template>
          </template>
        </a-table>
        
        <!-- 添加新翻译 -->
        <a-card :title="currentLanguage === 'zh-CN' ? '添加新翻译' : 'Add New Translation'" class="add-translation-section" size="small">
          <a-form layout="vertical">
            <a-row :gutter="16">
              <a-col :span="24">
                <a-form-item :label="currentLanguage === 'zh-CN' ? '翻译键' : 'Translation Key'">
                  <a-input
                    v-model:value="newKey"
                    :placeholder="t('i18nManager_newKey')"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col
                v-for="lang in availableLanguages"
                :key="lang.code"
                :xs="24"
                :sm="12"
                :md="8"
              >
                <a-form-item :label="`${lang.flag} ${lang.name}`">
                  <a-input
                    v-model:value="newTranslations[lang.code]"
                    :placeholder="t('i18nManager_newTranslation')"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row>
              <a-col :span="24">
                <a-button
                  type="primary"
                  @click="addTranslation"
                  :disabled="!newKey"
                  block
                >
                  <template #icon>
                    <PlusOutlined />
                  </template>
                  {{ t('i18nManager_add') }}
                </a-button>
              </a-col>
            </a-row>
          </a-form>
        </a-card>
      </a-card>
    </a-layout-content>
    </div>
    
  </a-layout>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import i18n from '../i18n/index.js'
import { useI18n } from '../composables/useI18n.js'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import AdminAccessDenied from './AdminAccessDenied.vue'
import {
  SaveOutlined,
  ExportOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons-vue'

// 使用实际的 i18n 数据
const { currentLanguage, availableLanguages, translationCompleteness, t, getTranslationKeys, addTranslations, updateTranslation, deleteTranslation } = useI18n()

// 使用管理员认证
const { isAdminLoggedIn } = useAdminAuth()

// 响应式数据
const searchTerm = ref('')
const newKey = ref('')
const newTranslations = reactive({})
const saving = ref(false)
// 使用实际的翻译数据
const translations = reactive({})

// 表格列配置
const tableColumns = computed(() => {
  const columns = [
    {
      title: t('i18nManager_translationKey'),
      dataIndex: 'key',
      width: 200,
      fixed: 'left'
    }
  ]
  
  // 添加语言列
  if (availableLanguages.value && Array.isArray(availableLanguages.value)) {
    availableLanguages.value.forEach(lang => {
      columns.push({
        title: `${lang.flag} ${lang.name}`,
        dataIndex: lang.code,
        width: 200
      })
    })
  }
  
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
const loadTranslations = () => {
  try {
    const keys = getTranslationKeys()
    
    // 清空现有翻译 - 使用响应式方式
    Object.keys(translations).forEach(lang => {
      delete translations[lang]
    })
    
    // 从i18n系统加载所有语言的翻译
    if (availableLanguages.value && Array.isArray(availableLanguages.value)) {
      availableLanguages.value.forEach(lang => {
        if (!translations[lang.code]) {
          translations[lang.code] = {}
        }
        keys.forEach(key => {
          // 使用t函数获取翻译，但确保使用正确的语言代码
          const translationValue = t(key, {}, lang.code)
          // 使用响应式赋值
          translations[lang.code][key] = translationValue
        })
      })
    }
    
    console.log('Translations loaded from i18n system:', translations)
    console.log('Available keys:', keys)
    console.log('Available languages:', availableLanguages.value)
  } catch (error) {
    console.error('Error loading translations:', error)
  }
}

// 获取所有翻译键
const allKeys = computed(() => {
  return getTranslationKeys()
})

// 过滤翻译键
const filteredKeys = computed(() => {
  if (!searchTerm.value) return allKeys.value
  return allKeys.value.filter(key =>
    key.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

// 检查是否有需要审核的翻译
const hasTranslationsNeedingReview = computed(() => {
  return availableLanguages.value.some(lang =>
    translationCompleteness.value[lang.code]?.needsReview?.length > 0
  )
})

// 更新翻译值
const updateTranslationValue = (lang, key, value) => {
  if (!translations[lang]) {
    translations[lang] = {}
  }
  translations[lang][key] = value
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
    
    console.log('Adding new translation:', newTranslationsData)
    
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
    
    // 保存到文件 - 使用改进的方法
    try {
      // 直接调用后端API，只发送新翻译键
      const response = await fetch('/api/save-translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          translations: newTranslationsData,
          action: 'add' // 添加操作标识
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('New translation saved to file:', result.message)
      } else {
        console.error('Failed to save new translation to file')
      }
    } catch (error) {
      console.error('Failed to save new translation to file:', error)
    }
    
    // 重新加载翻译数据
    setTimeout(() => {
      loadTranslations()
    }, 100)
  } catch (error) {
    console.error('Error adding translation:', error)
    alert(currentLanguage === 'zh-CN' ? '添加翻译时发生错误，请检查控制台' : 'Error occurred while adding translation, please check console')
  }
}

// 保存翻译
const saveTranslation = async (lang, key, value) => {
  if (!translations[lang]) {
    translations[lang] = {}
  }
  translations[lang][key] = value
  
  // 使用实际的 i18n 系统保存
  updateTranslation(lang, key, value)
  
  // 立即保存到文件
  try {
    await i18n.saveTranslationsToFile()
    console.log(`Translation saved to file: ${lang}.${key} = ${value}`)
  } catch (error) {
    console.error('Failed to save translation to file:', error)
  }
}

// 删除翻译
const handleDeleteTranslation = async (key) => {
  // 使用实际的 i18n 系统删除
  deleteTranslation(key)
  
  // 更新本地数据
  availableLanguages.value.forEach(lang => {
    if (translations[lang.code] && translations[lang.code][key]) {
      delete translations[lang.code][key]
    }
  })
  
  // 保存到文件
  try {
    await i18n.saveTranslationsToFile()
    console.log(`Translation deleted from file: ${key}`)
  } catch (error) {
    console.error('Failed to save after deletion:', error)
  }
}

// 保存所有翻译
const saveAllTranslations = async () => {
  console.log('Starting to save all translations...')
  
  // 遍历所有翻译键和语言，保存每个翻译
  allKeys.value.forEach(key => {
    availableLanguages.value.forEach(lang => {
      const value = translations[lang.code][key]
      if (value !== undefined) {
        console.log(`Saving translation: ${lang.code}.${key} = ${value}`)
        updateTranslation(lang.code, key, value)
      }
    })
  })
  
  // 保存所有更改到文件
  try {
    await i18n.saveTranslationsToFile()
    console.log('All translations saved to file')
  } catch (error) {
    console.error('Failed to save all translations to file:', error)
  }
  
  // 强制重新加载翻译数据以确保界面显示最新内容
  setTimeout(() => {
    console.log('Reloading translations after save...')
    loadTranslations()
  }, 200)
  
  alert(t('i18nManager_saveSuccess'))
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

onMounted(() => {
  console.log('I18nManager mounted')
  
  // 加载翻译数据
  loadTranslations()
  
  // 初始化新翻译对象
  availableLanguages.value.forEach(lang => {
    newTranslations[lang.code] = ''
  })
})

// 管理员登录成功回调
const handleLoginSuccess = () => {
  // 登录成功后重新加载翻译数据
  loadTranslations()
}
</script>

<style scoped>
.i18n-manager {
  padding: 0px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: white;
  /* 利用App.vue中已经计算好的高度空间，确保减去header后充分利用可用空间 */
  min-height: calc(100vh - 64px); /* 与App.vue的main-content保持一致 */
  box-sizing: border-box;
  /* 确保内容可以正确滚动 */
  overflow-y: auto;
}

/* 页面头部 */
.page-header {
  margin-bottom: 32px;
  padding: 24px;
  padding-top: 64px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: auto;
}

.header-content h2 {
  margin: 0;
  color: #1a1a1a;
  font-size: 28px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-content h2::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 28px;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border-radius: 2px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 操作按钮 */
.header-actions .ant-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.header-actions .ant-btn-primary {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.header-actions .ant-btn-primary:hover {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.header-actions .ant-btn:not(.ant-btn-primary) {
  background: #f0f2f5;
  color: #4a4a4a;
  border: 1px solid #d9d9d9;
}

.header-actions .ant-btn:not(.ant-btn-primary):hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
}

.manager-content {
  padding: 0;
  background: transparent;
}

/* 卡片样式 */
.completeness-section,
.review-section,
.translations-section {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.completeness-section .ant-card,
.review-section .ant-card,
.translations-section .ant-card {
  border-radius: 12px;
  box-shadow: none;
}

/* 语言卡片 */
.current-language {
  border: 2px solid #1890ff !important;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
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
  font-weight: 600;
  color: #1a1a1a;
}

.progress-section {
  margin-bottom: 12px;
}

.stats {
  font-size: 12px;
  color: #8c8c8c;
  text-align: center;
  margin-top: 8px;
  font-weight: 500;
}

.quality-info,
.review-info {
  margin-top: 8px;
}

/* 审核卡片 */
.review-section .ant-card {
  border: 1px solid #ffccc7;
  background: #fff2f0;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-item {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
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

.review-value {
  font-size: 12px;
  color: #595959;
  margin-bottom: 4px;
  word-break: break-word;
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

/* 翻译表格 */
.translations-table {
  margin-bottom: 24px;
}

.translations-table .ant-table {
  border-radius: 8px;
  overflow: hidden;
}

.translations-table .ant-table-thead > tr > th {
  background: #fafafa;
  font-weight: 600;
  color: #1a1a1a;
}

.translations-table .ant-table-tbody > tr:hover > td {
  background: #f0f2f5;
}

/* 添加翻译区域 */
.add-translation-section {
  margin-top: 24px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  transition: all 0.2s ease;
}

.add-translation-section:hover {
  border-color: #1890ff;
  background: #f0f2f5;
}

.add-translation-section .ant-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.add-translation-section .ant-btn-primary {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border: none;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.add-translation-section .ant-btn-primary:hover {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* 网格布局改进 */
.completeness-section .ant-row,
.review-section .ant-row {
  margin: -8px;
}

.completeness-section .ant-col,
.review-section .ant-col {
  padding: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .i18n-manager {
    padding: 16px;
    /* 在移动端也保持正确的高度计算 */
    min-height: calc(100vh - 64px);
  }
  
  .page-header {
    padding: 20px;
  }
  
  .header-content h2 {
    font-size: 24px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 576px) {
  .header-content h2 {
    font-size: 20px;
  }
  
  .header-actions .ant-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .completeness-section .ant-col,
  .review-section .ant-col {
    padding: 4px;
  }
}
</style>
