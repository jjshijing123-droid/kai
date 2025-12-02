<template>
  <div class="tabs-container">
    <div class="tabs-header">
      <div class="tabs-list">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-trigger', { 'tab-active': currentTab === tab.key }]"
          @click="currentTab = tab.key"
        >
          <slot name="tab" :tab="tab">
            {{ tab.label }}
          </slot>
        </button>
      </div>
    </div>
    
    <div class="tabs-content">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        v-show="currentTab === tab.key"
        class="tab-content"
      >
        <slot :name="`content-${tab.key}`">
          <component :is="tab.content" v-bind="tab.props" />
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps } from 'vue'

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  },
  defaultTab: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'line' // line, card, edit-card
  }
})

const currentTab = ref(props.defaultTab || (props.tabs.length > 0 ? props.tabs[0].key : ''))

// 监听defaultTab变化
watch(() => props.defaultTab, (newVal) => {
  if (newVal) {
    currentTab.value = newVal
  }
}, { immediate: true })
</script>

<style scoped>
.tabs-container {
  width: 100%;
}

.tabs-header {
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.tabs-list {
  display: flex;
  gap: 4px;
}

.tab-trigger {
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #8c8c8c;
  white-space: nowrap;
}

.tab-trigger:hover {
  color: #1890ff;
}

.tab-active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 500;
}

.tabs-content {
  min-height: 200px;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Card类型样式 */
.tabs-container.card-type .tabs-header {
  margin-bottom: 0;
}

.tabs-container.card-type .tabs-list {
  background: #fafafa;
  padding: 4px;
  border-radius: 8px 8px 0 0;
}

.tabs-container.card-type .tab-trigger {
  padding: 8px 16px;
  background: transparent;
  border-radius: 6px;
  border: none;
  color: #8c8c8c;
}

.tabs-container.card-type .tab-trigger:hover {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
}

.tabs-container.card-type .tab-active {
  background: white;
  color: #1890ff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tabs-container.card-type .tabs-content {
  background: white;
  border-radius: 0 8px 8px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 24px;
}

/* 响应式 */
@media (max-width: 768px) {
  .tabs-list {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .tab-trigger {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>