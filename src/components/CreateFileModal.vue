<template>
  <div v-if="open" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">{{ t('productManagement_createFile') }}</h3>
        <button class="modal-close" @click="handleClose">✕</button>
      </div>
      <div class="modal-body">
        <form class="form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">{{ t('productManagement_fileName') }}</label>
            <input
              v-model="fileName"
              :placeholder="t('productManagement_inputFileName')"
              class="form-input"
              @input="validateFileName"
              required
            />
            <div v-if="fileNameError" class="form-error">{{ fileNameError }}</div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('productManagement_fileContent') }}</label>
            <textarea
              v-model="fileContent"
              :placeholder="t('productManagement_inputFileContent')"
              class="form-textarea"
              rows="8"
            ></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" @click="handleClose" class="btn btn-secondary">
              {{ t('productManagement_cancel') }}
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="!fileName || !!fileNameError || loading"
              :class="{ 'btn-loading': loading }"
            >
              {{ loading ? t('productManagement_creating') : t('productManagement_create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from '../composables/useI18n.js'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'create'])

const { t } = useI18n()
const fileName = ref('')
const fileContent = ref('')
const fileNameError = ref('')
const loading = ref(false)

// 监听open属性变化，重置表单
watch(() => props.open, (newValue) => {
  if (newValue) {
    resetForm()
  }
})

const resetForm = () => {
  fileName.value = ''
  fileContent.value = ''
  fileNameError.value = ''
  loading.value = false
}

const validateFileName = () => {
  if (!fileName.value) {
    fileNameError.value = ''
    return
  }
  
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/
  if (invalidChars.test(fileName.value)) {
    fileNameError.value = t('productManagement_fileNameContainsInvalid')
    return
  }
  
  fileNameError.value = ''
}

const handleSubmit = () => {
  if (fileNameError.value || !fileName.value) return
  
  loading.value = true
  emit('create', {
    fileName: fileName.value,
    fileContent: fileContent.value
  })
}

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  handleClose()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #8c8c8c;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #595959;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #595959;
}

.form-input,
.form-textarea {
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-error {
  font-size: 12px;
  color: #ff4d4f;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn-secondary {
  background: #f0f2f5;
  color: #4a4a4a;
  border-color: #d9d9d9;
}

.btn-secondary:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.btn-primary {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-loading {
  position: relative;
}

.btn-loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px;
  }
}
</style>