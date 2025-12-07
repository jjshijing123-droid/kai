<template>
  <component
    :is="wrapperComponent"
    :class="badgeClasses"
    :to="to"
    :href="href"
    :target="target"
  >
    <span v-if="dot" class="badge-dot"></span>
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

// Props
const props = defineProps({
  // 样式相关
  dot: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#ff4d4f' // 默认红色
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

const badgeClasses = computed(() => {
  return [
    'badge-wrapper',
    {
      'badge-dot': props.dot,
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

/* 悬停效果 */
.badge-wrapper:hover .badge-dot {
  opacity: 0.8;
}
</style>