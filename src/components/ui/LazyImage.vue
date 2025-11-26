<template>
  <div 
    class="lazy-image-container" 
    :class="containerClass"
    ref="containerRef"
  >
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-placeholder">
      <div class="loading-skeleton"></div>
    </div>
    
    <!-- 实际图片 -->
    <img
      v-if="shouldLoadImage"
      ref="imageRef"
      :src="optimizedSrc"
      :alt="alt"
      :class="imageClass"
      :style="imageStyle"
      @load="handleImageLoad"
      @error="handleImageError"
      @click="$emit('click', $event)"
    />
    
    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error-placeholder">
      <div class="error-icon">{{ errorIcon }}</div>
      <span v-if="showErrorText" class="error-text">{{ errorText }}</span>
    </div>
    
    <!-- 占位符（可选） -->
    <div v-if="showPlaceholder && !shouldLoadImage && !hasError" class="placeholder">
      <slot name="placeholder">
        <div class="default-placeholder"></div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  // 图片源
  src: {
    type: String,
    required: true
  },
  
  // 优化后的图片源（可选）
  optimizedSrc: {
    type: String,
    default: null
  },
  
  alt: {
    type: String,
    default: ''
  },
  
  // 懒加载触发点（相对于视口的像素）
  rootMargin: {
    type: String,
    default: '50px'
  },
  
  // 阈值（0-1）
  threshold: {
    type: Number,
    default: 0.1
  },
  
  // 是否立即加载（不懒加载）
  immediate: {
    type: Boolean,
    default: false
  },
  
  // 占位符
  placeholder: {
    type: String,
    default: null
  },
  
  showPlaceholder: {
    type: Boolean,
    default: true
  },
  
  // 错误处理
  showErrorText: {
    type: Boolean,
    default: false
  },
  
  errorIcon: {
    type: String,
    default: '🖼️'
  },
  
  errorText: {
    type: String,
    default: 'Image failed to load'
  },
  
  // CSS类
  containerClass: {
    type: String,
    default: ''
  },
  
  imageClass: {
    type: String,
    default: ''
  },
  
  // 样式
  imageStyle: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['load', 'error', 'click'])

// 响应式状态
const containerRef = ref(null)
const imageRef = ref(null)
const isVisible = ref(false)
const isLoading = ref(true)
const hasError = ref(false)
const isInView = ref(false)

// 计算属性
const finalSrc = computed(() => props.optimizedSrc || props.src)

const shouldLoadImage = computed(() => {
  if (props.immediate) return true
  return isInView.value && !hasError.value
})

// 观察器
let observer = null

// 初始化观察器
const initObserver = () => {
  if (!containerRef.value || props.immediate) return
  
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isInView.value = true
          observer.unobserve(entry.target)
        }
      })
    },
    {
      root: null,
      rootMargin: props.rootMargin,
      threshold: props.threshold
    }
  )
  
  observer.observe(containerRef.value)
}

// 清理观察器
const cleanupObserver = () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

// 图片加载处理
const handleImageLoad = (event) => {
  isLoading.value = false
  hasError.value = false
  
  // 添加加载完成的类
  if (imageRef.value) {
    imageRef.value.classList.add('loaded')
  }
  
  emit('load', event)
}

// 图片加载错误处理
const handleImageError = (event) => {
  isLoading.value = false
  hasError.value = true
  
  console.warn(`图片加载失败: ${props.src}`)
  emit('error', event)
}

// 预加载图片
const preloadImage = () => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = finalSrc.value
  })
}

// 监听src变化
watch(() => props.src, async () => {
  isLoading.value = true
  hasError.value = false
  isInView.value = false
  
  if (props.immediate) {
    try {
      await preloadImage()
      isLoading.value = false
    } catch (error) {
      handleImageError(error)
    }
  }
})

// 生命周期
onMounted(async () => {
  await nextTick()
  
  if (props.immediate) {
    // 立即加载模式
    try {
      await preloadImage()
      isLoading.value = false
    } catch (error) {
      handleImageError(error)
    }
  } else {
    // 懒加载模式
    initObserver()
  }
})

onUnmounted(() => {
  cleanupObserver()
})

// 暴露方法
defineExpose({
  reload: () => {
    isLoading.value = true
    hasError.value = false
    if (imageRef.value) {
      imageRef.value.src = finalSrc.value
    }
  },
  
  forceLoad: () => {
    isInView.value = true
  },
  
  getImageElement: () => imageRef.value
})
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

/* 加载占位符 */
.loading-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 错误占位符 */
.error-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.6;
}

.error-text {
  font-size: 12px;
  opacity: 0.7;
}

/* 占位符 */
.placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f5f5;
}

.default-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0),
              linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  opacity: 0.5;
}

/* 图片样式 */
.lazy-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.lazy-image-container img.loaded {
  opacity: 1;
}

.lazy-image-container img.error {
  opacity: 0;
}

/* 淡入动画 */
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .error-placeholder {
    font-size: 12px;
  }
  
  .error-icon {
    font-size: 24px;
  }
}
</style>