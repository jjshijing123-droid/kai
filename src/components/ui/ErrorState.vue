<template>
  <div class="error-container">
    <div class="error-icon">
      <LucideIcon name="AlertTriangle" class="h-12 w-12 text-destructive" />
    </div>
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
import LucideIcon from './LucideIcon.vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'AlertTriangle'
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
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background-color: hsl(var(--primary) / 0.9);
}
</style>