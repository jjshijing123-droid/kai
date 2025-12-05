<template>
  <Modal
    :open="open"
    :title="t('productManagement_batchUpload')"
    width="w-[520px]"
    @close="handleClose"
  >
    <div class="batch-upload-content">
      <!-- 操作步骤指示器 -->
      <div class="step-indicator">
        <div
          v-for="(step, index) in uploadSteps"
          :key="step.key"
          class="step-item"
          :class="{
            'step-active': currentUploadStep === index + 1,
            'step-completed': currentUploadStep > index + 1,
            'step-pending': currentUploadStep < index + 1
          }"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-title">{{ step.title }}</div>
          <div class="step-description">{{ step.description }}</div>
        </div>
      </div>

      <!-- 第一步：选择压缩包 -->
      <div v-if="currentUploadStep === 1" class="zip-upload-section">
        <div class="upload-area" @click="triggerFileInput">
          <input
            ref="fileInput"
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

        <!-- 批量上传使用说明 -->
        <div class="file-upload-instructions">
          <div class="instructions-header">
            <div class="instructions-icon">
              <LucideIcon name="Info" />
            </div>
            <h4>{{ t('common_usageInstructions') }}</h4>
          </div>
          <div class="instructions-content">
            <div class="instructions-item">
              <LucideIcon name="FileArchive" />
              <span>{{ t('common_uploadZipInstructions') }}</span>
            </div>
            <div class="instructions-item">
              <LucideIcon name="AlertCircle" />
              <span>{{ t('common_maxFileSize') }}</span>
            </div>
            <div class="instructions-item">
              <LucideIcon name="FolderTree" />
              <span>{{ t('common_rootFolderRequirement') }}</span>
            </div>
            <div class="instructions-item">
              <LucideIcon name="RefreshCw" />
              <span>{{ t('common_batchReplaceInstructions') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二步：上传进度 -->
      <div v-if="currentUploadStep === 2" class="progress-section space-y-4">
        <!-- 已选择的文件 -->
        <div v-if="selectedZipFiles.length > 0" class="selected-files">
          <h5 class="text-sm font-medium text-neutral-12 mb-2">{{ t('productManagement_selectedZipFile') }}</h5>
          <div class="space-y-2">
            <div v-for="(file, index) in selectedZipFiles" :key="index" class="flex items-center gap-3 p-2 bg-neutral-2 rounded-md">
              <LucideIcon name="Archive" class="h-4 w-4 text-primary" />
              <span class="text-sm text-neutral-11 flex-1">{{ file.name }}</span>
              <span class="text-xs text-neutral-9">({{ formatFileSize(file.size) }})</span>
            </div>
          </div>
        </div>

        <!-- 上传进度 -->
        <div class="upload-progress p-4 bg-green-2 border border-green-6 rounded-lg">
          <div class="space-y-4">
            <!-- 进度状态和百分比 -->
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-green-10">{{ uploadStatus }}</span>
              <span class="text-sm font-semibold text-green-11">{{ Math.round(uploadProgress) }}%</span>
            </div>
            
            <!-- 进度条 -->
            <Progress :percent="uploadProgress" class="w-full h-2" />
            
            <!-- 详细的进度信息 -->
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-xs text-neutral-10">{{ t('productManagement_currentStage') }}</span>
                <span class="text-xs font-medium text-neutral-12">{{ currentStageText }}</span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex justify-between items-center">
                  <span class="text-xs text-neutral-10">{{ t('productManagement_processedFiles') }}</span>
                  <span class="text-xs font-semibold text-primary-9">{{ processedFiles }}/{{ totalFiles }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-xs text-neutral-10">{{ t('productManagement_processedFolders') }}</span>
                  <span class="text-xs font-semibold text-primary-9">{{ processedFolders }}/{{ totalFolders }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <Button @click="handleClose" :disabled="uploading"  variant="line" size="40">
        {{ t('productManagement_cancel') }}
      </Button>
      
      <Button
        v-if="currentUploadStep === 1"
        @click="nextStep"
        variant="fill"
        size="40"
        :disabled="!zipFileValid || uploading"
        class="next-step-button"
      >
        {{ t('productManagement_startUpload') }}
        <LucideIcon name="ChevronRight" size="16"/>
      </Button>
      
      <Button
        v-if="currentUploadStep === 2"
        @click="prevStep"
        variant="line"
        size="40"
        class="prev-step-button"
      >
        <LucideIcon name="ChevronLeft" size="16" />
        {{ t('productManagement_back') }}
      </Button>
      
      <Button
        v-if="currentUploadStep === 2"
        @click="startBatchZipUpload"
        variant="fill"
        size="40"
        :disabled="uploading"
        :loading="uploading"
        class="upload-button"
      >
        <LucideIcon name="Upload" size="16" />
        {{ t('productManagement_startUpload') }}
      </Button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import Button from './ui/button.vue'
import Modal from './ui/modal.vue'
import Progress from './ui/progress.vue'
import LucideIcon from './ui/LucideIcon.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'upload-complete'])

const { t } = useI18n()

// 响应式数据
const uploading = ref(false)
const selectedZipFiles = ref([])
const fileInput = ref(null)
const uploadStatus = ref('')
const uploadProgress = ref(0)
const currentUploadStep = ref(1)

// ZIP文件验证和预览相关数据
const zipFileValid = ref(false)
const zipFileValidationMessage = ref('')

// 进度跟踪相关数据
const processedFiles = ref(0)
const totalFiles = ref(0)
const processedFolders = ref(0)
const totalFolders = ref(0)
const currentStageText = ref('')

const uploadSteps = computed(() => [
  {
    key: 'select',
    title: t('productManagement_step1_title'),
    description: t('productManagement_step1_description')
  },
  {
    key: 'upload',
    title: t('productManagement_step3_title'),
    description: t('productManagement_step3_description')
  }
])

// 方法
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleClose = () => {
  if (!uploading.value) {
    resetState()
    emit('close')
  }
}

const resetState = () => {
  selectedZipFiles.value = []
  uploadStatus.value = ''
  uploadProgress.value = 0
  currentUploadStep.value = 1
  zipFileValid.value = false
  zipFileValidationMessage.value = ''
  processedFiles.value = 0
  totalFiles.value = 0
  processedFolders.value = 0
  totalFolders.value = 0
  currentStageText.value = ''
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理ZIP文件选择
const handleZipFileSelection = async (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    const zipFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop()
      return ['zip', 'rar', '7z'].includes(ext)
    })
    selectedZipFiles.value = zipFiles
    handleZipFileSelected(zipFiles)
    if (zipFiles.length > 0) {
      // 简单验证
      zipFileValid.value = true
      // 文件选择后自动跳转到第二步
      nextStep()
    }
  }
}

// 处理ZIP文件选择
const handleZipFileSelected = (files) => {
  selectedZipFiles.value = files
}

// 处理ZIP文件验证
const handleZipFileValidated = (validationResult) => {
  zipFileValid.value = validationResult.valid
  if (!validationResult.valid) {
    zipFileValidationMessage.value = validationResult.message
  } else {
    zipFileValidationMessage.value = ''
  }
}

const handleZipFileRemoved = (index) => {
  // 文件移除处理
  selectedZipFiles.value.splice(index, 1)
}

// 多步骤导航方法
const nextStep = async () => {
  if (currentUploadStep.value === 1) {
    if (zipFileValid.value) {
      currentUploadStep.value = 2
    }
  }
}

const prevStep = () => {
  if (currentUploadStep.value > 1) {
    currentUploadStep.value--
  }
}

const startBatchZipUpload = async () => {
  if (selectedZipFiles.value.length === 0) return
  
  currentUploadStep.value = 2
  uploading.value = true
  uploadProgress.value = 0
  
  try {
    const zipFile = selectedZipFiles.value[0]
    
    // 阶段1: 准备上传
    uploadStatus.value = t('productManagement_preparingUpload')
    currentStageText.value = t('productManagement_stagePreparing')
    uploadProgress.value = 10
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 阶段2: 上传文件
    uploadStatus.value = t('productManagement_uploadingFile')
    currentStageText.value = t('productManagement_stageUploading')
    uploadProgress.value = 30
    
    const formData = new FormData()
    formData.append('zipFile', zipFile)
    
    // 模拟文件上传进度
    for (let i = 30; i <= 60; i += 5) {
      uploadProgress.value = i
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // 阶段3: 处理文件
    uploadStatus.value = t('productManagement_processingFiles')
    currentStageText.value = t('productManagement_stageProcessing')
    uploadProgress.value = 65
    
    // 调用批量替换API
    const response = await fetch('/api/batch-replace-products', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`处理压缩包失败: ${zipFile.name} - ${errorData.message || response.status}`)
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(`处理压缩包失败: ${zipFile.name} - ${result.message}`)
    }
    
    // 更新处理统计
    processedFiles.value = result.fileCount || 0
    totalFiles.value = result.fileCount || 0
    processedFolders.value = result.folderCount || 0
    totalFolders.value = result.folderCount || 0
    
    // 阶段4: 完成
    uploadStatus.value = t('productManagement_completingUpload')
    currentStageText.value = t('productManagement_stageCompleting')
    uploadProgress.value = 90
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 刷新产品列表
    uploadStatus.value = t('productManagement_refreshingList')
    currentStageText.value = t('productManagement_stageRefreshing')
    
    uploadProgress.value = 100
    uploadStatus.value = t('productManagement_uploadComplete')
    currentStageText.value = t('productManagement_stageComplete')
    
    // 通知父组件上传完成
    setTimeout(() => {
      emit('upload-complete', { success: true, result })
      handleClose()
    }, 1500)
    
  } catch (err) {
    console.error('批量压缩包上传错误:', err)
    uploadStatus.value = t('productManagement_uploadFailed') + ': ' + err.message
    currentStageText.value = t('productManagement_stageFailed')
    uploadProgress.value = 0
    
    emit('upload-complete', { success: false, error: err.message })
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.batch-upload-content {
  margin: 16px 0;
}

/* 步骤指示器 */
.step-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--neutral-2);
  border-radius: 8px;
  border: 1px solid var(--neutral-4);
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  padding: 8px;
  transition: all 0.3s ease;
}

.step-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 20px;
  right: -50%;
  width: 100%;
  height: 2px;
  background: var(--neutral-5);
  z-index: 1;
}

.step-item.step-completed:not(:last-child)::after {
  background: var(--primary-9);
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  z-index: 2;
  position: relative;
  background: var(--neutral-2);
  border: 2px solid var(--neutral-5);
  color: var(--neutral-10);
  transition: all 0.3s ease;
}

.step-item.step-active .step-number {
  background: var(--primary-9);
  border-color: var(--primary-9);
  color: var(--background);
  box-shadow: 0 0 0 4px rgba(0, 160, 217, 0.2);
}

.step-item.step-completed .step-number {
  background: var(--green-9);
  border-color: var(--green-9);
  color: var(--background);
}

.step-title {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 4px;
  color: var(--neutral-11);
}

.step-item.step-active .step-title {
  color: var(--primary-9);
}

.step-description {
  font-size: 11px;
  text-align: center;
  color: var(--neutral-10);
  line-height: 1.3;
}

.selected-files {
  margin-top: 20px;
}

.selected-files h5 {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-12);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}





/* ZIP上传区域样式 */
.zip-upload-section {
  margin: 16px 0;
}

.upload-area {
  border: 2px dashed var(--neutral-6);
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--neutral-2);
}

.upload-area:hover {
  border-color: var(--primary-9);
  background: var(--primary-3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 160, 217, 0.15);
}

.upload-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-icon svg {
  width: 40px;
  height: 40px;
  color: var(--primary-9);
}

.upload-zone-title {
  font-size: 14px;
  color: var(--neutral-12);
  margin: 0;
  font-family: "Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 21px;
  letter-spacing: 0;
  font-weight: 400;
}

.upload-zone-hint {
  font-size: 12px;
  color: var(--neutral-11);
  margin: 0;
  font-family: "Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 21px;
  letter-spacing: 0;
}

/* 提示信息 */
.file-upload-instructions {
  margin-top: 20px;
  padding: 16px;
  background: var(--primary-2);
  border: 1px solid var(--primary-6);
  border-radius: 6px;
  font-size: 14px;
  color: var(--neutral-11);
}

.instructions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.instructions-header .instructions-icon {
  color: var(--primary-9);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.instructions-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--neutral-12);
}

.instructions-content {
  display: flex;
  flex-direction: column;
  gap: 0px;
}

.instructions-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.instructions-item svg {
  font-size: 16px;
  color: var(--primary-9);
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.instructions-item span {
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .step-indicator {
    flex-direction: column;
    gap: 16px;
  }
  
  .step-item:not(:last-child)::after {
    display: none;
  }
}
</style>