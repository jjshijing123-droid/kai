<template>
  <div class="notification-container">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', `notification--${notification.type}`]"
        @click="handleClick(notification)"
      >
        <div class="notification__icon">
          <Icon v-if="notification.type === 'success'" name="check-circle" />
          <Icon v-else-if="notification.type === 'error'" name="x-circle" />
          <Icon v-else-if="notification.type === 'warning'" name="alert-triangle" />
          <Icon v-else name="info-circle" />
        </div>
        
        <div class="notification__content">
          <div v-if="notification.title" class="notification__title">
            {{ notification.title }}
          </div>
          <div class="notification__message">
            {{ notification.message }}
          </div>
        </div>
        
        <div class="notification__actions">
          <button
            v-if="notification.actions && notification.actions.length"
            v-for="action in notification.actions"
            :key="action.label"
            :class="['notification__action', `notification__action--${action.type || 'default'}`]"
            @click.stop="action.handler"
          >
            {{ action.label }}
          </button>
          
          <button
            class="notification__close"
            @click.stop="removeNotification(notification.id)"
          >
            ×
          </button>
        </div>
        
        <div v-if="notification.duration > 0" class="notification__progress">
          <div 
            class="notification__progress-bar"
            :style="{ 
              width: `${((Date.now() - notification.startTime) / notification.duration) * 100}%` 
            }"
          />
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useNotificationStore } from '../stores/notificationStore'

const notificationStore = useNotificationStore()

const notifications = computed(() => notificationStore.notifications)

const removeNotification = (id) => {
  notificationStore.remove(id)
}

const handleClick = (notification) => {
  if (notification.onClick) {
    notification.onClick()
  }
}

// 自动清理过期通知
let cleanupInterval
onMounted(() => {
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    notifications.value.forEach(notification => {
      if (notification.duration > 0 && now - notification.startTime >= notification.duration) {
        notificationStore.remove(notification.id)
      }
    })
  }, 100)
})

onBeforeUnmount(() => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: flex-start;
  max-width: 400px;
  min-width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 16px;
  margin-bottom: 8px;
  pointer-events: auto;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border-left: 4px solid;
}

.notification--success {
  border-left-color: #52c41a;
}

.notification--error {
  border-left-color: #ff4d4f;
}

.notification--warning {
  border-left-color: #faad14;
}

.notification--info {
  border-left-color: #1890ff;
}

.notification__icon {
  flex-shrink: 0;
  margin-right: 12px;
  font-size: 18px;
}

.notification--success .notification__icon {
  color: #52c41a;
}

.notification--error .notification__icon {
  color: #ff4d4f;
}

.notification--warning .notification__icon {
  color: #faad14;
}

.notification--info .notification__icon {
  color: #1890ff;
}

.notification__content {
  flex: 1;
  min-width: 0;
}

.notification__title {
  font-weight: 600;
  font-size: 14px;
  color: #262626;
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification__message {
  font-size: 13px;
  color: #595959;
  line-height: 1.5;
  word-wrap: break-word;
}

.notification__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  flex-shrink: 0;
}

.notification__action {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.notification__action--primary {
  background: #1890ff;
  color: white;
}

.notification__action--primary:hover {
  background: #40a9ff;
}

.notification__action--default {
  background: #f5f5f5;
  color: #595959;
}

.notification__action--default:hover {
  background: #e8e8e8;
}

.notification__close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #8c8c8c;
  transition: all 0.2s;
}

.notification__close:hover {
  background: #f5f5f5;
  color: #595959;
}

.notification__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: rgba(0, 0, 0, 0.1);
  width: 100%;
}

.notification__progress-bar {
  height: 100%;
  transition: width linear;
  background: #1890ff;
}

/* 动画效果 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  height: 0;
}

.notification-move {
  transition: transform 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-container {
    left: 20px;
    right: 20px;
    top: 20px;
  }
  
  .notification {
    max-width: none;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .notification-container {
    left: 10px;
    right: 10px;
    top: 10px;
  }
  
  .notification {
    padding: 12px;
  }
  
  .notification__message {
    font-size: 12px;
  }
  
  .notification__title {
    font-size: 13px;
  }
}

/* 深色主题 */
.dark .notification {
  background: #1f1f1f;
  border-left-color: #177ddc;
}

.dark .notification--success {
  border-left-color: #49aa19;
}

.dark .notification--error {
  border-left-color: #d32029;
}

.dark .notification--warning {
  border-left-color: #d89614;
}

.dark .notification__title {
  color: #f0f0f0;
}

.dark .notification__message {
  color: #a6a6a6;
}

.dark .notification__close:hover {
  background: #262626;
  color: #f0f0f0;
}

.dark .notification__action--default {
  background: #262626;
  color: #a6a6a6;
}

.dark .notification__action--default:hover {
  background: #333333;
}
</style>