<template>
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ol class="breadcrumb-list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="breadcrumb-item"
        :class="{ 'breadcrumb-item--current': index === items.length - 1 }"
      >
        <component
          :is="index === items.length - 1 ? 'span' : 'button'"
          :class="['breadcrumb-link', { 'breadcrumb-link--clickable': index < items.length - 1 }]"
          :disabled="index === items.length - 1"
          @click="index < items.length - 1 && handleClick(item, index)"
        >
          <span v-if="item.icon" class="breadcrumb-icon">{{ item.icon }}</span>
          {{ item.label }}
        </component>
        
        <ChevronRightIcon v-if="index < items.length - 1" class="breadcrumb-separator" />
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['click'])

// 简单的右箭头图标
const ChevronRightIcon = {
  template: '<span class="chevron-icon">›</span>'
}

const handleClick = (item, index) => {
  emit('click', item, index)
}
</script>

<style scoped>
.breadcrumb {
  font-size: 14px;
  line-height: 1.5;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-item:not(:last-child) {
  margin-right: 8px;
}

.breadcrumb-link {
  background: none;
  border: none;
  padding: 4px 8px;
  margin: 0;
  font-size: inherit;
  color: #1890ff;
  cursor: default;
  transition: all 0.2s ease;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb-link--clickable {
  cursor: pointer;
}

.breadcrumb-link--clickable:hover {
  background: rgba(24, 144, 255, 0.1);
  color: #40a9ff;
}

.breadcrumb-item--current .breadcrumb-link {
  color: #595959;
  cursor: default;
}

.breadcrumb-item--current .breadcrumb-link:hover {
  background: transparent;
  color: #595959;
}

.breadcrumb-icon {
  font-size: 16px;
}

.breadcrumb-separator {
  color: #8c8c8c;
  margin-left: 8px;
  font-size: 14px;
}

.chevron-icon {
  color: #8c8c8c;
  font-weight: normal;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .breadcrumb-link {
    padding: 2px 4px;
    font-size: 13px;
  }
  
  .breadcrumb-separator {
    margin-left: 4px;
  }
}
</style>