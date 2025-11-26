<template>
  <div class="error-container">
    <div class="error-icon">{{ icon }}</div>
    <p class="error-message">{{ message }}</p>
    <button 
      v-if="showRetry" 
      @click="handleRetry" 
      class="retry-button"
    >
      {{ retryText }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  message: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '⚠️'
  },
  showRetry: {
    type: Boolean,
    default: true
  },
  retryText: {
    type: String,
    default: '重试'
  }
})

const emit = defineEmits(['retry'])

const handleRetry = () => {
  emit('retry')
}
</script>

<style scoped>
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  color: #e74c3c;
  font-size: 16px;
  margin-bottom: 20px;
  max-width: 400px;
  line-height: 1.5;
}

.retry-button {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background-color: #357abd;
}
</style>