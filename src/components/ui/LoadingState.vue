<template>
  <div class="loading-container" v-if="loading">
    <div class="loading-spinner"></div>
    <p v-if="text">{{ text }}</p>
    <div class="loading-progress" v-if="showProgress && progress > 0">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <span>{{ progress }}%</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: ''
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 100
  }
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4a90e2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  color: #666;
  font-size: 16px;
  margin: 0 0 20px 0;
}

.loading-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 200px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4a90e2;
  transition: width 0.3s ease;
  border-radius: 3px;
}

.loading-progress span {
  font-size: 12px;
  color: #666;
}
</style>