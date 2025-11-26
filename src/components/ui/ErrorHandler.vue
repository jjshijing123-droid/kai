<template>
  <div v-if="visible" class="error-handler-modal" @click="handleOverlayClick">
    <div class="error-handler-content" @click.stop>
      <div class="error-handler-header">
        <h3>{{ $t('errorHandler.title') }}</h3>
        <button class="error-handler-close" @click="close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="error-handler-body">
        <!-- 错误统计概览 -->
        <div class="error-overview">
          <div class="error-stats">
            <div class="stat-item">
              <div class="stat-value">{{ errorStats.total }}</div>
              <div class="stat-label">{{ $t('errorHandler.totalErrors') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ getUptime() }}</div>
              <div class="stat-label">{{ $t('errorHandler.uptime') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" :class="severityClass">{{ errorStats.bySeverity.critical || 0 }}</div>
              <div class="stat-label">{{ $t('errorHandler.critical') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ recentErrorsCount }}</div>
              <div class="stat-label">{{ $t('errorHandler.recent') }}</div>
            </div>
          </div>
        </div>
        
        <!-- 错误类型分布 -->
        <div class="error-distribution" v-if="Object.keys(errorStats.byType).length > 0">
          <h4>{{ $t('errorHandler.errorTypes') }}</h4>
          <div class="error-types-grid">
            <div
              v-for="(count, type) in errorStats.byType"
              :key="type"
              class="error-type-item"
              @click="filterByType(type)"
              :class="{ active: selectedType === type }"
            >
              <div class="error-type-name">{{ getErrorTypeName(type) }}</div>
              <div class="error-type-count">{{ count }}</div>
            </div>
          </div>
        </div>
        
        <!-- 最近错误列表 -->
        <div class="recent-errors">
          <div class="recent-errors-header">
            <h4>{{ $t('errorHandler.recentErrors') }}</h4>
            <div class="recent-errors-actions">
              <button @click="clearRecentErrors" class="action-button">
                {{ $t('errorHandler.clearRecent') }}
              </button>
              <button @click="exportErrors" class="action-button">
                {{ $t('errorHandler.exportLogs') }}
              </button>
            </div>
          </div>
          
          <div class="error-list">
            <div
              v-for="error in paginatedErrors"
              :key="error.id"
              class="error-item"
              :class="[`error-${error.severity}`, { expanded: expandedErrors.has(error.id) }]"
              @click="toggleErrorExpansion(error.id)"
            >
              <div class="error-main">
                <div class="error-header">
                  <div class="error-type-badge" :class="`error-type-${error.type}`">
                    {{ getErrorTypeName(error.type) }}
                  </div>
                  <div class="error-severity" :class="`severity-${error.severity}`">
                    {{ getSeverityName(error.severity) }}
                  </div>
                  <div class="error-time">
                    {{ formatTime(error.timestamp) }}
                  </div>
                </div>
                
                <div class="error-message">{{ error.message }}</div>
              </div>
              
              <div v-if="expandedErrors.has(error.id)" class="error-details">
                <div class="error-details-section">
                  <h5>{{ $t('errorHandler.errorDetails') }}</h5>
                  <pre class="error-details-content">{{ JSON.stringify(error, null, 2) }}</pre>
                </div>
                
                <div class="error-actions">
                  <button @click.stop="retryError(error)" class="action-button">
                    {{ $t('errorHandler.retry') }}
                  </button>
                  <button @click.stop="copyError(error)" class="action-button">
                    {{ $t('errorHandler.copyError') }}
                  </button>
                  <button @click.stop="reportError(error)" class="action-button">
                    {{ $t('errorHandler.reportError') }}
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="filteredErrors.length === 0" class="no-errors">
              {{ $t('errorHandler.noErrors') }}
            </div>
          </div>
          
          <!-- 分页 -->
          <div v-if="totalPages > 1" class="error-pagination">
            <button 
              @click="currentPage--" 
              :disabled="currentPage <= 1"
              class="pagination-button"
            >
              {{ $t('errorHandler.previous') }}
            </button>
            
            <span class="pagination-info">
              {{ $t('errorHandler.pageInfo', { current: currentPage, total: totalPages }) }}
            </span>
            
            <button 
              @click="currentPage++" 
              :disabled="currentPage >= totalPages"
              class="pagination-button"
            >
              {{ $t('errorHandler.next') }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="error-handler-footer">
        <div class="error-handler-actions">
          <button @click="performHealthCheck" class="action-button">
            {{ $t('errorHandler.healthCheck') }}
          </button>
          <button @click="enableMonitoring" class="action-button">
            {{ monitoring.isEnabled ? $t('errorHandler.disableMonitoring') : $t('errorHandler.enableMonitoring') }}
          </button>
          <button @click="resetAllStats" class="action-button danger">
            {{ $t('errorHandler.resetStats') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useErrorMonitoring } from '../../composables/useErrorMonitoring'
import { useNotifications } from '../../composables/useNotifications'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close'])

// 状态
const currentPage = ref(1)
const pageSize = ref(10)
const selectedType = ref(null)
const expandedErrors = ref(new Set())

// 功能
const { 
  monitoring, 
  errorStats, 
  performHealthCheck: performSystemHealthCheck,
  resetStats,
  getErrorStats
} = useErrorMonitoring()

const { notifyInfo, notifySuccess, notifyError } = useNotifications()

// 计算属性
const filteredErrors = computed(() => {
  let errors = [...errorStats.recent]
  
  if (selectedType.value) {
    errors = errors.filter(error => error.type === selectedType.value)
  }
  
  return errors
})

const totalPages = computed(() => {
  return Math.ceil(filteredErrors.value.length / pageSize.value)
})

const paginatedErrors = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredErrors.value.slice(start, end)
})

const recentErrorsCount = computed(() => {
  const oneHourAgo = Date.now() - 3600000
  return errorStats.recent.filter(error => 
    new Date(error.timestamp).getTime() > oneHourAgo
  ).length
})

const severityClass = computed(() => {
  return errorStats.bySeverity.critical > 0 ? 'text-danger' : 'text-success'
})

// 方法
const close = () => {
  emit('close')
}

const handleOverlayClick = () => {
  close()
}

const toggleErrorExpansion = (errorId) => {
  if (expandedErrors.value.has(errorId)) {
    expandedErrors.value.delete(errorId)
  } else {
    expandedErrors.value.add(errorId)
  }
}

const filterByType = (type) => {
  selectedType.value = selectedType.value === type ? null : type
  currentPage.value = 1
}

const getErrorTypeName = (type) => {
  const typeNames = {
    NETWORK_ERROR: '网络错误',
    VALIDATION_ERROR: '验证错误',
    AUTHORIZATION_ERROR: '授权错误',
    NOT_FOUND_ERROR: '未找到错误',
    SERVER_ERROR: '服务器错误',
    CLIENT_ERROR: '客户端错误',
    UNKNOWN_ERROR: '未知错误'
  }
  return typeNames[type] || type
}

const getSeverityName = (severity) => {
  const severityNames = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重'
  }
  return severityNames[severity] || severity
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 小于1分钟
    return '刚刚'
  } else if (diff < 3600000) { // 小于1小时
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 小于1天
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleString()
  }
}

const getUptime = () => {
  const uptime = Date.now() - errorStats.uptime
  const hours = Math.floor(uptime / 3600000)
  const minutes = Math.floor((uptime % 3600000) / 60000)
  return `${hours}小时${minutes}分钟`
}

const clearRecentErrors = () => {
  errorStats.recent = []
  notifySuccess('最近错误记录已清空')
}

const exportErrors = () => {
  try {
    const data = {
      exportTime: new Date().toISOString(),
      errorStats: getErrorStats(),
      errors: filteredErrors.value
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-log-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    
    URL.revokeObjectURL(url)
    notifySuccess('错误日志已导出')
  } catch (error) {
    notifyError('导出失败')
  }
}

const retryError = async (error) => {
  try {
    // 这里应该根据错误类型执行相应的重试逻辑
    notifyInfo('重试功能开发中...')
  } catch (err) {
    notifyError('重试失败')
  }
}

const copyError = async (error) => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(error, null, 2))
    notifySuccess('错误信息已复制到剪贴板')
  } catch (err) {
    notifyError('复制失败')
  }
}

const reportError = async (error) => {
  try {
    await fetch('/api/error-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(error)
    })
    
    notifySuccess('错误报告已发送')
  } catch (err) {
    notifyError('报告发送失败')
  }
}

const performHealthCheck = async () => {
  const isHealthy = await performSystemHealthCheck()
  if (isHealthy) {
    notifySuccess('系统健康检查通过')
  } else {
    notifyError('系统健康检查发现问题')
  }
}

const enableMonitoring = () => {
  monitoring.isEnabled = !monitoring.isEnabled
  notifyInfo(`错误监控已${monitoring.isEnabled ? '启用' : '禁用'}`)
}

const resetAllStats = () => {
  if (confirm('确定要重置所有统计数据吗？此操作不可撤销。')) {
    resetStats()
    notifySuccess('统计数据已重置')
  }
}

// 监听显示状态
watch(() => props.visible, (visible) => {
  if (visible) {
    // 重置分页
    currentPage.value = 1
    expandedErrors.value.clear()
  }
})

// 生命周期
onMounted(() => {
  // 监听错误事件
  document.addEventListener('app:error', () => {
    // 如果对话框打开，滚动到顶部
    if (props.visible) {
      currentPage.value = 1
    }
  })
})

onUnmounted(() => {
  // 清理资源
})
</script>

<style scoped>
.error-handler-modal {
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

.error-handler-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.error-handler-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.error-handler-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.error-handler-close {
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

.error-handler-close:hover {
  background: #f5f5f5;
  color: #595959;
}

.error-handler-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

/* 错误概览 */
.error-overview {
  margin-bottom: 24px;
}

.error-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #f0f0f0;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.stat-value.text-danger {
  color: #ff4d4f;
}

.stat-value.text-success {
  color: #52c41a;
}

.stat-label {
  font-size: 12px;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 错误分布 */
.error-distribution {
  margin-bottom: 24px;
}

.error-distribution h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.error-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.error-type-item {
  padding: 12px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-type-item:hover {
  border-color: #1890ff;
}

.error-type-item.active {
  border-color: #1890ff;
  background: #e6f7ff;
}

.error-type-name {
  font-size: 14px;
  color: #262626;
}

.error-type-count {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

/* 最近错误 */
.recent-errors {
  margin-bottom: 24px;
}

.recent-errors-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.recent-errors-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.recent-errors-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.action-button.danger {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.action-button.danger:hover {
  background: #ff4d4f;
  color: white;
}

/* 错误列表 */
.error-list {
  max-height: 400px;
  overflow-y: auto;
}

.error-item {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.error-item:hover {
  border-color: #d9d9d9;
}

.error-item.expanded {
  border-color: #1890ff;
}

.error-main {
  padding: 12px 16px;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.error-type-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.error-type-network { background: #f6ffed; color: #52c41a; }
.error-type-validation { background: #fff7e6; color: #fa8c16; }
.error-type-authorization { background: #fff1f0; color: #ff4d4f; }
.error-type-server { background: #fff1f0; color: #ff4d4f; }
.error-type-client { background: #e6f7ff; color: #1890ff; }
.error-type-unknown { background: #f5f5f5; color: #595959; }

.error-severity {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-low { background: #f6ffed; color: #52c41a; }
.severity-medium { background: #fff7e6; color: #fa8c16; }
.severity-high { background: #fff1f0; color: #ff4d4f; }
.severity-critical { background: #fff1f0; color: #a8071a; }

.error-time {
  margin-left: auto;
  font-size: 11px;
  color: #8c8c8c;
}

.error-message {
  font-size: 14px;
  color: #262626;
  line-height: 1.5;
}

.error-details {
  border-top: 1px solid #f0f0f0;
  padding: 16px;
  background: #fafafa;
}

.error-details-section {
  margin-bottom: 16px;
}

.error-details-section h5 {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #595959;
}

.error-details-content {
  background: #1f1f1f;
  color: #f0f0f0;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}

.error-actions {
  display: flex;
  gap: 8px;
}

.no-errors {
  text-align: center;
  padding: 40px;
  color: #8c8c8c;
  font-size: 14px;
}

/* 分页 */
.error-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.pagination-button {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-button:not(:disabled):hover {
  border-color: #1890ff;
  color: #1890ff;
}

.pagination-info {
  font-size: 12px;
  color: #8c8c8c;
}

.error-handler-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.error-handler-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* 深色主题 */
.dark .error-handler-content {
  background: #1f1f1f;
  color: #f0f0f0;
}

.dark .error-handler-header {
  border-bottom-color: #333333;
  background: #262626;
}

.dark .error-handler-header h3 {
  color: #f0f0f0;
}

.dark .stat-item {
  background: #262626;
  border-color: #333333;
}

.dark .stat-value {
  color: #f0f0f0;
}

.dark .error-distribution h4 {
  color: #f0f0f0;
}

.dark .error-type-item {
  border-color: #404040;
  background: #262626;
}

.dark .error-type-item:hover {
  border-color: #177ddc;
}

.dark .error-type-item.active {
  border-color: #177ddc;
  background: #0c1117;
}

.dark .error-header {
  border-bottom-color: #333333;
}

.dark .error-item {
  border-color: #333333;
}

.dark .error-item:hover {
  border-color: #404040;
}

.dark .error-item.expanded {
  border-color: #177ddc;
}

.dark .error-message {
  color: #f0f0f0;
}

.dark .error-details {
  border-top-color: #333333;
  background: #262626;
}

.dark .error-details-section h5 {
  color: #a6a6a6;
}

.dark .error-details-content {
  background: #0c1117;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-handler-content {
    width: 98%;
    max-height: 95vh;
  }
  
  .error-handler-header,
  .error-handler-body,
  .error-handler-footer {
    padding: 16px;
  }
  
  .error-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .error-types-grid {
    grid-template-columns: 1fr;
  }
  
  .error-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .error-time {
    margin-left: 0;
  }
  
  .error-handler-actions {
    flex-direction: column;
  }
}
</style>