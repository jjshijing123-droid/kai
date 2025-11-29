<template>
  <div v-if="open" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content modal-large" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">{{ t('productManagement_batchUploadReplaceTitle') }}</h3>
        <button class="modal-close" @click="handleClose">✕</button>
      </div>
      <div class="modal-body">
        <div class="batch-upload-content">
          <div class="alert alert-warning">
            <div class="alert-icon">⚠️</div>
            <div class="alert-content">
              <div class="alert-title">{{ t('productManagement_dangerousOperation') }}</div>
              <div class="alert-message">{{ t('productManagement_dangerousOperationDesc') }}</div>
            </div>
          </div>
          
          <div class="batch-upload-area">
            <div
              class="upload-zone"
              :class="{ 'upload-zone--dragover': isDragOver }"
              @click="triggerFileInput"
              @drop="handleDrop"
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
            >
              <div class="upload-zone-content">
                <div class="upload-zone-icon">☁️📤</div>
                <div class="upload-zone-text">
                  <div class="upload-zone-title">{{ t('productManagement_selectZipTitle') }}</div>
                  <div class="upload-zone-subtitle">
                    {{ t('productManagement_selectZipSubtitle') }}
                  </div>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".zip"
                  @change="handleFileSelect"
                  class="batch-file-input"
                />
              </div>
            </div>
          </div>

          <!-- 已选择文件信息 -->
          <div v-if="selectedFile" class="selected-file-info">
            <div class="alert alert-info">
              <div class="alert-icon">ℹ️</div>
              <div class="alert-content">
                <div class="alert-title">{{ t('productManagement_selectedFile') }} {{ selectedFile.name }}</div>
                <div class="alert-message">{{ t('productManagement_fileSize') }} {{ formatFileSize(selectedFile.size) }} {{ t('productManagement_clickUploadButton') }}</div>
              </div>
            </div>
          </div>

          <!-- 上传按钮 -->
          <div v-if="selectedFile && !uploading" class="batch-upload-actions">
            <button
              type="button"
              @click="startUpload"
              class="btn btn-danger btn-large batch-upload-start-button"
            >
              <span class="btn-icon">☁️📤</span>
              {{ t('productManagement_startBatchReplace') }}
            </button>
          </div>

          <!-- 上传进度 -->
          <div v-if="uploading" class="batch-upload-progress">
            <div class="progress-header">
              <span>{{ t('productManagement_executingBatchReplace') }}</span>
              <span class="progress-percent">{{ progress }}%</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" :style="{ width: progress + '%' }"></div>
            </div>
            <div class="progress-details">
              <div>{{ status }}</div>
            </div>
          </div>

          <!-- 上传结果 -->
          <div v-if="uploadResult" class="batch-upload-result">
            <div class="alert" :class="uploadResult.success ? 'alert-success' : 'alert-error'">
              <div class="alert-icon">{{ uploadResult.success ? '✅' : '❌' }}</div>
              <div class="alert-content">
                <div class="alert-title">{{ uploadResult.success ? t('productManagement_batchReplaceSuccess') : t('productManagement_batchReplaceFailed') }}</div>
                <div class="alert-message">
                  <p>{{ uploadResult.message }}</p>
                  <p v-if="uploadResult.success">{{ t('productManagement_processedFiles') }} {{ uploadResult.fileCount }} {{ t('common_files') }}</p>
                  <p v-if="uploadResult.success">{{ t('productManagement_createdFolders') }} {{ uploadResult.folderCount }} {{ t('common_folders') }}</p>
                  <p v-if="uploadResult.success && uploadResult.backupPath">
                    {{ t('productManagement_backupLocation') }} {{ uploadResult.backupPath }}
                  </p>
                </div>
              </div>
              <button class="alert-close" @click="uploadResult = null">✕</button>
            </div>
          </div>

          <!-- 使用说明 -->
          <div class="batch-upload-hint">
            <p><strong>{{ t('productManagement_usageInstructions') }}</strong></p>
            <ul>
              <li>{{ t('productManagement_uploadZipInstructions1') }}</li>
              <li>{{ t('productManagement_uploadZipInstructions2') }}</li>
              <li>{{ t('productManagement_uploadZipInstructions3') }}</li>
              <li>{{ t('productManagement_uploadZipInstructions4') }}</li>
              <li>{{ t('productManagement_uploadZipInstructions5') }}</li>
              <li>{{ t('productManagement_uploadZipInstructions6') }}</li>
            </ul>
          </div>
        </div>
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

const emit = defineEmits(['close', 'upload-complete'])

const { t } = useI18n()
const fileInput = ref(null)
const selectedFile = ref(null)
const isDragOver = ref(false)
const uploading = ref(false)
const progress = ref(0)
const status = ref('')
const uploadResult = ref(null)

// 监听open属性变化，重置状态
watch(() => props.open, (newValue) => {
  if (newValue) {
    resetState()
  }
})

const resetState = () => {
  selectedFile.value = null
  isDragOver.value = false
  uploading.value = false
  progress.value = 0
  status.value = ''
  uploadResult.value = null
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    addFile(files[0])
  }
  // 清空input值，允许重复选择相同文件
  event.target.value = ''
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = Array.from(event.dataTransfer.files)
  if (files.length > 0) {
    addFile(files[0])
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  isDragOver.value = false
}

const addFile = (file) => {
  // 验证文件类型
  if (!file.name.toLowerCase().endsWith('.zip')) {
    emit('upload-complete', {
      success: false,
      error: t('productManagement_zipOnly')
    })
    return
  }

  // 验证文件大小（500MB）
  const maxSize = 500 * 1024 * 1024
  if (file.size > maxSize) {
    emit('upload-complete', {
      success: false,
      error: t('productManagement_fileSizeExceeded500')
    })
    return
  }

  selectedFile.value = file
}

const startUpload = () => {
  if (!selectedFile.value || uploading.value) return
  
  uploading.value = true
  progress.value = 0
  status.value = '准备上传...'
  uploadResult.value = null
  
  // 触发上传事件，将文件传递给父组件处理
  emit('upload-complete', {
    success: true,
    file: selectedFile.value,
    onProgress: (newProgress, newStatus) => {
      progress.value = newProgress
      status.value = newStatus
    },
    onComplete: (result) => {
      uploadResult.value = result
      uploading.value = false
    }
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

.modal-large {
  max-width: 800px;
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

.batch-upload-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.alert-warning {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  color: #faad14;
}

.alert-info {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  color: #1890ff;
}

.alert-success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.alert-error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.alert-icon {
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.alert-message {
  font-size: 13px;
  margin: 0;
  line-height: 1.4;
}

.alert-close {
  background: none;
  border: none;
  font-size: 16px;
  color: #8c8c8c;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #595959;
}

.batch-upload-area {
  margin-bottom: 20px;
}

.upload-zone {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-zone:hover {
  border-color: #ff4d4f;
  background: #fff2f0;
}

.upload-zone--dragover {
  border-color: #ff4d4f;
  background: #fff2f0;
}

.upload-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-zone-icon {
  font-size: 48px;
  color: #ff4d4f;
}

.upload-zone-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-zone-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.upload-zone-subtitle {
  font-size: 14px;
  color: #8c8c8c;
}

.batch-file-input {
  display: none;
}

.selected-file-info {
  margin-top: 20px;
}

.batch-upload-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-large {
  padding: 12px 24px;
  font-size: 16px;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.2);
}

.btn-danger:hover {
  background: #ff7875;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.batch-upload-progress {
  margin-top: 20px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
}

.progress-percent {
  color: #1890ff;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-details {
  font-size: 13px;
  color: #8c8c8c;
  text-align: center;
}

.batch-upload-result {
  margin-top: 20px;
}

.batch-upload-hint {
  margin-top: 20px;
  padding: 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  font-size: 13px;
  color: #595959;
}

.batch-upload-hint p {
  margin: 0 0 8px 0;
  font-weight: 500;
}

.batch-upload-hint ul {
  margin: 0;
  padding-left: 20px;
}

.batch-upload-hint li {
  margin-bottom: 4px;
  line-height: 1.4;
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

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-large {
    max-width: 95%;
  }
  
  .modal-header,
  .modal-body {
    padding: 16px;
  }
  
  .upload-zone {
    padding: 30px 16px;
  }
  
  .upload-zone-icon {
    font-size: 36px;
  }
}
</style>