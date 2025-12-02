<template>
  <div class="empty-container">
    <div class="empty-icon">
      <LucideIcon :name="icon" class="h-12 w-12 text-muted-foreground" />
    </div>
    <h3 class="empty-title">{{ message }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <button
      v-if="showAction"
      @click="handleAction"
      class="action-button"
    >
      {{ actionText }}
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
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'Package'
  },
  showAction: {
    type: Boolean,
    default: false
  },
  actionText: {
    type: String,
    default: '操作'
  }
})

const emit = defineEmits(['action'])

const handleAction = () => {
  emit('action')
}
</script>

<style scoped>
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  min-height: 300px;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  margin: 0 0 20px 0;
  max-width: 400px;
  line-height: 1.5;
}

.action-button {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-button:hover {
  background-color: hsl(var(--primary) / 0.9);
}
</style>