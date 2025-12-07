<template>
  <!-- 管理员内容 -->
  <div v-if="isAdminLoggedIn" class="file-manager">
    <!-- 页面头部 -->
    <div class="page-header">
      <!-- Frame 348 -->
      <div class="frame348">
        <div class="frame335">
          <Button @click="goBack" variant="no" size="icon40">
            <LucideIcon name="ChevronLeft" />
          </Button>
          <h1 class="page-title">{{ t('productManagement_title') }}</h1>
        </div>
        <Button @click="refreshProducts" :loading="loading" variant="line" size="40">
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
            <Button @click="showCreateFolderModalEnhanced" variant="line" size="32">
              <LucideIcon name="FolderPlus" class="h-4 w-4" />
              {{ t('productManagement_createFolder') }}
            </Button>
            <Button @click="showBatchUploadModal = true" variant="fill" size="32">
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
        <div class="upload-section-container">
          <!-- 上传文件夹 -->
          <div class="upload-section" @click="showUploadFolderModal = true">
            <div class="upload-content">
              <LucideIcon name="Folder" />
              <p class="upload-title">{{ t('productManagement_uploadFolder') }}</p>
              <p class="upload-hint">{{ t('productManagement_uploadFolderHint') }}</p>
            </div>
          </div>
          
          <!-- 上传文件 -->
          <div class="upload-section" @click="showUploadFileModal = true">
            <div class="upload-content">
              <LucideIcon name="FileUp" />
              <p class="upload-title">{{ t('productManagement_uploadFiles') }}</p>
              <p class="upload-hint">{{ t('productManagement_uploadFilesHint') }}</p>
            </div>
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
                <Button variant="ghost" size="sm" :title="t('productManagement_view')">
                  <LucideIcon name="Eye" class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" :title="t('productManagement_download')">
                  <LucideIcon name="Download" class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" :title="t('productManagement_delete')">
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

        <!-- 创建文件夹使用说明 -->
        <Functionaldescription
          :displayTitle="t('common_usageInstructions')"
          iconName="AlertCircle"
          :instructions="[
            { icon: 'FileText', text: t('productManagement_folderNameHelp') },
            { icon: 'AlertCircle', text: t('productManagement_folderNameTooShort') },
            { icon: 'AlertCircle', text: t('productManagement_folderNameTooLong') },
            { icon: 'AlertCircle', text: t('productManagement_folderNameNoLeadingTrailingSpaces') },
            { icon: 'AlertCircle', text: t('productManagement_folderNameContainsInvalidSequence') }
          ]"
        />



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
      <div class="file-upload-section">
        <ProductFolderUploader
          ref="folderUploaderRef"
          :disabled="uploading"
          @upload-start="handleUploadStart"
          @upload-complete="handleUploadComplete"
        />
      </div>
      <template #footer>
        <Button @click="closeUploadFolderModal" variant="line" size="40">
          {{ t('common_cancel') }}
        </Button>
        <Button
          @click="handleFolderUploadConfirm"
          variant="fill" size="40"
          :loading="uploading"
        >
          <LucideIcon name="Upload" class="h-4 w-4" />
          {{ t('common_startUpload') }}
        </Button>
      </template>
    </Modal>
    
    <!-- 上传文件模态框 -->
    <Modal
      :open="showUploadFileModal"
      :title="t('productManagement_uploadFiles')"
      width="lg:max-w-2xl"
      @close="closeUploadFileModal"
    >
      <!-- 文件上传区域 -->
      <div class="file-upload-section">
        <div class="file-upload-area" @click="triggerFileInput">
          <input
            ref="fileInput"
            type="file"
            multiple
            @change="handleFileSelect"
            class="file-input"
          />
          <div class="upload-content">
            <LucideIcon name="FileUp" />
            <p class="upload-title">{{ t('common_uploadFiles') }}</p>
            <p class="upload-hint">{{ t('common_clickOrDragFiles') }}</p>
          </div>
        </div>

        <!-- 已选择文件列表 -->
        <div v-if="selectedFiles.length > 0" class="selected-files-section">
          <div class="section-header">
            <h4>{{ t('common_selectedFiles') }} ({{ selectedFiles.length }})</h4>
            <Button
              @click="clearSelectedFiles"
              variant="ghost"
              size="sm"
              :disabled="uploading"
              :title="t('common_clearAll')"
            >
              <LucideIcon name="Trash2" class="h-4 w-4 mr-1" />
              {{ t('common_clearAll') }}
            </Button>
          </div>
          
          <!-- 文件列表 -->
          <div class="files-list">
            <div
              v-for="(file, index) in selectedFiles"
              :key="`${file.name}-${file.size}-${index}`"
              class="upload-file-item"
              :class="{ 'file-uploading': uploading }"
            >
              <!-- 文件图标 -->
              <div class="file-icon">
                <LucideIcon :name="getFileIcon(file.name)" class="h-5 w-5" />
              </div>
              
              <!-- 文件信息 -->
              <div class="upload-file-info">
                <div class="file-name-row">
                  <span class="upload-file-name" :title="file.name">{{ file.name }}</span>
                  <span v-if="uploading" class="upload-status">
                    <LucideIcon name="Upload" class="h-3 w-3 mr-1" />
                    {{ t('common_uploading') }}
                  </span>
                </div>
                <div class="file-meta-row">
                  <span class="upload-file-size">{{ formatFileSize(file.size) }}</span>
                  <span class="file-type">{{ getFileType(file.name) }}</span>
                  <span class="file-date">{{ new Date().toLocaleDateString() }}</span>
                </div>
              </div>
              
              <!-- 文件状态和操作 -->
              <div class="upload-file-actions">
                <!-- 文件验证状态 -->
                <div v-if="!uploading" class="file-status">
                  <LucideIcon name="CheckCircle" class="h-4 w-4 text-green-500" />
                </div>
                
                <!-- 删除按钮 -->
                <Button
                  @click="removeFile(index)"
                  variant="ghost"
                  size="sm"
                  :disabled="uploading"
                  :title="t('common_removeFile')"
                  class="remove-btn"
                >
                  <LucideIcon name="X" class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- 上传文件使用说明 -->
        <Functionaldescription
          :displayTitle="t('common_usageInstructions')"
          iconName="AlertCircle"
          :instructions="[
            { icon: 'FileText', text: t('common_supportedFileTypes') },
            { icon: 'AlertCircle', text: t('common_maxFileSize') },
            { icon: 'Upload', text: t('common_multiFileUpload') },
            { icon: 'Folder', text: t('common_uploadToCurrentFolder') }
          ]"
        />

      </div>
      <template #footer>
        <Button @click="closeUploadFileModal" variant="line" size="40"  :disabled="uploading">
          {{ t('common_cancel') }}
        </Button>
        <Button @click="handleFileUploadConfirm" variant="fill" size="40" :loading="uploading" :disabled="selectedFiles.length === 0">
          <LucideIcon name="Upload" class="h-4 w-4" />
          {{ t('common_startUpload') }}
        </Button>
      </template>
    </Modal>

    <!-- 批量上传模态框 -->
    <BatchUploadModal
      :open="showBatchUploadModal"
      @close="closeBatchUploadModal"
      @upload-complete="handleBatchUploadComplete"
    />

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

  <!-- 登录模态框 -->
  <AdminLoginModal
    v-model:open="showLoginModal"
    @login-success="handleLoginSuccess"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import AdminLoginModal from './AdminLoginModal.vue'
import Button from './ui/button.vue'
import Input from './ui/input.vue'
import Modal from './ui/modal.vue'
import LucideIcon from './ui/LucideIcon.vue'
import SearchInput from './ui/search-input.vue'
import ProductFolderUploader from './ProductFolderUploader.vue'
import BatchUploadModal from './BatchUploadModal.vue'
import Functionaldescription from './Functionaldescription.vue'



const { t } = useI18n()
const router = useRouter()
const { isAdminLoggedIn } = useAdminAuth()

// 响应式数据
const products = ref([])
const showLoginModal = ref(!isAdminLoggedIn.value)
const currentPath = ref(['Product'])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const showCreateFolderModal = ref(false)
const showRenameFolderModal = ref(false)
const showUploadFolderModal = ref(false)
const showUploadFileModal = ref(false)
const showBatchUploadModal = ref(false)
const showDeleteConfirm = ref(false)
const creatingFolder = ref(false)
const renamingFolder = ref(false)
const uploading = ref(false)
const fileUploaderRef = ref(null)
const folderUploaderRef = ref(null)
const fileInput = ref(null)
const selectedFiles = ref([])
const newFolderName = ref('')
const renameFolderName = ref('')
const folderToDelete = ref('')
const folderToRename = ref('')
const folderNameError = ref('')
const renameFolderNameError = ref('')
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuProduct = ref(null)

const folderNameInput = ref(null)

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
  if (!newFolderName.value || newFolderName.value.trim() === '') {
    folderNameError.value = ''
    return
  }
  
  const name = newFolderName.value.trim()
  
  // 基本格式验证
  if (name.length < 2) {
    folderNameError.value = t('productManagement_folderNameTooShort')
    return
  }
  
  if (name.length > 50) {
    folderNameError.value = t('productManagement_folderNameTooLong')
    return
  }
  
  const invalidChars = /[<>:/\\|?*\x00-\x1F]/
  if (invalidChars.test(name)) {
    folderNameError.value = t('productManagement_folderNameContainsInvalid')
    return
  }
  
  // 检查是否以空格开头或结尾
  if (newFolderName.value !== name) {
    folderNameError.value = t('productManagement_folderNameNoLeadingTrailingSpaces')
    return
  }
  
  // 检查重复名称（客户端验证）
  if (products.value.some(p => p.name === name)) {
    folderNameError.value = t('productManagement_folderNameExists')
    return
  }
  
  // 特殊字符检查
  if (name.includes('..') || name.includes('//') || name.includes('\\\\')) {
    folderNameError.value = t('productManagement_folderNameContainsInvalidSequence')
    return
  }
  
  folderNameError.value = ''
}

// 键盘事件处理
const handleKeyDown = (event) => {
  // Enter键创建文件夹，Escape键关闭弹窗
  if (event.key === 'Enter') {
    event.preventDefault()
    if (newFolderName.value && !folderNameError.value && !creatingFolder.value) {
      createFolder()
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closeCreateFolderModal()
  }
}

// 清理后的函数
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

const closeUploadFileModal = () => {
  showUploadFileModal.value = false
  selectedFiles.value = []
}

const closeBatchUploadModal = () => {
  showBatchUploadModal.value = false
}

const handleBatchUploadComplete = async (result) => {
  if (result.success) {
    // 刷新产品列表
    await fetchProducts()
    console.log('批量上传成功完成!')
  } else {
    console.error('批量上传失败:', result.error)
    // 刷新产品列表以显示当前状态
    await fetchProducts()
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
    closeUploadFileModal()
  }
  console.log('上传完成:', result)
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    // 验证文件
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
    }
    
    // 显示无效文件信息
    if (invalidFiles.length > 0) {
      showMessage('warning', `${invalidFiles.length} 个文件大小超过限制（100MB）`)
    }
  }
}

// 移除文件
const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

// 清空所有文件
const clearSelectedFiles = () => {
  selectedFiles.value = []
}

// 处理文件上传确认
const handleFileUploadConfirm = () => {
  if (selectedFiles.value.length === 0) return
  handleFileUpload()
}

// 处理文件夹上传确认
const handleFolderUploadConfirm = () => {
  // 调用上传组件的开始上传方法
  folderUploaderRef.value?.startUpload()
}

// 文件上传
const handleFileUpload = async () => {
  if (selectedFiles.value.length === 0) return
  
  uploading.value = true
  try {
    let successCount = 0
    let failCount = 0
    
    // 逐个上传文件
    for (const file of selectedFiles.value) {
      try {
        await uploadSingleFile(file)
        successCount++
        console.log('文件上传成功:', file.name)
      } catch (error) {
        failCount++
        console.error('文件上传失败:', file.name, error)
      }
    }
    
    if (successCount > 0) {
      // 重新获取产品列表
      await fetchProducts()
      closeUploadFileModal()
      console.log(`上传完成: ${successCount} 个成功, ${failCount} 个失败`)
    }
    
  } catch (error) {
    console.error('文件上传失败:', error)
    showMessage('error', '文件上传失败: ' + error.message)
  } finally {
    uploading.value = false
  }
}

// 单个文件上传
const uploadSingleFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folderPath', currentPath.value.join('/'))
  
  const response = await fetch('/api/upload-files', {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `上传失败: ${response.status}`)
  }
  
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '上传失败')
  }
  
  return result
}

// 获取文件图标
const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const iconMap = {
    'jpg': 'Image',
    'jpeg': 'Image',
    'png': 'Image',
    'gif': 'Image',
    'svg': 'Image',
    'webp': 'Image',
    'pdf': 'FileText',
    'doc': 'FileText',
    'docx': 'FileText',
    'txt': 'FileText',
    'zip': 'Archive',
    'rar': 'Archive',
    '7z': 'Archive',
    'mp4': 'Video',
    'avi': 'Video',
    'mov': 'Video',
    'mp3': 'Music',
    'wav': 'Music',
    'xls': 'Sheet',
    'xlsx': 'Sheet',
    'ppt': 'Presentation',
    'pptx': 'Presentation'
  }
  return iconMap[extension] || 'File'
}

// 获取文件类型描述
const getFileType = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const typeMap = {
    'jpg': 'JPEG图像',
    'jpeg': 'JPEG图像',
    'png': 'PNG图像',
    'gif': 'GIF图像',
    'svg': '矢量图像',
    'webp': 'WebP图像',
    'pdf': 'PDF文档',
    'doc': 'Word文档',
    'docx': 'Word文档',
    'txt': '文本文件',
    'zip': 'ZIP压缩包',
    'rar': 'RAR压缩包',
    '7z': '7Z压缩包',
    'mp4': 'MP4视频',
    'avi': 'AVI视频',
    'mp3': 'MP3音频',
    'xls': 'Excel表格',
    'xlsx': 'Excel表格',
    'ppt': 'PowerPoint',
    'pptx': 'PowerPoint'
  }
  return typeMap[extension] || '文件'
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

/* Frame 347 - 容器 */
.frame347 {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-items: flex-start;
  align-self: stretch;
  border: 1px solid var(--neutral-4);
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




/* Frame 330 - 搜索和操作区域 */
.frame330 {
  display: grid;
  grid-template-columns: 2fr max-content;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 6px;
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
  color: var(--neutral-11);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 13px;
  letter-spacing: 0;
}

.stats-right .highlight {
  color: var(--primary-11);
  font-weight: normal;
  line-height: 13px;
  letter-spacing: 0;
}

/* 上传区域容器 */
.upload-section-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
}

/* 弹窗内的文件上传区域 */
.file-upload-section {
  margin: 16px 0;
}

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

/* 已选择文件列表 */
.selected-files-section {
  background: var(--neutral-2);
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-12);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 1.1;
}

/* 文件列表容器 */
.files-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 -4px;
  padding: 0 4px;
}

/* 自定义滚动条 */
.files-list::-webkit-scrollbar {
  width: 6px;
}

.files-list::-webkit-scrollbar-track {
  background: var(--neutral-3);
  border-radius: 3px;
}

.files-list::-webkit-scrollbar-thumb {
  background: var(--neutral-6);
  border-radius: 3px;
}

.files-list::-webkit-scrollbar-thumb:hover {
  background: var(--neutral-8);
}

/* 文件项 */
.upload-file-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: var(--neutral-opacity-3);
  border-radius: 12px;
  height: auto;
  min-height: 55px;
  gap: 16px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.upload-file-item:hover {
  background: var(--primary-3);
  border-color: var(--primary-opacity-5);
}

.upload-file-item.file-uploading {
  opacity: 0.7;
  pointer-events: none;
}

/* 文件图标 */
.file-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-9);
}

/* 文件信息 */
.upload-file-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.file-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.upload-file-name {
  font-size: 14px;
  font-weight: 400;
  color: var(--neutral-12);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.upload-status {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--primary-9);
  font-weight: 500;
}

.file-meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--neutral-11);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 1.1;
}

.upload-file-size {
  white-space: nowrap;
}

.file-type {
  color: var(--primary-9);
  font-weight: 500;
}

.file-date {
  color: var(--neutral-10);
}

/* 文件操作区域 */
.upload-file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.file-status {
  display: flex;
  align-items: center;
}

.remove-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: var(--neutral-10);
}

.remove-btn:hover {
  background: var(--red-3);
  color: var(--red-9);
  transform: scale(1.05);
}

.remove-btn svg {
  width: 14px;
  height: 14px;
}



/* 上传区域 */
.upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--neutral-7);
  border-radius: 8px;
  padding: 30px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

.upload-section:hover {
  border-color: var(--primary-9);
  background: var(--primary-3);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-title {
  font-size: 14px;
  color: var(--neutral-12);
  margin: 0;
  font-family: Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 21px;
  letter-spacing: 0;
  text-align: center;
}

.upload-hint {
  font-size: 12px;
  color: var(--neutral-11);
  margin: 0;
  font-family: Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 21px;
  letter-spacing: 0;
  text-align: center;
}

.upload-content svg {
  width: 42px;
  height: 42px;
  color: var(--primary-9);
}

.file-input {
  display: none;
}



/* 文件夹网格 */
.folder-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  width: 100%;
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
  color: var(--neutral-11);
}

.breadcrumb-item {
  display: flex;
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
  color: var(--primary-9);
}

.breadcrumb-separator {
  color: var(--neutral-8);
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
  color: var(--neutral-12);
}

.breadcrumb-item:last-child .breadcrumb-link {
  color: var(--neutral-12);
  font-weight: 700;
}

/* 文件列表样式 - 参考Figma设计 */
.file-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  background: var(--neutral-2);
  border-radius: 12px;
  padding: 20px;
  height: 55px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: var(--neutral-3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  font-weight: 400;
  color: var(--neutral-12);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: var(--neutral-11);
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 1.1;
  white-space: nowrap;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.file-actions button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  height: 14px;
  width: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: var(--neutral-12);
}

.file-actions button:hover {
  background: var(--neutral-4);
  transform: translateY(-1px);
}

.file-actions button svg {
  width: 14px;
  height: 14px;
}

/* 文件夹项 - 精准还原Figma设计稿 */
.folder-item {
  background: var(--neutral-2);
  border: 1px solid var(--neutral-6);
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
  border-color: var(--primary-9);
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
  color: var(--primary-9);
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
  color: var(--neutral-12);
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
  color: var(--neutral-11);
  margin: 0;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 1.1;
  letter-spacing: 0;
}



/* 右键菜单 */
.context-menu {
  position: fixed;
  background: var(--neutral-1);
  border: 1px solid var(--neutral-3);
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
  color: var(--neutral-12);
  transition: background-color 0.2s ease;
}

.context-menu-item:hover {
  background: var(--neutral-3);
}

/* 传统表单样式兼容性 */
.form-content .form-item {
  margin-bottom: 16px;
}

.form-content .form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--neutral-12);
}

.error-text {
  color: var(--red-9);
  font-size: 12px;
  margin-top: 4px;
}

.danger {
  background: var(--red-9) !important;
  border: none !important;
  color: white !important;
}

.danger:hover {
  background: var(--red-11) !important;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-manager {
    padding: 16px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  /* Frame 330 - 搜索和操作区域 */
  .frame330 {
    grid-template-columns: repeat(1, 1fr);
    gap: 20px;
  }

  .search-input-container {
    max-width: none;
  }
  
  .action-buttons {
    justify-content: space-between;
  }

  .action-buttons button {
    width: 100%;
    justify-content: center;
  }
  
  .folder-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
  }
  
  .folder-item {
    padding: 12px 15px;
    height: auto;
  }

  .upload-section-container {
    grid-template-columns: repeat(1, 1fr);
    gap: 10px;
  }
}

@media (max-width: 576px) {

  
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
</style>