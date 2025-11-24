<template>
  <div class="product-folder-uploader">
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
          <FolderOpenOutlined />
        </div>
        <div class="upload-text">
          <div class="upload-title">{{ buttonText }}</div>
          <div class="upload-subtitle">
            点击或拖拽 ZIP 压缩包到此处上传完整产品文件夹
          </div>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept=".zip"
          :disabled="disabled"
          @change="handleFileSelect"
          class="file-input"
        />
      </div>
    </div>

    <!-- 文件夹名称输入 -->
    <div v-if="selectedFile" class="folder-name-section">
      <a-form-item label="产品文件夹名称" required>
        <a-input
          v-model:value="folderName"
          placeholder="请输入产品文件夹名称"
          :disabled="uploading"
          @input="validateFolderName"
        />
        <div v-if="folderNameError" class="error-text">
          {{ folderNameError }}
        </div>
        <div v-if="actualFolderName" class="info-text">
          检测到文件夹名称冲突，将重命名为: <strong>{{ actualFolderName }}</strong>
        </div>
      </a-form-item>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress-section">
      <div class="progress-header">
        <span>正在上传产品文件夹...</span>
        <span class="progress-percent">{{ uploadProgress }}%</span>
      </div>
      <a-progress
        :percent="uploadProgress"
        :show-info="false"
        status="active"
      />
      <div class="progress-details">
        <div>文件: {{ processedFiles }}/{{ totalFiles }}</div>
        <div>文件夹: {{ processedFolders }}/{{ totalFolders }}</div>
      </div>
    </div>

    <!-- 上传结果 -->
    <div v-if="uploadResult" class="upload-result">
      <a-alert
        :message="uploadResult.success ? '上传成功' : '上传失败'"
        :type="uploadResult.success ? 'success' : 'error'"
        show-icon
        closable
        @close="uploadResult = null"
      >
        <template #description>
          <div v-if="uploadResult.success">
            <p>产品文件夹: <strong>{{ uploadResult.actualName }}</strong></p>
            <p>处理了 {{ uploadResult.fileCount }} 个文件</p>
            <p>创建了 {{ uploadResult.folderCount }} 个文件夹</p>
          </div>
          <div v-else>
            <p>{{ uploadResult.error }}</p>
          </div>
        </template>
      </a-alert>
    </div>

    <!-- 上传按钮 -->
    <div v-if="selectedFile && !uploading" class="upload-actions">
      <a-button
        type="primary"
        :disabled="!canUpload || disabled"
        @click="startUpload"
        class="upload-button"
      >
        <template #icon>
          <UploadOutlined />
        </template>
        开始上传
      </a-button>
      
      <a-button
        @click="resetUpload"
        :disabled="disabled"
      >
        取消
      </a-button>
    </div>

    <!-- 提示信息 -->
    <div class="upload-hint">
      <p><strong>使用说明:</strong></p>
      <ul>
        <li>上传 ZIP 格式的压缩包，包含完整的产品文件夹结构</li>
        <li>压缩包必须包含一个根文件夹，其中包含所有子文件夹和文件</li>
        <li>如果文件夹名称已存在，系统会自动添加后缀（如：文件夹名_副本1）</li>
        <li>支持最大 100MB 的压缩包</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import {
  FolderOpenOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'

const props = defineProps({
  // 上传按钮文本
  buttonText: {
    type: String,
    default: '上传产品文件夹'
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['upload-start', 'upload-complete'])

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
    alert('只支持 ZIP 格式的压缩包')
    return
  }

  // 验证文件大小（100MB）
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    alert('文件大小超过 100MB 限制')
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
    folderNameError.value = '文件夹名称不能为空'
    return
  }
  
  // 检查名称有效性
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/
  if (invalidChars.test(folderName.value)) {
    folderNameError.value = '文件夹名称包含无效字符'
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
            throw new Error(response.error || '上传失败')
          }
        } catch (error) {
          throw new Error('解析响应失败: ' + error.message)
        }
      } else {
        // 尝试解析错误响应
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          throw new Error(errorResponse.error || `服务器错误: ${xhr.status}`)
        } catch (parseError) {
          throw new Error(`服务器错误: ${xhr.status} - ${xhr.statusText}`)
        }
      }
    })
    
    // 处理错误
    xhr.addEventListener('error', () => {
      throw new Error('网络错误，请检查网络连接')
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
  resetUpload
})
</script>

<style scoped>
.product-folder-uploader {
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

/* 文件夹名称输入 */
.folder-name-section {
  margin-top: 20px;
  padding: 20px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.error-text {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}

.info-text {
  color: #1890ff;
  font-size: 12px;
  margin-top: 4px;
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
