<template>
  <div class="zip-upload-zone-section">
    <!-- 压缩包拖拽上传区域 -->
    <div
      class="zip-upload-zone"
      :class="{ 'drag-over': isDragOver }"
      @click="selectZipFiles"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <input
        ref="zipFileInput"
        type="file"
        accept=".zip,.rar,.7z"
        @change="handleZipFileSelection"
        style="display: none;"
      />
      <div class="upload-zone-content">
        <LucideIcon name="Upload" class="upload-icon" />
        <h4 class="upload-zone-title">{{ t('productManagement_uploadZipFile') }}</h4>
        <p class="upload-zone-hint">{{ t('productManagement_clickOrDragHint') }}</p>
      </div>
    </div>

    <!-- 已选择的压缩包 -->
    <div v-if="selectedZipFiles.length > 0" class="selected-files">
      <h5>{{ t('productManagement_selectedZipFile') }}</h5>
      <div class="files-list">
        <div v-for="(file, index) in selectedZipFiles" :key="index" class="file-item">
          <LucideIcon name="Archive" class="h-4 w-4 text-primary" />
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">({{ formatFileSize(file.size) }})</span>
          <span class="file-validation" :class="{ 'valid': zipFileValid, 'invalid': !zipFileValid && zipFileValidationChecked }">
            <LucideIcon :name="zipFileValid ? 'CheckCircle' : 'XCircle'" class="h-4 w-4" />
          </span>
          <Button
            variant="text"
            size="small"
            @click="removeZipFile(index)"
            class="remove-file-btn"
          >
            <LucideIcon name="X" class="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <!-- 文件验证状态 -->
      <div v-if="zipFileValidationChecked" class="validation-status">
        <div v-if="zipFileValid" class="validation-success">
          <LucideIcon name="CheckCircle" class="h-4 w-4 text-green-500" />
          <span>{{ t('productManagement_zipFileValid') }}</span>
        </div>
        <div v-else class="validation-error">
          <LucideIcon name="XCircle" class="h-4 w-4 text-red-500" />
          <span>{{ zipFileValidationMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import Button from './ui/button.vue'
import LucideIcon from './ui/LucideIcon.vue'
import JSZip from 'jszip'

const { t } = useI18n()

// Props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'file-selected',
  'file-validated',
  'file-removed'
])

// 响应式数据
const selectedZipFiles = ref([])
const zipFileInput = ref(null)
const isDragOver = ref(false)
const zipFileValid = ref(false)
const zipFileValidationChecked = ref(false)
const zipFileValidationMessage = ref('')

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 触发文件选择
const selectZipFiles = () => {
  zipFileInput.value?.click()
}

// 处理文件选择
const handleZipFileSelection = async (event) => {
  const files = Array.from(event.target.files)
  await processZipFiles(files)
}

// 处理拖拽放置
const handleDrop = async (event) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = Array.from(event.dataTransfer.files)
  await processZipFiles(files)
}

// 处理拖拽悬停
const handleDragOver = (event) => {
  event.preventDefault()
  isDragOver.value = true
}

// 处理拖拽离开
const handleDragLeave = (event) => {
  event.preventDefault()
  isDragOver.value = false
}

// 处理ZIP文件
const processZipFiles = async (files) => {
  // 过滤只保留压缩包文件
  const zipFiles = files.filter(file => {
    const ext = file.name.toLowerCase().split('.').pop()
    return ['zip', 'rar', '7z'].includes(ext)
  })
  selectedZipFiles.value = zipFiles
  
  // 重置验证状态
  zipFileValid.value = false
  zipFileValidationChecked.value = false
  zipFileValidationMessage.value = ''
  
  // 验证选择的文件
  if (zipFiles.length > 0) {
    await validateZipFile(zipFiles[0])
    // 通知父组件文件已选择
    emit('file-selected', selectedZipFiles.value)
  }
}

// 验证ZIP文件
const validateZipFile = async (file) => {
  try {
    // 检查文件大小 (限制为500MB)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      zipFileValidationMessage.value = t('productManagement_fileTooLarge')
      zipFileValid.value = false
      zipFileValidationChecked.value = true
      return
    }
    
    // 检查文件类型
    const ext = file.name.toLowerCase().split('.').pop()
    if (!['zip', 'rar', '7z'].includes(ext)) {
      zipFileValidationMessage.value = t('productManagement_unsupportedFileType')
      zipFileValid.value = false
      zipFileValidationChecked.value = true
      return
    }
    
    // 模拟文件验证过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    zipFileValid.value = true
    zipFileValidationChecked.value = true
    zipFileValidationMessage.value = ''
    
    // 通知父组件文件验证结果
    emit('file-validated', {
      valid: true,
      files: selectedZipFiles.value
    })
    
  } catch (error) {
    console.error('ZIP文件验证失败:', error)
    zipFileValidationMessage.value = t('productManagement_zipValidationFailed')
    zipFileValid.value = false
    zipFileValidationChecked.value = true
    
    // 通知父组件文件验证结果
    emit('file-validated', {
      valid: false,
      message: zipFileValidationMessage.value,
      files: selectedZipFiles.value
    })
  }
}

// 移除ZIP文件
const removeZipFile = (index) => {
  selectedZipFiles.value.splice(index, 1)
  
  // 重置验证状态
  zipFileValid.value = false
  zipFileValidationChecked.value = false
  zipFileValidationMessage.value = ''
  
  // 通知父组件文件已移除
  emit('file-removed', index)
  emit('file-selected', selectedZipFiles.value)
}
</script>

<style scoped>
.zip-upload-zone-section {
  padding: 20px;
}

/* 拖拽上传区域样式 */
.zip-upload-zone {
  border: 2px dashed #cecece;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  margin-bottom: 20px;
}

.zip-upload-zone:hover {
  border-color: #00a0d9;
  background: #f0f9ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 160, 217, 0.15);
}

.zip-upload-zone.drag-over {
  border-color: #00a0d9;
  background: #e6f7ff;
  box-shadow: 0 0 0 4px rgba(0, 160, 217, 0.1);
}

.upload-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-icon {
  width: 42px;
  height: 42px;
  color: #00a0d9;
}

.upload-zone-title {
  font-size: 14px;
  color: #202020;
  margin: 0;
  font-family: "Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 21px;
  letter-spacing: 0;
  font-weight: 400;
}

.upload-zone-hint {
  font-size: 12px;
  color: #626262;
  margin: 0;
  font-family: "Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 21px;
  letter-spacing: 0;
}

.selected-files {
  margin-top: 20px;
}

.selected-files h5 {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.files-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 13px;
  color: #262626;
  transition: all 0.2s ease;
  height: auto;
}

.file-item:hover {
  background: #f0f9ff;
  border-color: #91d5ff;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-name {
  flex: 1;
  font-weight: 500;
  color: #262626;
}

.file-size {
  color: #8c8c8c;
  font-size: 12px;
  font-family: monospace;
}

.remove-file-btn {
  color: #8c8c8c;
  padding: 4px;
}

.remove-file-btn:hover {
  color: #ff4d4f;
  background: #fff2f0;
}

/* 文件验证状态 */
.validation-status {
  margin-top: 12px;
  height: 32px;
  width: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
}

.validation-success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #389e0d;
  height: 32px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.validation-error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #cf1322;
  height: 32px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.file-validation {
  margin-left: auto;
}

.file-validation.valid {
  color: #52c41a;
}

.file-validation.invalid {
  color: #ff4d4f;
}
</style>