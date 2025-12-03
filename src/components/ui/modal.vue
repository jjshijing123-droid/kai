<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click="onClose">
      <div
        class="modal-container"
        :class="[width]"
        @click.stop
      >
        <div class="modal-content">
          <div v-if="title" class="modal-header">
            <h3 class="modal-title">
              {{ title }}
            </h3>
            <button
              type="button"
              class="modal-close-btn"
              @click="onClose"
            >
              <span class="sr-only">Close</span>
              <LucideIcon name="X" class="h-4 w-4" />
            </button>
          </div>
          
          <div class="modal-body">
            <slot />
          </div>
          
          <div v-if="showFooter" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import LucideIcon from './LucideIcon.vue'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  width: {
    type: String,
    default: 'modal-lg' // 默认大尺寸
  },
  showFooter: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'cancel', 'ok'])

const onClose = () => {
  emit('close')
  emit('cancel')
}
</script>

<style scoped>
/* 模态框遮罩 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* 模态框容器 */
.modal-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-width: 90vw;
}

/* 宽度变体 */
.modal-sm {
  width: 400px;
}

.modal-md {
  width: 500px;
}

.modal-lg {
  width: 600px;
}

.modal-xl {
  width: 800px;
}

.modal-2xl {
  width: 1000px;
}

/* Tailwind-like responsive width classes */
@media (min-width: 1024px) {
  [class*="lg:max-w-2xl"] {
    width: 520px;
  }
}

/* 模态框内容 */
.modal-content {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

/* 头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  flex: 1;
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #8c8c8c;
  font-size: 16px;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #f5f5f5;
  color: #262626;
}

.modal-close-btn :deep(svg) {
  display: block;
}

/* 主体 */
.modal-body {
  padding: 20px 24px;
  flex: 1;
  overflow-y: auto;
}

/* 底部 */
.modal-footer {
  padding: 16px 24px 20px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 16px;
  }
  
  .modal-container {
    width: 100% !important;
    max-width: 100%;
    max-height: 85vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 8px;
  }
  
  .modal-footer > * {
    width: 100%;
    justify-content: center;
  }
}
</style>