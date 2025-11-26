<template>
  <div 
    ref="containerRef"
    class="virtual-list-container"
    :style="containerStyle"
    @scroll="handleScroll"
  >
    <div 
      class="virtual-list-spacer"
      :style="spacerStyle"
    ></div>
    
    <div 
      class="virtual-list-content"
      :style="contentStyle"
    >
      <div
        v-for="(item, index) in visibleItems"
        :key="getItemKey(item, index)"
        :style="getItemStyle(index)"
        class="virtual-list-item"
        @click="$emit('item-click', item, index + startIndex)"
      >
        <slot 
          name="item" 
          :item="item" 
          :index="index + startIndex"
          :is-visible="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  // 数据源
  items: {
    type: Array,
    required: true
  },
  
  // 列表项高度
  itemHeight: {
    type: Number,
    required: true
  },
  
  // 容器高度
  height: {
    type: [Number, String],
    default: 400
  },
  
  // 缓冲区大小（额外渲染的项数）
  buffer: {
    type: Number,
    default: 5
  },
  
  // 获取项唯一键的函数
  getItemKey: {
    type: Function,
    default: (item, index) => item.id || index
  },
  
  // 滚动方向
  direction: {
    type: String,
    default: 'vertical', // 'vertical' | 'horizontal'
    validator: (value) => ['vertical', 'horizontal'].includes(value)
  }
})

const emit = defineEmits(['scroll', 'item-click'])

// DOM引用
const containerRef = ref(null)

// 滚动相关状态
const scrollTop = ref(0)
const scrollLeft = ref(0)
const containerSize = ref(0)

// 计算属性
const totalItems = computed(() => props.items.length)
const totalSize = computed(() => totalItems.value * props.itemHeight)

const startIndex = computed(() => {
  const scrollPos = props.direction === 'vertical' ? scrollTop.value : scrollLeft.value
  return Math.floor(scrollPos / props.itemHeight)
})

const endIndex = computed(() => {
  const visibleCount = Math.ceil(containerSize.value / props.itemHeight)
  return Math.min(startIndex.value + visibleCount + props.buffer, totalItems.value)
})

const visibleItems = computed(() => {
  const items = []
  const start = Math.max(0, startIndex.value - props.buffer)
  const end = Math.min(endIndex.value, totalItems.value)
  
  for (let i = start; i < end; i++) {
    items.push(props.items[i])
  }
  
  return items
})

const offsetY = computed(() => {
  return Math.max(0, startIndex.value - props.buffer) * props.itemHeight
})

const visibleCount = computed(() => {
  return Math.ceil(containerSize.value / props.itemHeight) + (props.buffer * 2)
})

// 样式计算
const containerStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  overflow: 'auto',
  position: 'relative'
}))

const spacerStyle = computed(() => ({
  height: `${totalSize.value}px`,
  width: '100%'
}))

const contentStyle = computed(() => ({
  position: 'absolute',
  top: props.direction === 'vertical' ? `${offsetY.value}px` : '0',
  left: props.direction === 'horizontal' ? `${offsetY.value}px` : '0',
  width: '100%'
}))

const getItemStyle = (index) => {
  const actualIndex = startIndex.value - props.buffer + index
  return {
    height: `${props.itemHeight}px`,
    position: 'absolute',
    top: `${actualIndex * props.itemHeight}px`,
    left: '0',
    width: '100%'
  }
}

// 事件处理
const handleScroll = (event) => {
  const target = event.target
  scrollTop.value = target.scrollTop
  scrollLeft.value = target.scrollLeft
  emit('scroll', {
    scrollTop: scrollTop.value,
    scrollLeft: scrollLeft.value,
    startIndex: startIndex.value,
    endIndex: endIndex.value,
    visibleItems: visibleItems.value.length
  })
}

// 更新容器尺寸
const updateContainerSize = () => {
  if (!containerRef.value) return
  
  const rect = containerRef.value.getBoundingClientRect()
  containerSize.value = props.direction === 'vertical' ? rect.height : rect.width
}

// 滚动到指定位置
const scrollToItem = (index, behavior = 'smooth') => {
  if (!containerRef.value || index < 0 || index >= totalItems.value) return
  
  const scrollPos = index * props.itemHeight
  const scrollOptions = {
    behavior,
    [props.direction === 'vertical' ? 'top' : 'left']: scrollPos
  }
  
  containerRef.value.scrollTo(scrollOptions)
}

// 滚动到顶部
const scrollToTop = (behavior = 'smooth') => {
  scrollToItem(0, behavior)
}

// 滚动到底部
const scrollToBottom = (behavior = 'smooth') => {
  scrollToItem(totalItems.value - 1, behavior)
}

// 监听尺寸变化
let resizeObserver = null

const setupResizeObserver = () => {
  if (!containerRef.value || typeof ResizeObserver === 'undefined') return
  
  resizeObserver = new ResizeObserver(() => {
    updateContainerSize()
  })
  
  resizeObserver.observe(containerRef.value)
}

// 清理资源
const cleanup = () => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
}

// 监听items变化，重新计算
watch(() => props.items, () => {
  nextTick(() => {
    updateContainerSize()
  })
}, { deep: true })

// 生命周期
onMounted(() => {
  nextTick(() => {
    updateContainerSize()
    setupResizeObserver()
  })
})

onUnmounted(() => {
  cleanup()
})

// 暴露方法
defineExpose({
  scrollToItem,
  scrollToTop,
  scrollToBottom,
  getContainer: () => containerRef.value,
  updateSize: updateContainerSize
})
</script>

<style scoped>
.virtual-list-container {
  position: relative;
  overflow: auto;
}

.virtual-list-spacer {
  /* 这个元素用于撑起整个列表的高度 */
}

.virtual-list-content {
  /* 这个元素用于定位可见项目 */
}

.virtual-list-item {
  /* 列表项样式 */
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.virtual-list-item:hover {
  background-color: #fafafa;
}

/* 横向滚动样式 */
.virtual-list-container[data-direction="horizontal"] {
  overflow-x: auto;
  overflow-y: hidden;
}

.virtual-list-container[data-direction="horizontal"] .virtual-list-item {
  border-bottom: none;
  border-right: 1px solid #f0f0f0;
}

.virtual-list-container[data-direction="horizontal"] .virtual-list-item:last-child {
  border-right: none;
}

/* 滚动条样式优化 */
.virtual-list-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.virtual-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.virtual-list-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.virtual-list-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>