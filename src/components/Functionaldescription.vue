<template>
  <div class="file-upload-instructions">
    <div class="instructions-header">
      <div class="instructions-icon">
        <LucideIcon :name="iconName" size="16" />
      </div>
      <h4>{{ displayTitle }}</h4>
    </div>
    <div class="instructions-content">
      <div v-for="(item, index) in displayInstructions" :key="index" class="instructions-item">
        <LucideIcon :name="item.icon" />
        <span>{{ item.text }}</span>
      </div>
      <!-- 支持插槽自定义内容 -->
      <slot v-if="$slots.default"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import LucideIcon from './ui/LucideIcon.vue'

const { t } = useI18n()

// Props定义
const props = defineProps({
  displayTitle: String,  // 直接传递显示标题（最高优先级）
  title: String,
  instructions: Array,
  iconName: {  // 新增：图标名称
    type: String,
    default: 'Info'
  }
})

// 计算属性处理默认值
const displayTitle = computed(() => {
  return props.displayTitle || props.title || t('common_usageInstructions')
})

const displayInstructions = computed(() => {
  return props.instructions || []
})
</script>

<style scoped>
/* 组件样式已在全局样式中定义 */
/* 如需组件特定样式可在此添加 */
</style>