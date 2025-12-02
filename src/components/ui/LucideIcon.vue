<template>
  <component 
    :is="iconComponent" 
    :size="size"
    :color="color"
    :stroke-width="strokeWidth"
    :class="className"
    v-bind="$attrs"
  />
</template>

<script setup>
import { computed } from 'vue'
import * as Icons from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [Number, String],
    default: 24
  },
  color: {
    type: String,
    default: 'currentColor'
  },
  strokeWidth: {
    type: [Number, String],
    default: 2
  },
  className: {
    type: String,
    default: ''
  }
})

const iconComponent = computed(() => {
  // 尝试从多种可能的名称中匹配图标
  const possibleNames = [
    props.name,
    props.name + 'Icon',
    props.name.replace(/([A-Z])/g, '_$1').toUpperCase(),
    props.name.replace(/([a-z])([A-Z])/g, '$1$2').toLowerCase()
  ]
  
  for (const name of possibleNames) {
    if (Icons[name]) {
      return Icons[name]
    }
  }
  
  // 如果找不到匹配的图标，使用默认图标
  console.warn(`图标 "${props.name}" 未找到，使用默认图标`)
  return Icons.HelpCircle
})
</script>

<style scoped>
/* 确保图标正确渲染 */
svg {
  display: inline-block;
  vertical-align: middle;
}
</style>