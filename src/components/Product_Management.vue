<template>
  <!-- 未登录提示 - 使用统一组件 -->
  <AdminAccessDenied
    v-if="!isAdminLoggedIn"
    subtitle-key="common_needAdminSubtitleProduct"
    :redirect-path="'/'"
    :back-button-text="t('productManagement_backToHome')"
    :on-login-success="handleLoginSuccess"
  />

  <!-- 管理员内容 -->
  <div v-else class="file-manager">
    <!-- 页面头部 -->
    <div class="page-header">
      <!-- Frame 348 -->
      <div class="frame348">
        <div class="frame335">
          <Button @click="goBack" variant="text" class="back-button">
            <LucideIcon name="ChevronLeft" class="h-4 w-4" />
          </Button>
          <h1 class="page-title">{{ t('productManagement_title') }}</h1>
        </div>
        <Button @click="refreshProducts" :loading="loading" variant="secondary" class="refresh-button">
          <LucideIcon name="RefreshCw" class="h-4 w-4" />
          {{ t('productManagement_refresh') }}
        </Button>
      </div>
      
      <!-- Frame 347 -->
      <div class="frame347">
        <!-- 搜索和操作区域 -->
        <div class="frame330">
          <div class="search-input-container">
            <SearchInput
              v-model="searchQuery"
              :placeholder="t('productManagement_pleaseInput')"
              class="search-input"
            />
          </div>
          <div class="action-buttons">
            <Button @click="showCreateFolderModalEnhanced" variant="primary" class="create-folder-button">
              <LucideIcon name="FolderPlus" class="h-4 w-4" />
              {{ t('productManagement_createFolder') }}
            </Button>
            <Button @click="showBatchUploadModal = true" variant="primary" class="batch-upload-button">
              {{ t('productManagement_batchUpload') }}
            </Button>
          </div>
        </div>
        
        <!-- 面包屑和统计信息容器 -->
        <div class="breadcrumb-stats-container">
          <!-- 面包屑导航 -->
          <div class="breadcrumb-section">
            <div class="frame337">
              <LucideIcon name="Folder" class="h-4 w-4" />
              <span v-for="(pathItem, index) in currentPath" :key="index" class="breadcrumb-item">
                <span 
                  v-if="index === 0" 
                  class="breadcrumb-link" 
                  @click="navigateToPath([pathItem])"
                >
                  {{ pathItem }}
                </span>
                <span v-else>
                  <span class="breadcrumb-separator">/</span>
                  <span 
                    class="breadcrumb-link" 
                    @click="navigateToPath(currentPath.slice(0, index + 1))"
                  >
                    {{ pathItem }}
                  </span>
                </span>
              </span>
            </div>
          </div>
          
          <!-- 统计信息 -->
          <div class="stats-section">
            <div class="stats-right">
              <span>{{ t('productManagement_folderCount') }}: <span class="highlight">{{ filteredProducts.filter(p => p.isDirectory).length }}</span> {{ t('productManagement_slash') }} {{ t('productManagement_fileCount') }}: <span class="highlight">{{ filteredProducts.filter(p => !p.isDirectory).length }}</span></span>
            </div>
          </div>
        </div>
        
        <!-- 上传区域 -->
        <div class="upload-section" @click="showUploadFolderModal = true">
          <div class="upload-content">
            <LucideIcon name="Folder" class="h-10 w-10 text-primary" />
            <p class="upload-title">{{ t('productManagement_uploadFolder') }}</p>
            <p class="upload-hint">{{ t('productManagement_dragDropHint') }}</p>
          </div>
        </div>
        
        <!-- 产品文件夹列表 -->
        <div class="folder-grid">
          <div
            v-for="product in filteredProducts.filter(p => p.isDirectory)"
            :key="product.name"
            class="folder-item"
            @click="openFolder(product.name)"
            @contextmenu.prevent="handleShowContextMenu($event, product)"
          >
            <div class="folder-content">
              <div class="folder-icon">
                <LucideIcon name="Folder" />
              </div>
              <div class="folder-text-content">
                <div class="folder-info">
                  <span class="folder-name">{{ product.name }}</span>
                </div>
                <div class="folder-size">{{ formatFileSize(product.totalSize || 0) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 产品文件列表 -->
        <div class="file-list">
          <div
            v-for="file in filteredProducts.filter(p => !p.isDirectory)"
            :key="file.name"
            class="file-item"
            @contextmenu.prevent="handleShowContextMenu($event, file)"
          >
            <div class="file-content">
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-meta">
                  <span class="file-size">{{ formatFileSize(file.totalSize || 0) }}</span>
                  <span class="file-date">{{ new Date(file.modified).toLocaleDateString() }}</span>
                  <span class="file-time">{{ new Date(file.modified).toLocaleTimeString() }}</span>
                </div>
              </div>
              <div class="file-actions">
                <Button variant="ghost" size="sm">
                  <LucideIcon name="Eye" class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <LucideIcon name="Download" class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <LucideIcon name="Trash2" class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建文件夹模态框 -->
    <Modal
      :open="showCreateFolderModal"
      :title="t('productManagement_createProductFolder')"
      width="w-full max-w-sm mx-4 sm:mx-0 sm:w-[520px] sm:max-w-none"
      @close="closeCreateFolderModal"
    >
      <div class="space-y-4">
        <div class="space-y-2">
          <label for="folder-name-input" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ t('productManagement_folderName') }}
          </label>
          <Input
            id="folder-name-input"
            ref="folderNameInput"
            v-model="newFolderName"
            :placeholder="t('productManagement_inputFolderName')"
            @input="validateFolderName"
            @keydown="handleKeyDown"
            type="text"
            autocomplete="off"
            spellcheck="false"
            maxlength="50"
            :aria-label="t('productManagement_folderName')"
            :aria-invalid="!!folderNameError"
            role="textbox"
          />
        </div>
        <div v-if="folderNameError" class="text-sm text-red-500">
          {{ folderNameError }}
        </div>
      </div>
      
      <template #footer>
        <Button @click="closeCreateFolderModal" variant="secondary" :disabled="creatingFolder">
          {{ t('productManagement_cancel') }}
        </Button>
        <Button
          @click="createFolder"
          variant="primary"
          :disabled="!newFolderName || !!folderNameError || creatingFolder"
          :loading="creatingFolder"
        >
          {{ creatingFolder ? t('productManagement_creating') : t('productManagement_create') }}
        </Button>
      </template>
    </Modal>

    <!-- 重命名文件夹模态框 -->
    <Modal
      :open="showRenameFolderModal"
      :title="t('productManagement_renameFolder')"
      width="sm:max-w-md"
      @close="closeRenameFolderModal"
    >
      <div class="form-content">
        <div class="form-item">
          <label>{{ t('productManagement_newFolderName') }}</label>
          <Input
            v-model="renameFolderName"
            :placeholder="t('productManagement_inputNewFolderName')"
            @input="validateRenameFolderName"
          />
          <div v-if="renameFolderNameError" class="error-text">{{ renameFolderNameError }}</div>
        </div>
      </div>
      
      <template #footer>
        <Button @click="closeRenameFolderModal">
          {{ t('productManagement_cancel') }}
        </Button>
        <Button
          @click="confirmRenameFolder"
          variant="primary"
          :disabled="!renameFolderName || !!renameFolderNameError || renamingFolder"
          :loading="renamingFolder"
        >
          {{ renamingFolder ? t('productManagement_renaming') : t('productManagement_renameAction') }}
        </Button>
      </template>
    </Modal>

    <!-- 删除确认模态框 -->
    <Modal
      :open="showDeleteConfirm"
      :title="t('productManagement_confirmDelete')"
      width="sm:max-w-md"
      @close="cancelDelete"
      @ok="confirmDeleteFolder"
      :showFooter="true"
    >
      <p>{{ t('productManagement_deleteConfirmContent') }}{{ folderToDelete }}{{ t('productManagement_deleteConfirmContent2') }}</p>
      
      <template #footer>
        <Button @click="cancelDelete">
          {{ t('productManagement_cancelDelete') }}
        </Button>
        <Button
          @click="confirmDeleteFolder"
          variant="primary"
          class="danger"
        >
          {{ t('productManagement_okDelete') }}
        </Button>
      </template>
    </Modal>

    <!-- 上传文件夹模态框 -->
    <Modal
      :open="showUploadFolderModal"
      :title="t('productManagement_uploadProductFolder')"
      width="lg:max-w-2xl"
      @close="closeUploadFolderModal"
    >
      <ProductFolderUploader
        :disabled="uploading"
        @upload-start="handleUploadStart"
        @upload-complete="handleUploadComplete"
      />
    </Modal>

    <!-- 批量上传模态框 -->
    <Modal
      :open="showBatchUploadModal"
      :title="t('productManagement_batchUpload')"
      width="w-[520px]"
      @close="closeBatchUploadModal"
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
        <zip-upload-zone
          v-if="currentUploadStep === 1"
          ref="zipUploadZoneRef"
          :disabled="uploading"
          @file-selected="handleZipFileSelected"
          @file-validated="handleZipFileValidated"
          @file-removed="handleZipFileRemoved"
        />

        <!-- 第二步：上传进度 -->
        <div v-if="currentUploadStep === 2" class="progress-section space-y-4">
          <!-- 已选择的文件 -->
          <div v-if="selectedZipFiles.length > 0" class="selected-files">
            <h5 class="text-sm font-medium text-gray-700 mb-2">{{ t('productManagement_selectedZipFile') }}</h5>
            <div class="space-y-2">
              <div v-for="(file, index) in selectedZipFiles" :key="index" class="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                <LucideIcon name="Archive" class="h-4 w-4 text-primary" />
                <span class="text-sm text-gray-600 flex-1">{{ file.name }}</span>
                <span class="text-xs text-gray-500">({{ formatFileSize(file.size) }})</span>
              </div>
            </div>
          </div>

          <!-- 上传进度 -->
          <div class="upload-progress p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="space-y-4">
              <!-- 进度状态和百分比 -->
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-green-600">{{ uploadStatus }}</span>
                <span class="text-sm font-semibold text-green-700">{{ Math.round(uploadProgress) }}%</span>
              </div>
              
              <!-- 进度条 -->
              <Progress :percent="uploadProgress" class="w-full h-2" />
              
              <!-- 详细的进度信息 -->
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-xs text-gray-500">{{ t('productManagement_currentStage') }}</span>
                  <span class="text-xs font-medium text-gray-700">{{ currentStageText }}</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">{{ t('productManagement_processedFiles') }}</span>
                    <span class="text-xs font-semibold text-blue-600">{{ processedFiles }}/{{ totalFiles }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">{{ t('productManagement_processedFolders') }}</span>
                    <span class="text-xs font-semibold text-blue-600">{{ processedFolders }}/{{ totalFolders }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button @click="closeBatchUploadModal" :disabled="uploading">
          {{ t('productManagement_cancel') }}
        </Button>
        
        <Button
          v-if="currentUploadStep === 1"
          @click="nextStep"
          variant="primary"
          :disabled="!zipFileValid || uploading"
          class="next-step-button"
        >
          {{ t('productManagement_startUpload') }}
          <LucideIcon name="ChevronRight" class="h-4 w-4 ml-2" />
        </Button>
        
        <Button
          v-if="currentUploadStep === 2"
          @click="prevStep"
          variant="secondary"
          class="prev-step-button"
        >
          <LucideIcon name="ChevronLeft" class="h-4 w-4 mr-2" />
          {{ t('productManagement_back') }}
        </Button>
        
        <Button
          v-if="currentUploadStep === 2"
          @click="startBatchZipUpload"
          variant="primary"
          :disabled="uploading"
          :loading="uploading"
          class="upload-button"
        >
          <LucideIcon name="Upload" class="h-4 w-4 mr-2" />
          {{ t('productManagement_startUpload') }}
        </Button>
      </template>
    </Modal>

    <!-- 右键菜单 -->
    <div
      v-if="showContextMenu"
      class="context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      @click="hideContextMenu"
    >
      <!-- 只对文件夹显示打开选项 -->
      <div 
        v-if="contextMenuProduct.isDirectory" 
        class="context-menu-item" 
        @click="openFolder(contextMenuProduct.name)"
      >
        <LucideIcon name="FolderOpen" class="h-4 w-4" />
        <span>{{ t('productManagement_open') }}</span>
      </div>
      
      <!-- 重命名选项 -->
      <div class="context-menu-item" @click="renameFolder(contextMenuProduct.name)">
        <LucideIcon name="Edit" class="h-4 w-4" />
        <span>{{ t('productManagement_rename') }}</span>
      </div>
      
      <!-- 删除选项 -->
      <div class="context-menu-item" @click="deleteFolder(contextMenuProduct.name)">
        <LucideIcon name="Trash2" class="h-4 w-4" />
        <span>{{ t('productManagement_delete') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import AdminAccessDenied from './AdminAccessDenied.vue'
import Button from './ui/button.vue'
import Input from './ui/input.vue'
import Modal from './ui/modal.vue'
import Progress from './ui/progress.vue'
import LucideIcon from './ui/LucideIcon.vue'
import SearchInput from './ui/search-input.vue'
import JSZip from 'jszip'
import ProductFolderUploader from './ProductFolderUploader.vue'
import ZipUploadZone from './ZipUploadZone.vue'

const { t } = useI18n()
const router = useRouter()
const { isAdminLoggedIn } = useAdminAuth()

// 响应式数据
const products = ref([])
const currentFolderContent = ref([])
const currentPath = ref(['Product'])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const showCreateFolderModal = ref(false)
const showRenameFolderModal = ref(false)
const showUploadFolderModal = ref(false)
const showBatchUploadModal = ref(false)
const showDeleteConfirm = ref(false)
const creatingFolder = ref(false)
const renamingFolder = ref(false)
const uploading = ref(false)
const newFolderName = ref('')
const renameFolderName = ref('')
const folderToDelete = ref('')
const folderToRename = ref('')
const folderNameError = ref('')
const renameFolderNameError = ref('')
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuProduct = ref(null)
const selectedFiles = ref([])
const currentUploadIndex = ref(0)
const fileInput = ref(null)
const selectedZipFiles = ref([])
const zipFileInput = ref(null)
const zipUploadZoneRef = ref(null)
const uploadStatus = ref('')
const uploadProgress = ref(0)

// 新增：创建文件夹相关的响应式数据
const folderNameInput = ref(null)
const folderNameExamples = ref([
  '新产品系列',
  '2024年度产品',
  '移动应用',
  'Web应用',
  '桌面软件'
])
const isValidatingName = ref(false)
const nameValidationTimeout = ref(null)

// 拖拽上传相关数据
const isDragOver = ref(false)

// 新增：多步骤批量上传相关数据
const currentUploadStep = ref(1)
const uploadSteps = ref([
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

// ZIP文件验证和预览相关数据
const zipFileValid = ref(false)
const zipFileValidationChecked = ref(false)
const zipFileValidationMessage = ref('')
const zipFileStructure = ref(null)

// 进度跟踪相关数据
const processedFiles = ref(0)
const totalFiles = ref(0)
const processedFolders = ref(0)
const totalFolders = ref(0)
const currentStageText = ref('')

// 计算属性
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  return products.value.filter(product => 
    product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// API接口配置
const API_CONFIG = {
  GET_PRODUCTS: '/api/products',
  CREATE_PRODUCT: '/api/products',
  RENAME_PRODUCT: '/api/products',
  DELETE_PRODUCT: '/api/products'
}

// 主要的获取产品列表方法
const fetchProducts = async () => {
  try {
    // 初始加载时，获取当前路径下的内容
    await fetchFolderContent()
  } catch (err) {
    console.error('获取产品列表失败:', err)
    error.value = err.message
    products.value = []
    loading.value = false
  }
}

const refreshProducts = async () => {
  try {
    await fetchFolderContent()
  } catch (error) {
    console.error('手动刷新失败:', error)
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const validateFolderName = () => {
  // 清除之前的验证超时
  if (nameValidationTimeout.value) {
    clearTimeout(nameValidationTimeout.value)
  }
  
  isValidatingName.value = true
  
  // 模拟异步验证，延迟验证以避免频繁调用
  nameValidationTimeout.value = setTimeout(async () => {
    try {
      if (!newFolderName.value || newFolderName.value.trim() === '') {
        folderNameError.value = ''
        isValidatingName.value = false
        return
      }
      
      const name = newFolderName.value.trim()
      
      // 基本格式验证
      if (name.length < 2) {
        folderNameError.value = t('productManagement_folderNameTooShort')
        isValidatingName.value = false
        return
      }
      
      if (name.length > 50) {
        folderNameError.value = t('productManagement_folderNameTooLong')
        isValidatingName.value = false
        return
      }
      
      const invalidChars = /[<>:/\\|?*\x00-\x1F]/
      if (invalidChars.test(name)) {
        folderNameError.value = t('productManagement_folderNameContainsInvalid')
        isValidatingName.value = false
        return
      }
      
      // 检查是否以空格开头或结尾
      if (newFolderName.value !== name) {
        folderNameError.value = t('productManagement_folderNameNoLeadingTrailingSpaces')
        isValidatingName.value = false
        return
      }
      
      // 检查重复名称（客户端验证）
      if (products.value.some(p => p.name === name)) {
        folderNameError.value = t('productManagement_folderNameExists')
        isValidatingName.value = false
        return
      }
      
      // 特殊字符检查
      if (name.includes('..') || name.includes('//') || name.includes('\\\\')) {
        folderNameError.value = t('productManagement_folderNameContainsInvalidSequence')
        isValidatingName.value = false
        return
      }
      
      folderNameError.value = ''
    } catch (error) {
      console.error('验证文件夹名称时出错:', error)
      folderNameError.value = t('productManagement_validationError')
    } finally {
      isValidatingName.value = false
    }
  }, 300)
}

// 键盘事件处理
const handleKeyDown = (event) => {
  // Enter键创建文件夹
  if (event.key === 'Enter') {
    event.preventDefault()
    if (newFolderName.value && !folderNameError.value && !creatingFolder.value) {
      createFolder()
    }
  }
  
  // Escape键关闭弹窗
  if (event.key === 'Escape') {
    event.preventDefault()
    closeCreateFolderModal()
  }
}

// 应用示例名称
const applyExampleName = (exampleName) => {
  if (creatingFolder.value) return
  
  newFolderName.value = exampleName
  // 手动触发验证
  setTimeout(() => {
    validateFolderName()
    // 自动聚焦到输入框
    folderNameInput.value?.focus()
    // 选中所有文本
    folderNameInput.value?.select()
  }, 50)
}

const validateRenameFolderName = () => {
  if (!renameFolderName.value) {
    renameFolderNameError.value = ''
    return
  }
  
  const invalidChars = /[<>:/\\|?*\x00-\x1F]/
  if (invalidChars.test(renameFolderName.value)) {
    renameFolderNameError.value = t('productManagement_folderNameContainsInvalid')
    return
  }
  
  // 检查文件夹名称是否已存在（排除当前重命名的文件夹）
  if (renameFolderName.value !== folderToRename.value &&
      products.value.some(p => p.name === renameFolderName.value)) {
    renameFolderNameError.value = t('productManagement_folderNameExists')
    return
  }
  
  renameFolderNameError.value = ''
}

const createFolder = async () => {
  if (folderNameError.value || !newFolderName.value) return
  
  try {
    creatingFolder.value = true
    
    const response = await fetch(API_CONFIG.CREATE_PRODUCT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productName: newFolderName.value,
        folderName: newFolderName.value
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      console.log(`产品文件夹创建成功: ${newFolderName.value}`)
      
      // 重新获取产品列表
      await fetchProducts()
      // 关闭模态框
      closeCreateFolderModal()
    } else {
      throw new Error(data.message || t('productManagement_createFolderFailed'))
    }
  } catch (err) {
    console.error('创建文件夹错误:', err)
  } finally {
    creatingFolder.value = false
  }
}

const renameFolder = (folderName) => {
  folderToRename.value = folderName
  renameFolderName.value = folderName
  showRenameFolderModal.value = true
}

const confirmRenameFolder = async () => {
  if (renameFolderNameError.value || !renameFolderName.value) return
  
  try {
    renamingFolder.value = true
    
    const response = await fetch(`${API_CONFIG.RENAME_PRODUCT}/${encodeURIComponent(folderToRename.value)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newProductName: renameFolderName.value,
        newFolderName: renameFolderName.value
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      console.log(`产品重命名成功: ${folderToRename.value} -> ${renameFolderName.value}`)
      
      // 重新获取产品列表
      await fetchProducts()
      closeRenameFolderModal()
    } else {
      throw new Error(data.message || t('productManagement_renameFolderFailed'))
    }
  } catch (err) {
    console.error('重命名文件夹错误:', err)
  } finally {
    renamingFolder.value = false
  }
}

const deleteFolder = (folderName) => {
  folderToDelete.value = folderName
  showDeleteConfirm.value = true
}

const confirmDeleteFolder = async () => {
  try {
    console.log(`开始删除产品: ${folderToDelete.value}`)

    const response = await fetch(`${API_CONFIG.DELETE_PRODUCT}/${encodeURIComponent(folderToDelete.value)}`, {
      method: 'DELETE'
    })

    const data = await response.json()

    if (response.ok && data.success) {
      console.log(`产品删除成功: ${folderToDelete.value}`)
      
      // 先关闭确认对话框，再刷新产品列表
      cancelDelete()
      // 重新获取产品列表
      await fetchProducts()

    } else {
      const errorMsg = data.message || data.error || `${t('productManagement_deleteFailedText')}${response.status})`
      console.error(`删除失败:`, errorMsg)
    }
  } catch (err) {
    console.error('删除操作失败:', err)
  }
}

// 导航到指定路径
const navigateToPath = (newPath) => {
  currentPath.value = newPath
  fetchFolderContent()
}

// 打开文件夹，显示其内容
const openFolder = (folderName) => {
  // 在当前页面显示子文件夹内容
  currentPath.value.push(folderName)
  fetchFolderContent()
}

// 获取指定文件夹内容
const fetchFolderContent = async () => {
  try {
    loading.value = true
    error.value = null
    
    const folderPath = currentPath.value.join('/')
    console.log(`获取文件夹内容: ${folderPath}`)
    
    // 调用文件夹详情API
    const response = await fetch(`/api/folder/${folderPath}/details`)
    
    if (!response.ok) {
      throw new Error(`获取文件夹内容失败: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('文件夹内容:', data)
    
    if (data.success) {
      // 转换后端返回的数据格式为前端期望的格式
      const folderData = data.folder
      const content = []
      
      // 添加文件夹
      if (folderData.folders) {
        Object.entries(folderData.folders).forEach(([folderName, folderInfo]) => {
          content.push({
            name: folderName,
            folderName: folderName,
            id: content.length + 1,
            category: 'general',
            description: `Folder: ${folderName}`,
            path: folderInfo.path,
            totalSize: folderInfo.totalSize,
            fileCount: folderInfo.fileCount,
            modified: new Date(),
            isDirectory: true
          })
        })
      }
      
      // 添加文件
      if (folderData.files) {
        folderData.files.forEach((file, index) => {
          content.push({
            name: file.name,
            folderName: file.name,
            id: content.length + 1,
            category: 'file',
            description: `File: ${file.name}`,
            path: file.path,
            totalSize: file.size,
            fileCount: 1,
            modified: file.modified,
            isDirectory: false
          })
        })
      }
      
      products.value = content
      console.log(`成功加载 ${content.length} 个项目`)
    } else {
      throw new Error(data.message || '获取文件夹内容失败')
    }
  } catch (err) {
    console.error('获取文件夹内容失败:', err)
    error.value = err.message
    products.value = []
  } finally {
    loading.value = false
  }
}

const handleShowContextMenu = (event, product) => {
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuProduct.value = product
  showContextMenu.value = true
}

const hideContextMenu = () => {
  showContextMenu.value = false
  contextMenuProduct.value = null
}

const closeCreateFolderModal = () => {
  showCreateFolderModal.value = false
  newFolderName.value = ''
  folderNameError.value = ''
  creatingFolder.value = false
  isValidatingName.value = false
  
  // 清除验证超时
  if (nameValidationTimeout.value) {
    clearTimeout(nameValidationTimeout.value)
    nameValidationTimeout.value = null
  }
}

// 打开创建文件夹模态框时自动聚焦
const showCreateFolderModalEnhanced = (event) => {
  showCreateFolderModal.value = true
  
  // 延迟聚焦以确保DOM已更新
  setTimeout(() => {
    folderNameInput.value?.focus()
  }, 100)
}

const closeRenameFolderModal = () => {
  showRenameFolderModal.value = false
  renameFolderName.value = ''
  renameFolderNameError.value = ''
  folderToRename.value = ''
  renamingFolder.value = false
}

const closeUploadFolderModal = () => {
  showUploadFolderModal.value = false
}

const closeBatchUploadModal = () => {
  showBatchUploadModal.value = false
  selectedFiles.value = []
  currentUploadIndex.value = 0
  selectedZipFiles.value = []
  uploadStatus.value = ''
  uploadProgress.value = 0
  
  // 重置多步骤上传状态
  resetMultiStepUpload()
}

const resetMultiStepUpload = () => {
  currentUploadStep.value = 1
  zipFileValid.value = false
  zipFileValidationChecked.value = false
  zipFileValidationMessage.value = ''
  processedFiles.value = 0
  totalFiles.value = 0
  processedFolders.value = 0
  totalFolders.value = 0
  currentStageText.value = ''
  isDragOver.value = false
}

// 处理ZIP文件选择
const handleZipFileSelected = (files) => {
  selectedZipFiles.value = files
}

// 处理ZIP文件验证
const handleZipFileValidated = (validationResult) => {
  zipFileValid.value = validationResult.valid
  zipFileValidationChecked.value = true
  if (!validationResult.valid) {
    zipFileValidationMessage.value = validationResult.message
  } else {
    zipFileValidationMessage.value = ''
  }
}

// 处理ZIP文件移除
const handleZipFileRemoved = (index) => {
  // 文件移除由ZipUploadZone组件内部处理
  // 这里可以添加额外的清理逻辑
}

// 多步骤导航方法
const nextStep = async () => {
  if (currentUploadStep.value === 1) {
    // 从第一步直接进入第二步（上传进度）
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
  
  // 切换到第二步：上传进度
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
    
    // 创建FormData并模拟上传进度
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
    await fetchProducts()
    
    uploadProgress.value = 100
    uploadStatus.value = t('productManagement_uploadComplete')
    currentStageText.value = t('productManagement_stageComplete')
    
    // 显示成功消息
    setTimeout(() => {
      closeBatchUploadModal()
      // 显示成功通知
      console.log('批量上传成功完成!')
    }, 1500)
    
  } catch (err) {
    console.error('批量压缩包上传错误:', err)
    uploadStatus.value = t('productManagement_uploadFailed') + ': ' + err.message
    currentStageText.value = t('productManagement_stageFailed')
    uploadProgress.value = 0
    
    // 刷新产品列表以显示当前状态
    await fetchProducts()
  } finally {
    uploading.value = false
  }
}

const handleUploadStart = (uploadData) => {
  uploading.value = true
  console.log('上传开始:', uploadData)
}

const handleUploadComplete = (result) => {
  uploading.value = false
  if (result.success) {
    // 上传成功，重新获取产品列表
    fetchProducts()
    closeUploadFolderModal()
  }
  console.log('上传完成:', result)
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  folderToDelete.value = ''
}

const goBack = () => {
  router.push('/')
}

// 生命周期
onMounted(() => {
  fetchProducts()
  
  // 点击页面其他地方隐藏右键菜单
  document.addEventListener('click', hideContextMenu)
})

// 管理员登录成功回调
const handleLoginSuccess = () => {
  // 重新加载产品列表
  fetchProducts()
}
</script>

<style scoped>
.file-manager {
  padding: 20px;
  max-width: 1160px;
  margin: 0 auto;
  background-color: white;
  width: 100%;
}

/* Frame 348 - 页面头部 */
.frame348 {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  align-self: stretch;
  justify-content: space-between;
  border-radius: 12px;
  background: #ffffff;
  padding-top: 20px;
  padding-bottom: 20px;
  width: 100%;
  height: auto;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.frame335 {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  column-gap: 12px;
}

.frame {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  overflow: hidden;
}

.text {
  flex-shrink: 0;
  line-height: 24px;
  letter-spacing: 0;
  color: var(--8C8C8C-12, #202020);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  font-size: 22px;
  font-weight: 700;
}

/* Frame 348 - 刷新按钮 */
.instance {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  column-gap: 4px;
  border: 1px solid var(--8C8C8C-6, #d9d9d9);
  border-radius: 6px;
  background: var(--8C8C8C-1, #fdfdfd);
  padding: 11px 15px;
  height: 32px;
}

.text2 {
  flex-shrink: 0;
  line-height: 15px;
  letter-spacing: 0;
  color: var(--8C8C8C-12, #202020);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  font-size: 14px;
}

/* Frame 347 - 容器 */
.frame347 {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-items: flex-start;
  align-self: stretch;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 20px;
  gap: 20px;
  width: 100%;
  height: auto;
  box-sizing: border-box;
}

/* 页面头部 */
.page-header {
  margin-bottom: 20px;
  padding: 0;
  background: transparent;
  border-radius: 0;
  border: none;
  box-shadow: none;
}

/* 页面标题 */
.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #202020;
  margin: 0;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 24px;
  letter-spacing: 0;
}

/* 返回按钮 */
.back-button {
  color: #202020;
  font-size: 14px;
  padding: 0;
  height: 24px;
  width: 24px;
  min-width: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #f0f0f0;
}

.back-button svg {
  width: 24px;
  height: 24px;
}

/* 刷新按钮 */
.refresh-button {
  background: #fdfdfd;
  border: 1px solid #d9d9d9;
  color: #202020;
  font-size: 14px;
  border-radius: 6px;
  padding: 11px 15px;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 15px;
  letter-spacing: 0;
}

/* Frame 330 - 搜索和操作区域 */
.frame330 {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  align-self: stretch;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
}

/* 输入框 */
.input {
  display: flex;
  flex-grow: 1;
  align-items: center;
  column-gap: 5px;
  border-radius: 6px;
  background: var(--8C8C8C-3, #f0f0f0);
  padding: 6px 10px;
  height: 32px;
  overflow: hidden;
}

.text3 {
  flex-grow: 1;
  line-height: 13px;
  letter-spacing: 0;
  color: var(--8C8C8C-11, #626262);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  font-size: 12px;
}

/* 操作按钮容器 */
.frame331 {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  column-gap: 6px;
}

/* 新建文件夹按钮 */
.instance2 {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  column-gap: 4px;
  border: 1px solid var(--8C8C8C-6, #d9d9d9);
  border-radius: 6px;
  padding: 11px;
  height: 32px;
}

.text4 {
  flex-shrink: 0;
  line-height: 13px;
  letter-spacing: 0;
  color: var(--8C8C8C-12, #202020);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  font-size: 12px;
}

/* 批量上传按钮 */
.instance3 {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  column-gap: 4px;
  border-radius: 6px;
  background: var(--00A0D9-9, #00a0d9);
  padding: 12px;
  height: 32px;
}

.text5 {
  flex-shrink: 0;
  line-height: 13px;
  letter-spacing: 0;
  color: #ffffff;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  font-size: 12px;
}

/* 搜索和操作区域 */
.search-input-container {
  flex: 1;
  display: block;
  height: 32px;
  min-height: 32px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 6px;
}

.create-folder-button {
  background: #ffffff;
  border: 1px solid #d9d9d9;
  color: #202020;
  font-size: 12px;
  border-radius: 6px;
  padding: 11px;
  height: 32px;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 13px;
  letter-spacing: 0;
  min-width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.batch-upload-button {
  background: #00a0d9;
  border: none;
  color: #ffffff;
  font-size: 12px;
  border-radius: 6px;
  padding: 12px;
  height: 32px;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 13px;
  letter-spacing: 0;
  min-width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* Frame 333 - 统计信息 */
.frame333 {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  align-self: stretch;
  justify-content: space-between;
  border-radius: 12px;
  padding: 20px 4px;
  height: 32px;
}

.frame328 {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  column-gap: 6px;
}

.text6 {
  flex-shrink: 0;
  line-height: 13px;
  letter-spacing: 0;
  color: var(--8C8C8C-12, #202020);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  font-size: 12px;
  font-weight: 700;
}

.frame336 {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  column-gap: 6px;
}

.text7 {
  flex-shrink: 0;
  line-height: 13px;
  letter-spacing: 0;
  color: var(--8C8C8C-11, #626262);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  font-size: 12px;
}

.text8 {
  flex-shrink: 0;
  line-height: 13px;
  letter-spacing: 0;
  color: var(--00A0D9-11, #007ab1);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  font-size: 12px;
}

/* 统计信息 */
.stats-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0;
  height: auto;
  background: transparent;
  border-radius: 0;
  width: auto;
  box-sizing: border-box;
  margin-bottom: 0;
}

.stats-right {
  font-size: 12px;
  color: #626262;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 13px;
  letter-spacing: 0;
}

.stats-right .highlight {
  color: #007ab1;
  font-weight: normal;
  line-height: 13px;
  letter-spacing: 0;
}

/* Frame 317 - 上传区域 */
.frame317 {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-items: center;
  align-self: stretch;
  border: 1px dashed var(--8C8C8C-7, #cecece);
  border-radius: 8px;
  padding: 29px;
  row-gap: 10px;
}

/* 上传区域 */
.upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #cecece;
  border-radius: 8px;
  padding: 30px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

.upload-section:hover {
  border-color: #00a0d9;
  background: #f0f9ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-title {
  font-size: 14px;
  color: #202020;
  margin: 0;
  font-family: Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 21px;
  letter-spacing: 0;
}

.upload-hint {
  font-size: 12px;
  color: #626262;
  margin: 0;
  font-family: Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 21px;
  letter-spacing: 0;
}

.upload-content svg {
  width: 42px;
  height: 42px;
}

/* Frame 340 - 文件夹列表 */
.frame340 {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  align-self: stretch;
  justify-content: center;
  padding-right: 1px;
}

/* 文件夹网格 */
.folder-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  width: 100%;
  height: auto;
  min-height: auto;
}

.folder-item {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  height: auto;
  box-sizing: border-box;
  min-height: 80px;
}

.folder-item:hover {
  background: #f5f5f5;
  border-color: #00a0d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 面包屑和统计信息容器 */
.breadcrumb-stats-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 面包屑样式 */
.breadcrumb-section {
  flex: 1;
  margin-bottom: 0;
  width: auto;
}

.frame337 {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0px;
  width: 100%;
  height: auto;
  padding: 8px 0;
  font-size: 12px;
  color: #626262;
}

.breadcrumb-item {
  display:block;
  align-items: center;
  line-height: 18px;
  height: 18px;
  margin-left: 4px;
  gap: 0px;
}

.breadcrumb-link {
  color: inherit;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  line-height: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  text-decoration: none;
  margin-left: 4px;
}

.breadcrumb-link:hover {
  color: #00a0d9;
}

.breadcrumb-separator {
  color: #b3b3b3;
  font-size: 14px;
  font-family: inherit;
  margin: 0;
  line-height: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.frame337 svg {
  height: 18px;
  width: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  color: #00a0d9;
}

.breadcrumb-item:last-child .breadcrumb-link {
  color: #202020;
  font-weight: 700;
}

/* 移除旧的样式 */
.autoWrapper,
.autoWrapper2 {
  display: none !important;
}

/* 文件列表样式 */
.file-list {
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
}

.file-item {
  background: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  border-radius: 0;
  padding: 16px 20px;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: auto;
  min-height: 64px;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.file-item:last-child {

}

.file-item:hover {
  background: #f5f5f5;
}

.file-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.file-name {
  font-size: 14px;
  font-weight: 700;
  color: #202020;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #626262;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
}

.file-actions {
  display: flex;
  gap: 12px;
}

.file-actions button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  height: 20px;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.file-actions button:hover {
  background: #e0e0e0;
}

.file-type {
  font-size: 12px;
  color: #626262;
  margin-left: 4px;
}

/* 文件夹自动包装容器 */
.autoWrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  gap: 12px;
}

.autoWrapper2 {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  gap: 12px;
}

/* 文件夹项 - 精准还原Figma设计稿 */
.folder-item {
  background: #f9f9f9;
  border: 1px solid #d9d9d9;
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  min-height: auto;
  height: auto;
}

.folder-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #00a0d9;
  transform: translateY(-1px);
}

.folder-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.folder-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  color: #00a0d9;
}

.folder-icon svg {
  width: 28px;
  height: 28px;
}

.folder-text-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.folder-info {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.folder-name {
  font-size: 14px;
  font-weight: 700;
  color: #202020;
  margin: 0;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 1.1;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  max-width: 100%;
}

.folder-size {
  font-size: 12px;
  color: #626262;
  margin: 0;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 1.1;
  letter-spacing: 0;
}

/* 状态样式 */
.loading-spin {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.spinner {
  font-size: 16px;
  color: #00a0d9;
}

.error-state {
  padding: 60px 20px;
  text-align: center;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.error-content h3 {
  margin-bottom: 8px;
  color: #262626;
}

.error-content p {
  margin-bottom: 16px;
  color: #8c8c8c;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-content p {
  color: #8c8c8c;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-manager {
    padding: 16px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .search-and-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input-container {
    max-width: none;
  }
  
  .action-buttons {
    justify-content: space-between;
  }
  
  .folder-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
  }
  
  .folder-item {
    padding: 12px 15px;
    height: auto;
  }
}

@media (max-width: 576px) {
  .page-title {
    font-size: 18px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .action-buttons button {
    width: 100%;
    justify-content: center;
  }
  
  .folder-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #1a1a1a;
  transition: background-color 0.2s ease;
}

.context-menu-item:hover {
  background: #f0f2f5;
}

/* 传统表单样式兼容性 */
.form-content .form-item {
  margin-bottom: 16px;
}

.form-content .form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #262626;
}

/* 传统表单样式兼容性 */
.form-content .form-item {
  margin-bottom: 16px;
}

.form-content .form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #262626;
}

.error-text {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}

/* 批量上传样式 */
.batch-upload-content {
  margin: 16px 0;
}

.upload-section {
  padding: 20px;
}

.upload-info {
  margin-bottom: 16px;
}

.upload-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #262626;
  display: flex;
  align-items: center;
}

.upload-description {
  color: #8c8c8c;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.4;
}

.warning-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  margin-bottom: 20px;
  color: #d46b08;
  font-size: 13px;
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

.upload-button {
  background: #00a0d9 !important;
  border: none !important;
  color: white !important;
}

.upload-button:hover {
  background: #007ab1 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 160, 217, 0.3) !important;
}

.upload-button:disabled {
  background: #d9d9d9 !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 多步骤批量上传样式 */

/* 步骤指示器 */
.step-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
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
  background: #dee2e6;
  z-index: 1;
}

.step-item.step-completed:not(:last-child)::after {
  background: #00a0d9;
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
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  color: #6c757d;
  transition: all 0.3s ease;
}

.step-item.step-active .step-number {
  background: #00a0d9;
  border-color: #00a0d9;
  color: white;
  box-shadow: 0 0 0 4px rgba(0, 160, 217, 0.2);
}

.step-item.step-completed .step-number {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.step-title {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 4px;
  color: #495057;
}

.step-item.step-active .step-title {
  color: #00a0d9;
}

.step-description {
  font-size: 11px;
  text-align: center;
  color: #6c757d;
  line-height: 1.3;
}

/* 预览区域 */
.preview-section {
  margin: 16px 0;
}

.preview-header {
  text-align: center;
  margin-bottom: 20px;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-description {
  color: #8c8c8c;
  font-size: 14px;
  line-height: 1.4;
}

/* 文件结构 */
.file-structure {
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
}

.structure-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #00a0d9;
}

.structure-tree {
  max-height: 300px;
  overflow-y: auto;
}

.folder-preview {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
}

.folder-name {
  flex: 1;
  color: #262626;
}

.folder-count {
  font-size: 12px;
  color: #8c8c8c;
}

.folder-files {
  padding-left: 20px;
}

.folder-files .file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
  color: #595959;
}

.folder-files .file-name {
  flex: 1;
}

.folder-files .file-size {
  font-family: monospace;
  color: #8c8c8c;
}

.more-files {
  padding: 8px 0;
  font-size: 12px;
  color: #8c8c8c;
  font-style: italic;
}

.preview-loading {
  text-align: center;
  padding: 40px 20px;
  color: #8c8c8c;
}

.loading-spinner {
  margin-bottom: 16px;
}

/* 文件验证状态 */
.validation-status {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.validation-success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #389e0d;
}

.validation-error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #cf1322;
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

/* 警告区域 */
.warning-section {
  margin: 16px 0;
}

.warning-header {
  text-align: center;
  margin-bottom: 20px;
}

.warning-title {
  font-size: 18px;
  font-weight: 600;
  color: #ff4d4f;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-description {
  color: #8c8c8c;
  font-size: 14px;
  line-height: 1.4;
}

.warning-content {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 20px;
}

.warning-list {
  margin-bottom: 20px;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px 0;
  font-size: 14px;
  color: #8c8c8c;
}

.warning-item:last-child {
  margin-bottom: 0;
}

/* 确认输入 */
.confirmation-input {
  margin-bottom: 20px;
}

.confirmation-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #262626;
  font-size: 14px;
}

/* 风险评估 */
.risk-assessment h5 {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
}

.risk-level {
  border: 1px solid;
  border-radius: 6px;
  padding: 12px;
  background: white;
}

.risk-level.risk-high {
  border-color: #ffccc7;
  background: #fff7f7;
}

.risk-level.risk-medium {
  border-color: #ffe58f;
  background: #fffbe6;
}

.risk-level.risk-low {
  border-color: #b7eb8f;
  background: #f6ffed;
}

.risk-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.risk-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.risk-level.risk-high .risk-dot {
  background: #ff4d4f;
}

.risk-level.risk-medium .risk-dot {
  background: #faad14;
}

.risk-level.risk-low .risk-dot {
  background: #52c41a;
}

.risk-label {
  font-weight: 600;
  font-size: 13px;
}

.risk-level.risk-high .risk-label {
  color: #ff4d4f;
}

.risk-level.risk-medium .risk-label {
  color: #faad14;
}

.risk-level.risk-low .risk-label {
  color: #52c41a;
}

.risk-description {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.4;
  margin: 0;
}

/* 进度区域 */
.progress-section {
  margin: 16px 0;
}

.progress-header {
  text-align: center;
  margin-bottom: 20px;
}

.progress-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-progress {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  padding: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-status {
  font-weight: 600;
  color: #389e0d;
  font-size: 14px;
}

.progress-percentage {
  font-weight: 600;
  color: #52c41a;
  font-size: 16px;
}

.progress-details {
  background: white;
  border-radius: 6px;
  padding: 16px;
  border: 1px solid #d9d9d9;
}

.progress-stage {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.stage-label {
  font-size: 13px;
  color: #8c8c8c;
}

.stage-value {
  font-weight: 600;
  color: #00a0d9;
  font-size: 13px;
}

.progress-stats {
  display: flex;
  gap: 20px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.stat-label {
  color: #8c8c8c;
}

.stat-value {
  font-weight: 600;
  color: #00a0d9;
}

/* 导航按钮 */
.next-step-button,
.prev-step-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

.danger.upload-button {
  background: #ff4d4f !important;
  border: none !important;
  color: white !important;
}

.danger.upload-button:hover {
  background: #ff3333 !important;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3) !important;
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .step-indicator {
    flex-direction: column;
    gap: 16px;
  }
  
  .step-item:not(:last-child)::after {
    display: none;
  }
  
  .structure-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .progress-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .warning-content {
    padding: 16px;
  }

  /* 移除不需要的响应式样式 */
}
</style>