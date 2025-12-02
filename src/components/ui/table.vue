<template>
  <div class="table-wrapper">
    <div v-if="title || $slots.title" class="table-header">
      <div v-if="title || $slots.title" class="table-title">
        <slot name="title">
          {{ title }}
        </slot>
      </div>
      <div v-if="$slots.extra" class="table-extra">
        <slot name="extra" />
      </div>
    </div>
    
    <div class="table-container">
      <table :class="tableClasses">
        <thead v-if="showHeader !== false">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key || column.dataIndex"
              :class="getHeaderClass(column)"
              :style="getHeaderStyle(column)"
            >
              {{ column.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(record, index) in dataSource"
            :key="record.key || index"
            :class="getRowClass(record, index)"
            @click="handleRowClick(record, index)"
            @dblclick="handleRowDoubleClick(record, index)"
          >
            <td
              v-for="column in columns"
              :key="column.key || column.dataIndex"
              :class="getCellClass(record, index, column)"
              @click="handleCellClick(record, index, column)"
            >
              <slot
                name="bodyCell"
                :column="column"
                :record="record"
                :index="index"
                :text="getCellValue(record, column)"
              >
                {{ getCellValue(record, column) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="loading" class="table-loading">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <span>{{ loadingText || '加载中...' }}</span>
      </div>
    </div>
    
    <div v-if="!loading && (!dataSource || dataSource.length === 0)" class="table-empty">
          <div class="empty-content">
            <LucideIcon name="FileText" class="h-8 w-8 text-muted-foreground" />
            <p>{{ emptyText || '暂无数据' }}</p>
          </div>
        </div>
    
    <div v-if="pagination && pagination !== false" class="table-pagination">
      <div class="pagination-info">
        <span v-if="showTotal">
          显示 {{ startRecord }}-{{ endRecord }} 条，共 {{ total }} 条
        </span>
      </div>
      <div class="pagination-controls">
        <button
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
          class="pagination-btn"
        >
          <span class="icon">←</span>
          上一页
        </button>
        
        <div class="pagination-pages">
          <button
            v-for="page in visiblePages"
            :key="page"
            :class="['pagination-page-btn', { active: page === currentPage }]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
          class="pagination-btn"
        >
          下一页
          <span class="icon">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import LucideIcon from './LucideIcon.vue'

// Props
const props = defineProps({
  // 数据
  dataSource: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    required: true
  },
  
  // 样式
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['small', 'default', 'large'].includes(value)
  },
  bordered: {
    type: Boolean,
    default: false
  },
  striped: {
    type: Boolean,
    default: false
  },
  showHeader: {
    type: Boolean,
    default: undefined
  },
  
  // 标题
  title: {
    type: String,
    default: ''
  },
  
  // 加载和空状态
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: ''
  },
  emptyText: {
    type: String,
    default: ''
  },
  
  // 分页
  pagination: {
    type: [Boolean, Object],
    default: false
  },
  showTotal: {
    type: Boolean,
    default: true
  },
  
  // 行选择
  rowSelection: {
    type: Object,
    default: null
  },
  selectedRowKeys: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'change',
  'rowClick',
  'rowDoubleClick',
  'cellClick',
  'selectionChange'
])

// 计算属性
const tableClasses = computed(() => {
  return [
    'data-table',
    `table-${props.size}`,
    {
      'table-bordered': props.bordered,
      'table-striped': props.striped
    }
  ]
})

// 分页相关计算
const currentPage = computed(() => {
  return props.pagination?.current || 1
})

const pageSize = computed(() => {
  return props.pagination?.pageSize || 10
})

const total = computed(() => {
  return props.pagination?.total || props.dataSource.length
})

const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize.value)
})

const startRecord = computed(() => {
  return (currentPage.value - 1) * pageSize.value + 1
})

const endRecord = computed(() => {
  return Math.min(currentPage.value * pageSize.value, total.value)
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// 方法
const getCellValue = (record, column) => {
  if (column.customRender) {
    return column.customRender(record)
  }
  return record[column.dataIndex]
}

const getHeaderClass = (column) => {
  return [
    'table-header-cell',
    column.className || '',
    column.align ? `text-${column.align}` : ''
  ]
}

const getHeaderStyle = (column) => {
  const style = {}
  if (column.width) {
    style.width = typeof column.width === 'number' ? `${column.width}px` : column.width
    style.minWidth = style.width
    style.maxWidth = style.width
  }
  if (column.fixed) {
    style.position = 'sticky'
    if (column.fixed === 'left') {
      style.left = '0'
      style.zIndex = '10'
    } else if (column.fixed === 'right') {
      style.right = '0'
      style.zIndex = '10'
    }
  }
  return style
}

const getRowClass = (record, index) => {
  return [
    'table-row',
    {
      'row-selected': props.selectedRowKeys.includes(record.key),
      'row-clickable': !!props.rowSelection || props.loading
    }
  ]
}

const getCellClass = (record, index, column) => {
  return [
    'table-cell',
    column.className || '',
    column.align ? `text-${column.align}` : ''
  ]
}

const handleRowClick = (record, index) => {
  emit('rowClick', record, index)
}

const handleRowDoubleClick = (record, index) => {
  emit('rowDoubleClick', record, index)
}

const handleCellClick = (record, index, column) => {
  emit('cellClick', record, index, column)
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    emit('change', {
      ...props.pagination,
      current: page,
      pageSize: pageSize.value
    })
  }
}

// 监听选中行变化
watch(() => props.selectedRowKeys, (newKeys) => {
  if (props.rowSelection) {
    emit('selectionChange', newKeys)
  }
})
</script>

<style scoped>
.table-wrapper {
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 表格头部 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.table-extra {
  margin-left: auto;
}

/* 表格容器 */
.table-container {
  overflow-x: auto;
  position: relative;
}

/* 表格基础样式 */
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.table-header-cell {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  font-weight: 600;
  color: #1a1a1a;
  text-align: left;
  white-space: nowrap;
  font-size: 14px;
}

.table-cell {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
  font-size: 14px;
  color: #1a1a1a;
}

/* 表格尺寸变体 */
.table-small .table-header-cell,
.table-small .table-cell {
  padding: 8px 12px;
  font-size: 13px;
}

.table-large .table-header-cell,
.table-large .table-cell {
  padding: 16px 20px;
  font-size: 15px;
}

/* 行悬停效果 */
.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #fafafa;
}

.table-row.row-clickable {
  cursor: pointer;
}

.table-row.row-selected {
  background-color: #e6f7ff;
}

/* 表格条纹 */
.table-striped .table-row:nth-child(even) {
  background-color: #fafafa;
}

.table-striped .table-row:nth-child(even):hover {
  background-color: #f0f0f0;
}

/* 边框 */
.table-bordered {
  border: 1px solid #f0f0f0;
}

.table-bordered .table-header-cell {
  border-right: 1px solid #f0f0f0;
}

.table-bordered .table-cell {
  border-right: 1px solid #f0f0f0;
}

.table-bordered .table-row:last-child .table-cell {
  border-bottom: 1px solid #f0f0f0;
}

/* 文本对齐 */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

/* 加载状态 */
.table-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1890ff;
  font-size: 14px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f0f0f0;
  border-top: 2px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.table-empty {
  padding: 40px 20px;
  text-align: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #8c8c8c;
}

.empty-icon {
  margin-bottom: 8px;
}

/* 分页 */
.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.pagination-info {
  font-size: 14px;
  color: #8c8c8c;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pagination-pages {
  display: flex;
  gap: 4px;
}

.pagination-btn,
.pagination-page-btn {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  background: white;
  color: #1a1a1a;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.pagination-btn:hover:not(:disabled) {
  background: #f0f2f5;
  border-color: #1890ff;
  color: #1890ff;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-page-btn {
  min-width: 32px;
  text-align: center;
}

.pagination-page-btn:hover {
  background: #f0f2f5;
  border-color: #1890ff;
  color: #1890ff;
}

.pagination-page-btn.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

/* 响应式 */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .table-extra {
    margin-left: 0;
  }
  
  .table-pagination {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .pagination-controls {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .pagination-pages {
    order: -1;
  }
}
</style>