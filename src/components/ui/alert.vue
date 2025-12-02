<template>
  <div v-if="show" :class="alertClasses" :style="alertStyle" role="alert">
      <div class="alert-content">
        <div class="alert-icon">
          <LucideIcon v-if="showIcon && !icon" :name="defaultIconName" class="h-4 w-4" />
          <span v-else-if="icon">{{ icon }}</span>
          <span v-else-if="!showIcon"></span>
        </div>
        
        <div class="alert-message">
          <div v-if="title" class="alert-title">{{ title }}</div>
          <div v-if="message || $slots.default" class="alert-description">
            <slot>{{ message }}</slot>
          </div>
        </div>
        
        <div v-if="closable" class="alert-close" @click="handleClose">
          <X class="h-4 w-4" />
        </div>
      </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { Check, AlertTriangle, X, Info, X as XIcon } from 'lucide-vue-next'
import LucideIcon from './LucideIcon.vue'

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'warning', 'error', 'info'].includes(value)
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  icon: {
    type: String,
    default: ''
  },
  closable: {
    type: Boolean,
    default: false
  },
  closeText: {
    type: String,
    default: ''
  },
  bordered: {
    type: Boolean,
    default: true
  },
  filled: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close'])

// 计算属性
const alertClasses = computed(() => {
  return [
    'alert-wrapper',
    `alert-${props.type}`,
    {
      'alert-bordered': props.bordered,
      'alert-filled': props.filled,
      'alert-with-icon': props.showIcon
    }
  ]
})

const alertStyle = computed(() => {
  const style = {}
  
  if (props.type === 'success') {
    style.backgroundColor = props.filled ? '#f6ffed' : '#fff'
    style.borderColor = props.filled ? 'transparent' : '#b7eb8f'
    style.color = props.filled ? '#1d1d1f' : '#389e0d'
  } else if (props.type === 'warning') {
    style.backgroundColor = props.filled ? '#fff7e6' : '#fff'
    style.borderColor = props.filled ? 'transparent' : '#ffd591'
    style.color = props.filled ? '#1d1d1f' : '#d48806'
  } else if (props.type === 'error') {
    style.backgroundColor = props.filled ? '#fff2f0' : '#fff'
    style.borderColor = props.filled ? 'transparent' : '#ffccc7'
    style.color = props.filled ? '#1d1d1f' : '#cf1322'
  } else {
    style.backgroundColor = props.filled ? '#e6f7ff' : '#fff'
    style.borderColor = props.filled ? 'transparent' : '#91d5ff'
    style.color = props.filled ? '#1d1d1f' : '#0958d9'
  }
  
  return style
})

const defaultIconName = computed(() => {
  switch (props.type) {
    case 'success':
      return 'Check'
    case 'warning':
      return 'AlertTriangle'
    case 'error':
      return 'X'
    case 'info':
    default:
      return 'Info'
  }
})

// 方法
const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.alert-wrapper {
  border: 1px solid;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.3s ease;
  position: relative;
}

.alert-wrapper.alert-bordered {
  border-width: 1px;
}

.alert-wrapper.alert-filled {
  border-width: 0;
}

.alert-wrapper.alert-with-icon .alert-content {
  padding-left: 0;
}

.alert-success {
  background-color: #f6ffed;
  border-color: #b7eb8f;
  color: #389e0d;
}

.alert-success .alert-icon {
  color: #52c41a;
}

.alert-warning {
  background-color: #fff7e6;
  border-color: #ffd591;
  color: #d48806;
}

.alert-warning .alert-icon {
  color: #faad14;
}

.alert-error {
  background-color: #fff2f0;
  border-color: #ffccc7;
  color: #cf1322;
}

.alert-error .alert-icon {
  color: #ff4d4f;
}

.alert-info {
  background-color: #e6f7ff;
  border-color: #91d5ff;
  color: #0958d9;
}

.alert-info .alert-icon {
  color: #1890ff;
}

.alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.alert-with-icon .alert-content {
  padding-left: 4px;
}

.alert-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.alert-message {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-weight: 600;
  margin-bottom: 4px;
  line-height: 1.4;
}

.alert-description {
  line-height: 1.6;
  word-wrap: break-word;
}

.alert-close {
  flex-shrink: 0;
  cursor: pointer;
  padding: 2px;
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 2px;
}

.alert-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

.alert-wrapper.alert-filled {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.alert-wrapper.alert-filled.alert-success {
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.1);
}

.alert-wrapper.alert-filled.alert-warning {
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.1);
}

.alert-wrapper.alert-filled.alert-error {
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.1);
}

.alert-wrapper.alert-filled.alert-info {
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.alert-wrapper:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .alert-wrapper {
    padding: 10px 12px;
    font-size: 13px;
  }
  
  .alert-content {
    gap: 8px;
  }
  
  .alert-title {
    font-size: 13px;
  }
  
  .alert-description {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .alert-wrapper {
    padding: 8px 10px;
    font-size: 12px;
  }
  
  .alert-content {
    gap: 6px;
  }
  
  .alert-icon {
    font-size: 14px;
  }
  
  .alert-title {
    font-size: 12px;
    margin-bottom: 2px;
  }
  
  .alert-description {
    font-size: 12px;
  }
}
</style>