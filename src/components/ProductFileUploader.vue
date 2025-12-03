<template>
  <div class="product-file-uploader">
    <!-- 拖拽上传区域 -->
    <div 
      class="upload-area"
      :class="{ 
        'upload-area--dragover': isDragOver,
        'upload-area--disabled': disabled 
      }"
      @click="triggerFileInput"
      @drop="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
    >
      <div class="upload-content">
        <div class="upload-icon">
                  <LucideIcon name="FileUp" class="h-12 w-12 text-primary" />
                </div>
        <div class="upload-text">
          <div class="upload-title">{{ t('common_uploadFiles') }}</div>
          <div class="upload-subtitle">
            {{ t('common_clickOrDragFiles') }}
          </div>
        </div>
        <input
          ref="fileInput"
          type="file"
          multiple
          :disabled="disabled"
          @change="handleFileSelect"
          class="file-input"
        />
      </div>
    </div>

    <!-- 已选择文件列表 -->
    <div v-if="selectedFiles.length > 0" class="selected-files-section">
      <div class="section-header">
        <h3>{{ t('common_selectedFiles') }} ({{ selectedFiles.length }})</h3>
        <Button 
          @click="clearSelectedFiles" 
          variant="text" 
          size="sm"
          :disabled="disabled || uploading"
        >
          {{ t('common_clearAll') }}
        </Button>
      </div>
      <div class="files-list">
        <div 
          v-for="(file, index) in selectedFiles" 
          :key="index"
          class="file-item"
        >
          <div class="file-info">
            <LucideIcon name="File" class="h-4 w-4 mr-2" />
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">({{ formatFileSize(file.size) }})</span>
          </div>
          <Button 
            @click="removeFile(index)" 
            variant="ghost" 
            size="sm"
            :disabled="disabled || uploading"
          >
            <LucideIcon name="X" class="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress-section">
      <div class="progress-header">
        <span>{{ t('common_uploadingFiles') }}</span>
        <span class="progress-percent">{{ uploadProgress }}%</span>
      </div>
      <Progress
        :percent="uploadProgress"
        :show-info="false"
        status="active"
      />
      <div class="progress-details">
        <div>{{ t('common_uploaded') }} {{ uploadedFilesCount }}/{{ totalFilesCount }}</div>
        <div>{{ t('common_currentFile') }}: {{ currentUploadingFileName }}</div>
      </div>
    </div>

    <!-- 上传结果 -->
    <div v-if="uploadResult" class="upload-result">
      <Alert
        :message="uploadResult.success ? t('common_uploadSuccess') : t('common_uploadFailed')"
        :type="uploadResult.success ? 'success' : 'error'"
        show-icon
        closable
        @close="uploadResult = null"
      >
        <template #description>
          <div v-if="uploadResult.success">
            <p>{{ t('common_successfullyUploaded') }} {{ uploadResult.successfulCount }} {{ t('common_files') }}</p>
            <p v-if="uploadResult.failedCount > 0">{{ t('common.failedUploads') }} {{ uploadResult.failedCount }} {{ t('common.files') }}</p>
          </div>
          <div v-else>
            <p>{{ uploadResult.error }}</p>
          </div>
        </template>
      </Alert>
    </div>

    <!-- 上传按钮 -->
    <div v-if="selectedFiles.length > 0 && !uploading" class="upload-actions">
      <Button
              variant="primary"
              :disabled="!canUpload || disabled"
              @click="startUpload"
              class="upload-button"
            >
              <LucideIcon name="Upload" class="h-4 w-4" />
              {{ t('common_startUpload') }}
            </Button>
      
      <Button
        @click="clearSelectedFiles"
        :disabled="disabled"
      >
        {{ t('common_cancel') }}
      </Button>
    </div>

    <!-- 提示信息 -->
    <div class="upload-hint">
      <p><strong>{{ t('common_usageInstructions') }}</strong></p>
      <ul>
        <li>{{ t('common.selectMultipleFiles') }}</li>
        <li>{{ t('common.supportedFileTypes') }}</li>
        <li>{{ t('common.fileSizeLimit') }}</li>
        <li>{{ t('common.uploadToCurrentFolder') }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import Button from './ui/button.vue'
import Progress from './ui/progress.vue'
import Alert from './ui/alert.vue'
import LucideIcon from './ui/LucideIcon.vue'

const { t } = useI18n()

const props = defineProps({
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 当前文件夹路径
  currentPath: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['upload-start', 'upload-complete'])

// 响应式数据
const fileInput = ref(null)
const selectedFiles = ref([])
const folderNameError = ref('')
const uploading = ref(false)
const isDragOver = ref(false)
const uploadProgress = ref(0)
const uploadResult = ref(null)

// 进度数据
const uploadedFilesCount = ref(0)
const totalFilesCount = ref(0)
const currentUploadingFileName = ref('')

// 计算属性
const canUpload = computed(() => {
  return selectedFiles.value.length > 0 && 
         !uploading.value
})

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 方法
const triggerFileInput = () => {
  if (!props.disabled) {
    fileInput.value?.click()
  }
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    addFiles(files)
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
    addFiles(files)
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

const addFiles = (files) => {
  // 验证并添加文件
  const validFiles = []
  const invalidFiles = []
  
  files.forEach(file => {
    // 验证文件大小（100MB）
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      invalidFiles.push(file)
      return
    }
    
    // 检查是否已存在相同文件
    const existingIndex = selectedFiles.value.findIndex(f => f.name === file.name && f.size === file.size)
    if (existingIndex === -1) {
      validFiles.push(file)
    }
  })
  
  // 添加有效文件
  if (validFiles.length > 0) {
    selectedFiles.value.push(...validFiles)
    uploadResult.value = null
  }
  
  // 显示无效文件信息
  if (invalidFiles.length > 0) {
    alert(t('common_someFilesInvalid', { count: invalidFiles.length }))
  }
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
  if (selectedFiles.value.length === 0) {
    uploadResult.value = null
  }
}

const clearSelectedFiles = () => {
  selectedFiles.value = []
  uploadResult.value = null
}

const startUpload = async () => {
  if (!canUpload.value || uploading.value) return
  
  uploading.value = true
  uploadProgress.value = 0
  uploadedFilesCount.value = 0
  totalFilesCount.value = selectedFiles.value.length
  currentUploadingFileName.value = ''
  uploadResult.value = null
  
  emit('upload-start', { 
    fileCount: selectedFiles.value.length,
    folderPath: props.currentPath
  })
  
  try {
    const successfulUploads = []
    const failedUploads = []
    
    // 逐个上传文件
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const file = selectedFiles.value[i]
      currentUploadingFileName.value = file.name
      
      try {
        await uploadSingleFile(file, i)
        successfulUploads.push(file)
        uploadedFilesCount.value++
      } catch (error) {
        failedUploads.push(file)
        console.error('文件上传失败:', file.name, error)
      }
      
      // 更新整体进度
      uploadProgress.value = Math.round(((i + 1) / selectedFiles.value.length) * 100)
    }
    
    uploadResult.value = {
      success: failedUploads.length === 0,
      successfulCount: successfulUploads.length,
      failedCount: failedUploads.length
    }
    
    emit('upload-complete', { 
      success: failedUploads.length === 0, 
      result: {
        successfulCount: successfulUploads.length,
        failedCount: failedUploads.length
      }
    })
    
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

const uploadSingleFile = async (file, index) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folderPath', props.currentPath)
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    // 监听上传进度（单个文件）
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        // 计算单个文件的进度贡献
        const fileProgress = Math.round((event.loaded / event.total) * 100)
        const overallProgress = Math.round((index + (fileProgress / 100)) / selectedFiles.value.length * 100)
        uploadProgress.value = Math.min(100, overallProgress)
      }
    })
    
    // 处理响应
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          if (response.success) {
            resolve(response)
          } else {
            throw new Error(response.error || t('common_uploadFailed'))
          }
        } catch (error) {
          reject(new Error(`${t('common_parseResponseFailed')}: ` + error.message))
        }
      } else {
        // 尝试解析错误响应
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          reject(new Error(errorResponse.error || `${t('common_serverError')}: ${xhr.status}`))
        } catch (parseError) {
          reject(new Error(`${t('common_serverError')}: ${xhr.status} - ${xhr.statusText}`))
        }
      }
    })
    
    // 处理错误
    xhr.addEventListener('error', () => {
      reject(new Error(t('common_networkError')))
    })
    
    // 发送请求
    xhr.open('POST', '/api/upload-files')
    xhr.send(formData)
  })
}

// 清理
onUnmounted(() => {
  // 清理资源
})

// 暴露方法给父组件
defineExpose({
  clearSelectedFiles
})
</script>

<style scoped>
.product-file-uploader {
  width: 100%;
}

/* 拖拽上传区域 */
.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #1890ff;
  background: #f0f8ff;
}

.upload-area--dragover {
  border-color: #1890ff;
  background: #e6f7ff;
}

.upload-area--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.upload-area--disabled:hover {
  border-color: #d9d9d9;
  background: #fafafa;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  font-size: 48px;
  color: #1890ff;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.upload-subtitle {
  font-size: 14px;
  color: #8c8c8c;
}

.file-input {
  display: none;
}

.icon {
  font-size: 24px;
}

/* 已选择文件列表 */
.selected-files-section {
  margin-top: 20px;
  padding: 20px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.files-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  gap: 12px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.file-name {
  font-size: 13px;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #8c8c8c;
}

/* 上传进度 */
.upload-progress-section {
  margin-top: 20px;
  padding: 20px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
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
  color: #52c41a;
  font-weight: 600;
}

.progress-details {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
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
  justify-content: center;
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

/* 提示信息 */
.upload-hint {
  margin-top: 20px;
  padding: 16px;
  background: #f0f8ff;
  border: 1px solid #91d5ff;
  border-radius: 6px;
  font-size: 13px;
  color: #595959;
}

.upload-hint p {
  margin: 0 0 8px 0;
  font-weight: 500;
}

.upload-hint ul {
  margin: 0;
  padding-left: 20px;
}

.upload-hint li {
  margin-bottom: 4px;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-area {
    padding: 30px 16px;
  }
  
  .upload-icon {
    font-size: 36px;
  }
  
  .upload-title {
    font-size: 14px;
  }
  
  .upload-subtitle {
    font-size: 12px;
  }
  
  .selected-files-section {
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