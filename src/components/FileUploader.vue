<template>
  <div class="file-uploader">
    <!-- 拖拽上传区域 -->
    <div 
      v-if="showDragArea"
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
          <CloudUploadOutlined />
        </div>
        <div class="upload-text">
          <div class="upload-title">{{ buttonText }}</div>
          <div class="upload-subtitle">
            {{ multiple ? t('fileUploader_dragDropText') : t('fileUploader_clickSelectText') }}
          </div>
        </div>
        <input
          ref="fileInput"
          type="file"
          :multiple="multiple"
          :accept="accept"
          :disabled="disabled"
          @change="handleFileSelect"
          class="file-input"
        />
      </div>
    </div>

    <!-- 文件列表 -->
    <div v-if="fileList.length > 0" class="file-list">
      <div class="file-list-header">
        <span class="file-count">{{ t('fileUploader_selectedCount', { count: fileList.length }) }}</span>
        <a-button
          type="link"
          size="small"
          @click="clearFileList"
          :disabled="uploading"
        >
          {{ t('fileUploader_clear') }}
        </a-button>
      </div>
      
      <div class="file-items">
        <div
          v-for="(file, index) in fileList"
          :key="file.id"
          class="file-item"
          :class="{
            'file-item--uploading': file.status === 'uploading',
            'file-item--success': file.status === 'success',
            'file-item--error': file.status === 'error'
          }"
        >
          <div class="file-info">
            <div class="file-icon">
              <FileImageOutlined v-if="isImageFile(file.name)" />
              <FileOutlined v-else />
            </div>
            <div class="file-details">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-size">{{ formatFileSize(file.size) }}</div>
            </div>
          </div>
          
          <div class="file-status">
            <!-- 上传进度 -->
            <div v-if="file.status === 'uploading'" class="upload-progress">
              <a-progress
                :percent="file.progress"
                size="small"
                :show-info="false"
              />
              <span class="progress-text">{{ file.progress }}%</span>
            </div>
            
            <!-- 上传成功 -->
            <div v-else-if="file.status === 'success'" class="status-success">
              <CheckCircleOutlined />
              <span>{{ t('fileUploader_uploadSuccess') }}</span>
            </div>
            
            <!-- 上传失败 -->
            <div v-else-if="file.status === 'error'" class="status-error">
              <CloseCircleOutlined />
              <span>{{ file.error || t('fileUploader_uploadFailedStatus') }}</span>
            </div>
            
            <!-- 等待上传 -->
            <div v-else class="status-pending">
              <ClockCircleOutlined />
              <span>{{ t('fileUploader_waitingUpload') }}</span>
            </div>
          </div>
          
          <div class="file-actions">
            <!-- 取消上传 -->
            <a-button
              v-if="file.status === 'uploading'"
              type="text"
              size="small"
              danger
              @click="cancelUpload(file.id)"
              :title="t('fileUploader_cancelUpload')"
            >
              <CloseOutlined />
            </a-button>
            
            <!-- 重新上传 -->
            <a-button
              v-else-if="file.status === 'error'"
              type="text"
              size="small"
              @click="retryUpload(file)"
              :title="t('fileUploader_retryUpload')"
            >
              <ReloadOutlined />
            </a-button>
            
            <!-- 移除文件 -->
            <a-button
              v-else
              type="text"
              size="small"
              danger
              @click="removeFile(file.id)"
              :title="t('fileUploader_removeFile')"
            >
              <DeleteOutlined />
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传按钮 -->
    <div v-if="fileList.length > 0" class="upload-actions">
      <a-button
        type="primary"
        :loading="uploading"
        :disabled="!canUpload || disabled"
        @click="startUpload"
        class="upload-button"
      >
        <template #icon>
          <UploadOutlined />
        </template>
        {{ uploading ? t('fileUploader_uploadingCount', { uploaded: uploadedCount, total: fileList.length }) : t('fileUploader_startUpload') }}
      </a-button>
      
      <a-button
        v-if="!uploading"
        @click="clearFileList"
        :disabled="disabled"
      >
        {{ t('fileUploader_cancelButton') }}
      </a-button>
    </div>

    <!-- 提示信息 -->
    <div v-if="hint" class="upload-hint">
      {{ hint }}
    </div>

    <!-- 错误信息 -->
    <a-alert
      v-if="error"
      :message="error"
      type="error"
      show-icon
      closable
      class="error-alert"
      @close="error = ''"
    />
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import {
  CloudUploadOutlined,
  UploadOutlined,
  FileOutlined,
  FileImageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  ReloadOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()

const props = defineProps({
  // 当前文件夹路径
  folderPath: {
    type: String,
    required: true
  },
  // 是否支持多文件上传
  multiple: {
    type: Boolean,
    default: true
  },
  // 接受的文件类型
  accept: {
    type: String,
    default: '.webp,.jpg,.jpeg,.png,.gif,.bmp,.svg'
  },
  // 文件大小限制（MB）
  maxSize: {
    type: Number,
    default: 10
  },
  // 上传按钮文本
  buttonText: {
    type: String,
    default: '上传文件'
  },
  // 是否显示拖拽区域
  showDragArea: {
    type: Boolean,
    default: true
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['upload-start', 'upload-progress', 'upload-complete', 'upload-error'])

// 响应式数据
const fileInput = ref(null)
const fileList = ref([])
const error = ref('')
const uploading = ref(false)
const isDragOver = ref(false)

// 计算属性
const canUpload = computed(() => {
  return fileList.value.length > 0 && 
         fileList.value.some(file => file.status === 'pending' || file.status === 'error')
})

const uploadedCount = computed(() => {
  return fileList.value.filter(file => file.status === 'success').length
})

const hint = computed(() => {
  const maxSizeMB = props.maxSize
  const acceptTypes = props.accept.split(',').map(type => type.trim()).join('、')
  return `${t('fileUploader_supportFormats')} ${acceptTypes} ${t('fileUploader_formatSizeLimit')} ${maxSizeMB}${t('fileUploader_mb')}`
})

// 方法
const triggerFileInput = () => {
  if (!props.disabled) {
    fileInput.value?.click()
  }
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  addFiles(files)
  // 清空input值，允许重复选择相同文件
  event.target.value = ''
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (props.disabled) return
  
  const files = Array.from(event.dataTransfer.files)
  addFiles(files)
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
  error.value = ''
  
  // 验证文件数量
  if (!props.multiple && files.length > 1) {
    error.value = t('fileUploader_singleFileOnlyMsg')
    return
  }
  
  // 验证每个文件
  for (const file of files) {
    const validationError = validateFile(file)
    if (validationError) {
      error.value = validationError
      return
    }
  }
  
  // 添加文件到列表
  files.forEach(file => {
    const fileId = generateFileId()
    fileList.value.push({
      id: fileId,
      name: file.name,
      size: file.size,
      file: file,
      status: 'pending',
      progress: 0,
      error: ''
    })
  })
}

const validateFile = (file) => {
  // 验证文件大小
  const maxSizeBytes = props.maxSize * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return t('fileUploader_fileSizeExceeds', { maxSize: props.maxSize })
  }
  
  // 验证文件类型
  const extension = '.' + file.name.split('.').pop().toLowerCase()
  if (!props.accept.includes(extension)) {
    return t('fileUploader_fileTypeUnsupported', { types: props.accept })
  }
  
  return null
}

const isImageFile = (filename) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const generateFileId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9)
}

const removeFile = (fileId) => {
  const index = fileList.value.findIndex(file => file.id === fileId)
  if (index !== -1) {
    fileList.value.splice(index, 1)
  }
}

const clearFileList = () => {
  fileList.value = []
  error.value = ''
}

const startUpload = async () => {
  if (!canUpload.value || uploading.value) return
  
  uploading.value = true
  error.value = ''
  
  emit('upload-start', { files: fileList.value })
  
  // 串行上传文件
  for (const fileItem of fileList.value) {
    if (fileItem.status === 'pending' || fileItem.status === 'error') {
      await uploadFile(fileItem)
    }
  }
  
  uploading.value = false
  
  // 检查上传结果
  const successCount = fileList.value.filter(file => file.status === 'success').length
  const errorCount = fileList.value.filter(file => file.status === 'error').length
  
  if (errorCount === 0) {
    emit('upload-complete', { 
      success: true, 
      files: fileList.value,
      uploadedCount: successCount
    })
  } else {
    emit('upload-complete', { 
      success: false, 
      files: fileList.value,
      uploadedCount: successCount,
      errorCount: errorCount
    })
  }
}

const uploadFile = async (fileItem) => {
  fileItem.status = 'uploading'
  fileItem.progress = 0
  fileItem.error = ''
  
  try {
    const formData = new FormData()
    formData.append('file', fileItem.file)
    formData.append('folderPath', props.folderPath)
    
    const xhr = new XMLHttpRequest()
    
    // 监听上传进度
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        fileItem.progress = progress
        emit('upload-progress', { 
          progress, 
          file: fileItem.name,
          fileId: fileItem.id
        })
      }
    })
    
    // 处理响应
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          if (response.success) {
            fileItem.status = 'success'
            fileItem.progress = 100
          } else {
            throw new Error(response.error || '上传失败')
          }
        } catch (error) {
          throw new Error(t('fileUploader_parseResponseFailed'))
        }
      } else {
        throw new Error(`${t('fileUploader_serverErrorMsg')} ${xhr.status}`)
      }
    })
    
    // 处理错误
    xhr.addEventListener('error', () => {
      throw new Error(t('fileUploader_networkErrorMsg'))
    })
    
    // 发送请求
    xhr.open('POST', '/api/upload-file')
    xhr.send(formData)
    
    // 等待上传完成
    await new Promise((resolve, reject) => {
      xhr.addEventListener('loadend', () => {
        if (fileItem.status === 'success') {
          resolve()
        } else {
          reject(new Error(fileItem.error || '上传失败'))
        }
      })
    })
    
  } catch (err) {
    fileItem.status = 'error'
    fileItem.error = err.message
    emit('upload-error', { 
      error: err.message, 
      file: fileItem.name,
      fileId: fileItem.id
    })
  }
}

const cancelUpload = (fileId) => {
  // 这里可以实现取消上传的逻辑
  // 目前只是将文件状态改为错误
  const fileItem = fileList.value.find(file => file.id === fileId)
  if (fileItem) {
    fileItem.status = 'error'
    fileItem.error = '上传已取消'
  }
}

const retryUpload = (fileItem) => {
  fileItem.status = 'pending'
  fileItem.progress = 0
  fileItem.error = ''
}

// 清理
onUnmounted(() => {
  // 清理资源
})

// 暴露方法给父组件
defineExpose({
  clearFileList,
  reset: clearFileList
})
</script>

<style scoped>
.file-uploader {
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

/* 文件列表 */
.file-list {
  margin-top: 20px;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.file-count {
  font-size: 14px;
  color: #8c8c8c;
  font-weight: 500;
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: white;
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: #d9d9d9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-item--uploading {
  border-left: 3px solid #1890ff;
}

.file-item--success {
  border-left: 3px solid #52c41a;
}

.file-item--error {
  border-left: 3px solid #ff4d4f;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-icon {
  font-size: 20px;
  color: #1890ff;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #8c8c8c;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.progress-text {
  font-size: 12px;
  color: #1890ff;
  font-weight: 500;
}

.status-success {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #52c41a;
  font-size: 12px;
}

.status-error {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff4d4f;
  font-size: 12px;
}

.status-pending {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #8c8c8c;
  font-size: 12px;
}

.file-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
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
}

/* 提示信息 */
.upload-hint {
  margin-top: 12px;
  font-size: 12px;
  color: #8c8c8c;
  text-align: center;
  line-height: 1.4;
}

/* 错误信息 */
.error-alert {
  margin-top: 12px;
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
  
  .file-item {
    padding: 10px;
    gap: 8px;
  }
  
  .file-info {
    gap: 8px;
  }
  
  .file-icon {
    font-size: 16px;
  }
  
  .file-name {
    font-size: 13px;
  }
  
  .file-size {
    font-size: 11px;
  }
  
  .upload-progress {
    min-width: 100px;
  }
  
  .progress-text {
    font-size: 11px;
  }
  
  .status-success,
  .status-error,
  .status-pending {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .upload-area {
    padding: 24px 12px;
  }
  
  .upload-icon {
    font-size: 32px;
  }
  
  .upload-content {
    gap: 12px;
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .file-status {
    width: 100%;
    justify-content: space-between;
  }
  
  .file-actions {
    width: 100%;
    justify-content: flex-end;
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
