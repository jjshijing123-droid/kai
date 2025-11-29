
<template>
  <div class="i18n-manager">
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
            <button 
              class="btn btn-primary" 
              @click="saveAllTranslations" 
              :disabled="saving"
            >
              <span class="btn-icon">💾</span>
              {{ t('i18nManager_saveAll') }}
            </button>
            <button class="btn btn-secondary" @click="exportTranslations">
              <span class="btn-icon">📤</span>
              {{ t('i18nManager_export') }}
            </button>
          </div>
        </div>
      </div>

      <div class="manager-content">
        <!-- 翻译完整性概览 -->
        <section class="card completeness-section">
          <h3 class="card-title">{{ t('i18nManager_completeness') }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div 
              v-for="lang in availableLanguages" 
              :key="lang.code"
              class="card lang-card"
              :class="{ 'current-language': lang.code === currentLanguage }"
            >
              <div class="card-header">
                <div class="lang-header">
                  <span class="flag">{{ lang.flag }}</span>
                  <span class="lang-name">{{ lang.name }}</span>
                  <span v-if="lang.code === currentLanguage" class="tag tag-blue">{{ currentLanguage === 'zh-CN' ? '当前' : 'Current' }}</span>
                </div>
              </div>
              
              <div class="card-body">
                <div class="progress-section">
                  <div class="progress-container">
                    <div 
                      class="progress-bar"
                      :style="{
                        width: `${translationCompleteness[lang.code]?.percentage || 0}%`,
                        backgroundColor: getProgressColor(translationCompleteness[lang.code]?.percentage || 0)
                      }"
                    ></div>
                  </div>
                  <div class="stats">
                    {{ translationCompleteness[lang.code]?.translated || 0 }}/{{ translationCompleteness[lang.code]?.total || 0 }}
                  </div>
                </div>
                
                <div class="quality-info" v-if="translationCompleteness[lang.code]?.quality">
                  <span class="tag tag-green">{{ currentLanguage === 'zh-CN' ? '质量' : 'Quality' }}: {{ translationCompleteness[lang.code]?.quality }}%</span>
                </div>
                
                <div class="review-info" v-if="translationCompleteness[lang.code]?.needsReview?.length">
                  <span class="tag tag-red">{{ currentLanguage === 'zh-CN' ? '需要审核' : 'Needs Review' }}: {{ translationCompleteness[lang.code]?.needsReview?.length }} {{ currentLanguage === 'zh-CN' ? '项' : 'items' }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 需要审核的翻译 -->
        <section 
          v-if="hasTranslationsNeedingReview"
          class="card review-section"
        >
          <h3 class="card-title">{{ currentLanguage === 'zh-CN' ? '需要审核的翻译' : 'Translations Needing Review' }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="lang in availableLanguages" 
              :key="lang.code"
              v-if="translationCompleteness[lang.code]?.needsReview?.length"
              class="card review-card"
            >
              <div class="card-header">
                <div class="review-header">
                  <span class="flag">{{ lang.flag }}</span>
                  <span class="lang-name">{{ lang.name }}</span>
                  <span class="badge badge-red">{{ translationCompleteness[lang.code]?.needsReview?.length }}</span>
                </div>
              </div>
              
              <div class="card-body">
                <div class="list">
                  <div 
                    v-for="(item, index) in translationCompleteness[lang.code]?.needsReview?.slice(0, 3)" 
                    :key="index"
                    class="list-item review-item"
                  >
                    <div class="review-content">
                      <div class="review-key">
                        <code>{{ item.key }}</code>
                      </div>
                      <div class="review-value">{{ item.value }}</div>
                      <div class="review-reason">
                        <span class="tag tag-red tag-small">{{ item.reason }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="!translationCompleteness[lang.code]?.needsReview?.length" class="empty-state">
                    {{ currentLanguage === 'zh-CN' ? '暂无需要审核的翻译' : 'No translations need review' }}
                  </div>
                </div>
                
                <div v-if="translationCompleteness[lang.code]?.needsReview?.length > 3" class="review-more">
                  <span class="text-secondary">
                    {{ currentLanguage === 'zh-CN' ? '还有' : 'More' }} {{ translationCompleteness[lang.code]?.needsReview?.length - 3 }} {{ currentLanguage === 'zh-CN' ? '项' : 'items' }} {{ currentLanguage === 'zh-CN' ? '需要审核...' : 'need review...' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 翻译表格 -->
        <section class="card translations-section">
          <div class="card-header with-actions">
            <h3 class="card-title">{{ t('i18nManager_allTranslations') }}</h3>
            <div class="card-actions">
              <input
                v-model="searchTerm"
                :placeholder="t('i18nManager_search')"
                class="input"
                style="width: 250px"
              />
            </div>
          </div>
          
          <div class="card-body">
            <div class="table-container">
              <table class="table translations-table">
                <thead>
                  <tr>
                    <th class="table-header" style="width: 200px; position: sticky; left: 0; background: white; z-index: 10;">{{ t('i18nManager_translationKey') }}</th>
                    <th 
                      v-for="lang in availableLanguages" 
                      :key="lang.code"
                      class="table-header"
                      style="width: 200px"
                    >
                      {{ lang.flag }} {{ lang.name }}
                    </th>
                    <th class="table-header" style="width: 100px; position: sticky; right: 0; background: white; z-index: 10;">{{ t('i18nManager_actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="key in filteredKeys" :key="key">
                    <td class="table-cell key-cell" style="position: sticky; left: 0; background: white; z-index: 5;">
                      <code>{{ key }}</code>
                    </td>
                    <td 
                      v-for="lang in availableLanguages" 
                      :key="lang.code"
                      class="table-cell"
                    >
                      <input
                        type="text"
                        :value="translations[lang.code] && translations[lang.code][key] ? translations[lang.code][key] : ''"
                        :placeholder="key"
                        @input="updateTranslationValue(lang.code, key, $event.target.value)"
                        @blur="saveTranslation(lang.code, key, $event.target.value)"
                        class="input input-small"
                      />
                    </td>
                    <td class="table-cell actions-cell" style="position: sticky; right: 0; background: white; z-index: 5;">
                      <button
                        class="btn btn-link btn-danger btn-small"
                        @click="handleDeleteTranslation(key)"
                      >
                        <span class="btn-icon">🗑️</span>
                        {{ t('i18nManager_delete') }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- 添加新翻译 -->
            <div class="add-translation-section card">
              <h4 class="card-title">{{ currentLanguage === 'zh-CN' ? '添加新翻译' : 'Add New Translation' }}</h4>
              <form class="form" @submit.prevent="addTranslation">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">{{ currentLanguage === 'zh-CN' ? '翻译键' : 'Translation Key' }}</label>
                    <input
                      v-model="newKey"
                      :placeholder="t('i18nManager_newKey')"
                      class="input"
                      required
                    />
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div 
                    v-for="lang in availableLanguages" 
                    :key="lang.code"
                    class="form-group"
                  >
                    <label class="form-label">{{ lang.flag }} {{ lang.name }}</label>
                    <input
                      v-model="newTranslations[lang.code]"
                      :placeholder="t('i18nManager_newTranslation')"
                      class="input"
                    />
                  </div>
                </div>
                <div class="form-actions">
                  <button
                    type="submit"
                    class="btn btn-primary btn-block"
                    :disabled="!newKey"
                  >
                    <span class="btn-icon">➕</span>
                    {{ t('i18nManager_add') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import i18n from '../i18n/index.js'
import { useI18n } from '../composables/useI18n.js'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import AdminAccessDenied from './AdminAccessDenied.vue'

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
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
}

/* 页面头部 */
.page-header {
  margin-bottom: 32px;
  padding: 24px;
  margin-top: 24px;
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

/* 按钮样式 */
.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  outline: none;
}

.btn-primary {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #f0f2f5;
  color: #4a4a4a;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
}

.btn-link {
  background: transparent;
  color: #1890ff;
  padding: 4px 8px;
  border: none;
}

.btn-link:hover {
  color: #40a9ff;
  text-decoration: underline;
}

.btn-danger {
  color: #ff4d4f;
}

.btn-danger:hover {
  color: #ff7875;
}

.btn-small {
  padding: 4px 8px;
  font-size: 13px;
}

.btn-block {
  width: 100%;
  justify-content: center;
}

.btn-icon {
  font-size: 16px;
}

.manager-content {
  padding: 0;
  background: transparent;
}

/* 卡片样式 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
  overflow: hidden;
}

.card-title {
  margin: 0;
  padding: 20px 24px;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  border-bottom: 1px solid #f0f0f0;
}

.card-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.card-body {
  padding: 16px;
}

.card-actions {
  display: flex;
  align-items: center;
}

.card-header.with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}

.completeness-section,
.review-section,
.translations-section {
  margin-bottom: 24px;
}

/* 语言卡片 */
.lang-card {
  transition: all 0.3s ease;
}

.current-language {
  border: 2px solid #1890ff;
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

/* 标签样式 */
.tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.tag-blue {
  background: #e6f7ff;
  color: #1890ff;
}

.tag-green {
  background: #f6ffed;
  color: #52c41a;
}

.tag-red {
  background: #fff2f0;
  color: #ff4d4f;
}

.tag-small {
  font-size: 11px;
  padding: 1px 6px;
}

/* 进度条样式 */
.progress-section {
  margin-bottom: 12px;
}

.progress-container {
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
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
.review-card {
  border: 1px solid #ffccc7;
  background: #fff2f0;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 徽章样式 */
.badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  min-width: 20px;
  text-align: center;
}

.badge-red {
  background: #ff4d4f;
}

/* 列表样式 */
.list {
  width: 100%;
}

.list-item {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  padding: 12px 0;
}

.list-item:hover {
  background: #fafafa;
}

.list-item:last-child {
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
  margin-top: 8px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  color: #8c8c8c;
  padding: 16px 0;
  font-size: 14px;
}

/* 翻译表格 */
.table-container {
  overflow-x: auto;
  margin-bottom: 24px;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.table-header {
  background: #fafafa;
  font-weight: 600;
  color: #1a1a1a;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.table-cell {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
}

.table tbody tr:hover .table-cell {
  background: #f0f2f5;
}

.key-cell {
  font-weight: 500;
}

.actions-cell {
  text-align: center;
}

/* 输入框样式 */
.input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

.input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.input-small {
  padding: 6px 10px;
  font-size: 13px;
}

/* 添加翻译区域 */
.add-translation-section {
  margin-top: 24px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.2s ease;
}

.add-translation-section:hover {
  border-color: #1890ff;
  background: #f0f2f5;
}

/* 表单样式 */
.form {
  width: 100%;
}

.form-row {
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1a1a1a;
  font-size: 14px;
}

.form-actions {
  margin-top: 24px;
}

/* 网格布局 */
.grid {
  display: grid;
  gap: 16px;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, 1fr);
}

.sm\:grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.md\:grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.lg\:grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.gap-4 {
  gap: 16px;
}

/* 文本样式 */
.text-secondary {
  color: #8c8c8c;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .i18n-manager {
    padding: 16px;
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
  
  .grid {
    gap: 12px;
  }
  
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .md\:grid-cols-3 {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .lg\:grid-cols-4 {
    grid-template-columns: repeat(1, 1fr);
  }
}

@media (max-width: 576px) {
  .header-content h2 {
    font-size: 20px;
  }
  
  .btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .card-title {
    padding: 16px;
    font-size: 16px;
  }
  
  .card-header,
  .card-body {
    padding: 12px;
  }
}
</style>
