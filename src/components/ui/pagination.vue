<template>
  <div class="pagination-wrapper">
    <div class="pagination-info" v-if="showTotal">
      {{ formatTotal(total, range) }}
    </div>
    
    <div class="pagination-controls">
      <!-- 上一页 -->
      <button
        :disabled="current <= 1"
        @click="goToPage(current - 1)"
        class="pagination-btn pagination-prev"
        :class="{ disabled: current <= 1 }"
      >
        <span class="icon">←</span>
        <span class="text">上一页</span>
      </button>
      
      <!-- 页码 -->
      <div class="pagination-pages">
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="['pagination-page-btn', { active: page === current }]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>
      
      <!-- 下一页 -->
      <button
        :disabled="current >= totalPages"
        @click="goToPage(current + 1)"
        class="pagination-btn pagination-next"
        :class="{ disabled: current >= totalPages }"
      >
        <span class="text">下一页</span>
        <span class="icon">→</span>
      </button>
    </div>
    
    <!-- 页面大小选择器 -->
    <div v-if="showSizeChanger" class="pagination-size">
      <select
        :value="pageSize"
        @change="handlePageSizeChange($event.target.value)"
        class="page-size-select"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }} 条/页
        </option>
      </select>
    </div>
    
    <!-- 快速跳转 -->
    <div v-if="showQuickJumper" class="pagination-jumper">
      <span class="jumper-text">跳转到</span>
      <input
        v-model="jumpPage"
        type="number"
        min="1"
        :max="totalPages"
        @keypress.enter="handleQuickJumper"
        class="jumper-input"
        placeholder="页码"
      />
      <span class="jumper-text">页</span>
      <button @click="handleQuickJumper" class="jumper-btn">确定</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

// Props
const props = defineProps({
  // 分页数据
  current: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  total: {
    type: Number,
    default: 0
  },
  
  // 显示选项
  showSizeChanger: {
    type: Boolean,
    default: false
  },
  showQuickJumper: {
    type: Boolean,
    default: false
  },
  showTotal: {
    type: Boolean,
    default: true
  },
  
  // 页面大小选项
  pageSizeOptions: {
    type: Array,
    default: () => ['10', '20', '50', '100']
  }
})

// Emits
const emit = defineEmits(['change', 'show-size-change'])

// 响应式数据
const jumpPage = ref('')

// 计算属性
const totalPages = computed(() => {
  return Math.ceil(props.total / props.pageSize)
})

const visiblePages = computed(() => {
  const pages = []
  const current = props.current
  const total = totalPages.value
  
  if (total <= 7) {
    // 如果总页数不超过7页，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 复杂分页逻辑
    if (current <= 4) {
      // 当前页在前面
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      // 当前页在后面
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // 当前页在中间
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const range = computed(() => {
  const start = (props.current - 1) * props.pageSize + 1
  const end = Math.min(start + props.pageSize - 1, props.total)
  return [start, end]
})

// 方法
const goToPage = (page) => {
  if (page < 1 || page > totalPages.value || page === props.current) {
    return
  }
  
  emit('change', page, props.pageSize)
}

const handlePageSizeChange = (newSize) => {
  emit('show-size-change', props.current, parseInt(newSize))
}

const handleQuickJumper = () => {
  const page = parseInt(jumpPage.value)
  if (page && page >= 1 && page <= totalPages.value) {
    goToPage(page)
    jumpPage.value = ''
  }
}

const formatTotal = (total, range) => {
  const [start, end] = range
  return `第 ${start}-${end} 条，共 ${total} 条`
}

// 监听jumpPage变化，当页面改变时重置
watch(() => props.current, () => {
  jumpPage.value = ''
})
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 14px;
}

.pagination-info {
  color: #8c8c8c;
  white-space: nowrap;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-pages {
  display: flex;
  gap: 4px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  background: white;
  color: #1a1a1a;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  min-width: 70px;
  justify-content: center;
}

.pagination-btn:hover:not(.disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.pagination-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #8c8c8c;
}

.pagination-btn.disabled:hover {
  border-color: #d9d9d9;
  color: #8c8c8c;
}

.pagination-prev .icon,
.pagination-next .icon {
  font-size: 12px;
}

.pagination-page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  background: white;
  color: #1a1a1a;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-page-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.pagination-page-btn.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.pagination-page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pagination-size {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.pagination-jumper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.jumper-text {
  color: #8c8c8c;
  font-size: 14px;
  white-space: nowrap;
}

.jumper-input {
  width: 50px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.jumper-btn {
  padding: 4px 12px;
  border: 1px solid #1890ff;
  background: #1890ff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.jumper-btn:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pagination-wrapper {
    flex-direction: column;
    gap: 12px;
  }
  
  .pagination-controls {
    order: -1;
  }
  
  .pagination-btn {
    padding: 4px 8px;
    font-size: 13px;
    min-width: 60px;
  }
  
  .pagination-page-btn {
    min-width: 28px;
    height: 28px;
    font-size: 13px;
  }
  
  .jumper-input {
    width: 40px;
    font-size: 13px;
  }
  
  .jumper-btn {
    font-size: 13px;
    padding: 4px 8px;
  }
}

@media (max-width: 480px) {
  .pagination-pages {
    gap: 2px;
  }
  
  .pagination-page-btn {
    min-width: 24px;
    height: 24px;
    font-size: 12px;
  }
  
  .pagination-btn {
    min-width: 50px;
  }
  
  .pagination-info {
    font-size: 12px;
  }
  
  .jumper-text {
    font-size: 12px;
  }
}
</style>