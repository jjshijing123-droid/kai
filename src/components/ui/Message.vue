<template>
  <div 
    v-if="show" 
    class="custom-message" 
    :class="`custom-message-${type}`"
    :style="styles"
  >
    <span class="message-icon">{{ icon }}</span>
    <span class="message-text">{{ message }}</span>
    <button class="message-close" @click="close">×</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'error', 'warning'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  },
  showClose: {
    type: Boolean,
    default: true
  },
  top: {
    type: Number,
    default: 20
  }
})

const emit = defineEmits(['close'])

const show = ref(false)
const styles = computed(() => ({
  top: `${props.top}px`
}))

const icon = computed(() => {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }
  return icons[props.type] || icons.info
})

const close = () => {
  show.value = false
  emit('close')
}

const showMessage = () => {
  show.value = true
  
  if (props.duration > 0) {
    setTimeout(() => {
      close()
    }, props.duration)
  }
}

onMounted(() => {
  showMessage()
})

watch(() => props.message, (newMessage) => {
  if (newMessage) {
    showMessage()
  }
})

// 导出方法供外部调用
defineExpose({
  show: showMessage,
  close,
  emit
})
</script>

<style scoped>
.custom-message {
  position: fixed;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  z-index: 2000;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 300px;
  word-break: break-word;
}

.custom-message.show {
  opacity: 1;
  transform: translateX(0);
}

.custom-message-info {
  background: #1890ff;
}

.custom-message-success {
  background: #52c41a;
}

.custom-message-error {
  background: #ff4d4f;
}

.custom-message-warning {
  background: #faad14;
}

.message-icon {
  font-size: 16px;
}

.message-text {
  flex: 1;
}

.message-close {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: white;
  opacity: 0.8;
  transition: opacity 0.2s ease;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.message-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
}
</style>