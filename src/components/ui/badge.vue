<template>
  <component
    :is="wrapperComponent"
    :class="badgeClasses"
    :to="to"
    :href="href"
    :target="target"
  >
    <span v-if="dot" class="badge-dot"></span>
    <span v-else-if="!hideCount && count !== undefined" class="badge-count">{{ displayCount }}</span>
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

// Props
const props = defineProps({
  // 数量相关
  count: {
    type: [Number, String],
    default: 0
  },
  overflowCount: {
    type: Number,
    default: 99
  },
  dot: {
    type: Boolean,
    default: false
  },
  hideCount: {
    type: Boolean,
    default: false
  },
  
  // 样式相关
  color: {
    type: String,
    default: '#ff4d4f' // 默认红色
  },
  textColor: {
    type: String,
    default: '#ffffff'
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['small', 'default', 'large'].includes(value)
  },
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'danger', 'info'].includes(value)
  },
  
  // 交互相关
  showZero: {
    type: Boolean,
    default: false
  },
  offset: {
    type: Array,
    default: () => [0, 0]
  },
  
  // 链接相关
  to: {
    type: [String, Object],
    default: null
  },
  href: {
    type: String,
    default: null
  },
  target: {
    type: String,
    default: '_self'
  }
})

// 计算属性
const wrapperComponent = computed(() => {
  if (props.to) return RouterLink
  if (props.href) return 'a'
  return 'span'
})

const displayCount = computed(() => {
  if (typeof props.count === 'string') {
    return props.count
  }
  
  if (props.count > props.overflowCount) {
    return `${props.overflowCount}+`
  }
  
  return props.count.toString()
})

const badgeClasses = computed(() => {
  return [
    'badge-wrapper',
    {
      'badge-dot': props.dot,
      'badge-has-count': !props.dot && !props.hideCount && (props.count !== 0 || props.showZero),
      'badge-small': props.size === 'small',
      'badge-large': props.size === 'large',
      [`badge-${props.type}`]: props.type !== 'primary' && !props.dot
    }
  ]
})

const badgeStyle = computed(() => {
  const style = {}
  
  // 如果是dot类型
  if (props.dot) {
    style.backgroundColor = props.color
    if (props.size === 'small') {
      style.width = '6px'
      style.height = '6px'
    } else if (props.size === 'large') {
      style.width = '10px'
      style.height = '10px'
    } else {
      style.width = '8px'
      style.height = '8px'
    }
  }
  
  // 如果是数字类型
  if (!props.dot && !props.hideCount && (props.count !== 0 || props.showZero)) {
    style.backgroundColor = props.color
    style.color = props.textColor
  }
  
  // 偏移
  if (props.offset && props.offset.length === 2) {
    style.top = `${props.offset[1]}px`
    style.right = `${-props.offset[0]}px`
  }
  
  return style
})
</script>

<style scoped>
.badge-wrapper {
  position: relative;
  display: inline-block;
  line-height: 1;
}

.badge-dot {
  display: inline-block;
  border-radius: 50%;
  background: #ff4d4f;
}

.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #ff4d4f;
  color: white;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* 尺寸变体 */
.badge-small .badge-count {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  border-radius: 8px;
}

.badge-large .badge-count {
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  font-size: 14px;
  border-radius: 12px;
}

/* 类型变体 */
.badge-success .badge-count {
  background-color: #52c41a;
}

.badge-warning .badge-count {
  background-color: #faad14;
}

.badge-danger .badge-count {
  background-color: #ff4d4f;
}

.badge-info .badge-count {
  background-color: #1890ff;
}

/* 悬停效果 */
.badge-wrapper:hover .badge-dot {
  opacity: 0.8;
}

.badge-wrapper:hover .badge-count {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}

/* 点击效果 */
.badge-wrapper:active .badge-count {
  transform: scale(0.95);
}

/* 响应式 */
@media (max-width: 768px) {
  .badge-count {
    font-size: 10px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
  }
  
  .badge-large .badge-count {
    font-size: 12px;
    min-width: 20px;
    height: 20px;
  }
}
</style>