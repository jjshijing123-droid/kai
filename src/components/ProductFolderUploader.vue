<template>
  <div class="product-folder-uploader">
    <!-- 拖拽上传区域 -->
    <div class="file-upload-area" :class="{ 
        'file-upload-area--dragover': isDragOver,
        'file-upload-area--disabled': disabled 
      }" @click="triggerFileInput" @drop="handleDrop" @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave">
      <div class="upload-content">
        <LucideIcon name="Folder" />
        <p class="upload-title">{{ t('common_uploadProductFolder') }}</p>
        <p class="upload-hint">{{ t('common_clickOrDragZip') }}</p>
        <input ref="fileInput" type="file" accept=".zip" :disabled="disabled" @change="handleFileSelect"
          class="file-input" />
      </div>
    </div>

    <!-- 文件夹名称输入 -->
    <div v-if="selectedFile" class="folder-name-section">
      <div class="form-item">
        <label class="form-label">{{ t('common_productFolderName') }}</label>
        <Input v-model:value="folderName" :placeholder="t('common_folderNamePlaceholder')" :disabled="uploading"
          @input="validateFolderName" />
        <div v-if="folderNameError" class="error-text">
          {{ folderNameError }}
        </div>
        <div v-if="actualFolderName" class="info-text">
          {{ t('common_detectedFolderNameConflict') }}: <strong>{{ actualFolderName }}</strong>
        </div>
      </div>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress-section">
      <div class="progress-header">
        <span>{{ t('common_uploadingProductFolder') }}</span>
        <span class="progress-percent">{{ uploadProgress }}%</span>
      </div>
      <Progress :percent="uploadProgress" :show-info="false" status="active" />
      <div class="progress-details">
        <div>{{ t('common_files') }}: {{ processedFiles }}/{{ totalFiles }}</div>
        <div>{{ t('common_folders') }}: {{ processedFolders }}/{{ totalFolders }}</div>
      </div>
    </div>

    <!-- 上传结果 -->
    <div v-if="uploadResult" class="upload-result">
      <Alert :message="uploadResult.success ? t('common_uploadSuccess') : t('common_uploadFailed')"
        :type="uploadResult.success ? 'success' : 'error'" show-icon closable @close="uploadResult = null">
        <template #description>
          <div v-if="uploadResult.success">
            <p>{{ t('common_productFolderName') }}: <strong>{{ uploadResult.actualName }}</strong></p>
            <p>{{ t('common_processed') }} {{ uploadResult.fileCount }} {{ t('common_files') }}</p>
            <p>{{ t('common_created') }} {{ uploadResult.folderCount }} {{ t('common_folders') }}</p>
          </div>
          <div v-else>
            <p>{{ uploadResult.error }}</p>
          </div>
        </template>
      </Alert>
    </div>

    <!-- 移除内部按钮，改为通过emit让父组件在Modal footer中处理 -->

    <!-- 上传当个产品文件夹提示信息 -->
    <Functionaldescription
      :displayTitle="t('common_usageInstructions')"
      iconName="AlertCircle"
      :instructions="[  
      { icon: 'FileArchive', text: t('common_uploadZipInstructions') },
      { icon: 'FolderTree', text: t('common_rootFolderRequirement') },
      { icon: 'AlertCircle', text: t('common_folderNameConflict') },
      { icon: 'HardDrive', text: t('common_maxFileSize') }
      ]"
    />

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import Button from './ui/button.vue'
import Input from './ui/input.vue'
import Progress from './ui/progress.vue'
import Alert from './ui/alert.vue'
import LucideIcon from './ui/LucideIcon.vue'
import Functionaldescription from './Functionaldescription.vue'

// 全局消息提示
const showMessage = (type, text) => {
  const messageDiv = document.createElement('div')
  messageDiv.className = `message-${type}`
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
    padding: 12px 20px;
    border-radius: 10px;
    color: white;
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    max-width: 400px;
    word-wrap: break-word;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    opacity: 0;
  `
  
  if (type === 'warning') {
    messageDiv.style.backgroundColor = 'var(--orange-8)'
  } else if (type === 'error') {
    messageDiv.style.backgroundColor = 'var(--red-9)'
  } else if (type === 'success') {
    messageDiv.style.backgroundColor = 'var(--green-8)'
  } else {
    messageDiv.style.backgroundColor = 'var(--primary-8)'
  }
  
  messageDiv.textContent = text
  document.body.appendChild(messageDiv)
  
  // 入场动画
  setTimeout(() => {
    messageDiv.style.opacity = '1'
    messageDiv.style.transform = 'translateX(-50%) translateY(0)'
  }, 10)
  
  // 3秒后自动移除
  setTimeout(() => {
    messageDiv.style.opacity = '0'
    messageDiv.style.transform = 'translateX(-50%) translateY(-100%)'
    setTimeout(() => {
      if (messageDiv.parentNode) {
        document.body.removeChild(messageDiv)
      }
    }, 300)
  }, 3000)
}

const { t } = useI18n()

const props = defineProps({
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['upload-start', 'upload-complete', 'cancel', 'ok'])

// 响应式数据
const fileInput = ref(null)
const selectedFile = ref(null)
const folderName = ref('')
const actualFolderName = ref('')
const folderNameError = ref('')
const uploading = ref(false)
const isDragOver = ref(false)
const uploadProgress = ref(0)
const uploadResult = ref(null)

// 模拟进度数据
const processedFiles = ref(0)
const totalFiles = ref(0)
const processedFolders = ref(0)
const totalFolders = ref(0)

// 计算属性
const canUpload = computed(() => {
  return selectedFile.value && 
         folderName.value.trim() && 
         !folderNameError.value &&
         !uploading.value
})

// 方法
const triggerFileInput = () => {
  if (!props.disabled) {
    fileInput.value?.click()
  }
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
  
  if (props.disabled) return
  
  const files = Array.from(event.dataTransfer.files)
  if (files.length > 0) {
    addFile(files[0])
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  if (!props.disabled) {
    isDragOver.value = true
  }
}

const handleDragLeave = (event) => {
  event.preventDefault()
  isDragOver.value = false
}

const addFile = (file) => {
  // 验证文件类型
  if (!file.name.toLowerCase().endsWith('.zip')) {
    showMessage('warning', t('common_zipOnly'))
    return
  }

  // 验证文件大小（100MB）
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    showMessage('warning', t('common_fileSizeExceeded'))
    return
  }

  selectedFile.value = file
  folderName.value = file.name.replace(/\.zip$/i, '')
  actualFolderName.value = ''
  folderNameError.value = ''
  uploadResult.value = null
  
  // 自动验证文件夹名称
  validateFolderName()
}

const validateFolderName = () => {
  folderNameError.value = ''
  
  if (!folderName.value.trim()) {
    folderNameError.value = t('common_folderNameEmpty')
    return
  }
  
  // 检查名称有效性
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/
  if (invalidChars.test(folderName.value)) {
    folderNameError.value = t('common_folderNameInvalid')
    return
  }
  
  // 这里可以添加更多验证逻辑
}

const startUpload = async () => {
  if (!canUpload.value || uploading.value) return
  
  uploading.value = true
  uploadProgress.value = 0
  processedFiles.value = 0
  processedFolders.value = 0
  uploadResult.value = null
  
  emit('upload-start', { 
    fileName: selectedFile.value.name,
    folderName: folderName.value 
  })
  
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('folderName', folderName.value)
    
    const xhr = new XMLHttpRequest()
    
    // 监听上传进度
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        uploadProgress.value = progress
        
        // 模拟文件处理进度
        if (progress >= 100) {
          // 上传完成，开始模拟文件处理
          simulateFileProcessing()
        }
      }
    })
    
    // 处理响应
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          if (response.success) {
            uploadResult.value = {
              success: true,
              originalName: response.originalName,
              actualName: response.actualName,
              fileCount: response.fileCount,
              folderCount: response.folderCount
            }
            
            emit('upload-complete', { 
              success: true, 
              result: response 
            })
          } else {
            throw new Error(response.error || t('common_uploadFailed'))
          }
        } catch (error) {
          throw new Error(`${t('common_parseResponseFailed')}: ` + error.message)
        }
      } else {
        // 尝试解析错误响应
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          throw new Error(errorResponse.error || `${t('common_serverError')}: ${xhr.status}`)
        } catch (parseError) {
          throw new Error(`${t('common_serverError')}: ${xhr.status} - ${xhr.statusText}`)
        }
      }
    })
    
    // 处理错误
    xhr.addEventListener('error', () => {
      throw new Error(t('common_networkError'))
    })
    
    // 发送请求
    xhr.open('POST', '/api/upload-product-folder')
    xhr.send(formData)
    
  } catch (error) {
    uploadResult.value = {
      success: false,
      error: error.message
    }
    emit('upload-complete', { 
      success: false, 
      error: error.message 
    })
  } finally {
    uploading.value = false
  }
}

const simulateFileProcessing = () => {
  // 模拟文件处理进度
  let progress = 0
  const interval = setInterval(() => {
    progress += Math.random() * 10
    if (progress >= 100) {
      progress = 100
      clearInterval(interval)
    }
    
    // 更新进度和计数
    uploadProgress.value = Math.min(100, Math.round(progress))
    processedFiles.value = Math.round(uploadProgress.value * 0.8) // 模拟文件计数
    processedFolders.value = Math.round(uploadProgress.value * 0.2) // 模拟文件夹计数
    totalFiles.value = 100 // 模拟总文件数
    totalFolders.value = 20 // 模拟总文件夹数
    
  }, 200)
}

const resetUpload = () => {
  selectedFile.value = null
  folderName.value = ''
  actualFolderName.value = ''
  folderNameError.value = ''
  uploading.value = false
  uploadProgress.value = 0
  uploadResult.value = null
  processedFiles.value = 0
  processedFolders.value = 0
  totalFiles.value = 0
  totalFolders.value = 0
}

// 清理
onUnmounted(() => {
  // 清理资源
})

// 暴露方法给父组件
defineExpose({
  resetUpload,
  startUpload,
  canUpload
})
</script>

<style scoped>
.product-folder-uploader {
  width: 100%;
}

/* 拖拽上传区域 */
.file-upload-area {
  border: 2px dashed var(--neutral-6);
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--neutral-2);
  margin-bottom: 20px;
}

.file-upload-area:hover {
  border-color: var(--primary-9);
  background: var(--primary-3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 160, 217, 0.15);
}

.file-upload-area--dragover {
  border-color: var(--primary-9);
  background: var(--primary-3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 160, 217, 0.15);
}

.file-upload-area--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.file-upload-area--disabled:hover {
  border-color: var(--neutral-6);
  background: var(--neutral-2);
  transform: none;
  box-shadow: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-content svg {
  width: 42px;
  height: 42px;
  color: var(--primary-9);
}

.upload-title {
  font-size: 14px;
  color: var(--neutral-12);
  margin: 0;
  font-family: Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 21px;
  letter-spacing: 0;
}

.upload-hint {
  font-size: 12px;
  color: var(--neutral-11);
  margin: 0;
  font-family: Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 21px;
  letter-spacing: 0;
}

.file-input {
  display: none;
}

.icon {
  font-size: 24px;
}

/* 文件夹名称输入 */
.folder-name-section {
  margin-top: 20px;
  padding: 20px;
  background: var(--neutral-2);
  border-radius: 6px;
  border: 1px solid var(--neutral-3);
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--neutral-12);
  line-height: 1.5;
}

.error-text {
  color: var(--red-9);
  font-size: 12px;
  margin-top: 4px;
}

.info-text {
  color: var(--primary-9);
  font-size: 12px;
  margin-top: 4px;
}

/* 上传进度 */
.upload-progress-section {
  margin-top: 20px;
  padding: 20px;
  background: var(--green-2);
  border: 1px solid var(--green-6);
  border-radius: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.progress-percent {
  color: var(--green-9);
  font-weight: 600;
}

.progress-details {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--neutral-9);
}

/* 上传结果 */
.upload-result {
  margin-top: 20px;
}

/* 上传按钮区域 */
.upload-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: flex-end;
}

.upload-button {
  min-width: 120px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-button .icon {
  font-size: 16px;
}



/* 响应式设计 */
@media (max-width: 768px) {
  .file-upload-area {
    padding: 30px 16px;
  }
  
  .upload-title {
    font-size: 14px;
  }
  
  .upload-hint {
    font-size: 12px;
  }
  
  .folder-name-section {
    padding: 16px;
  }
  
  .upload-progress-section {
    padding: 16px;
  }
  
  .upload-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .upload-button {
    width: 100%;
  }
}
</style>
