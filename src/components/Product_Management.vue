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
      <div class="page-title-section">
        <h1 class="page-title">{{ t('productManagement_title') }}</h1>
        
        <div class="action-buttons">
          <Button @click="goBack" variant="text" class="back-button">
            <span class="icon">←</span>
            {{ t('productManagement_back') }}
          </Button>
          <Button @click="refreshProducts" :loading="loading" variant="secondary" class="refresh-button">
            <LucideIcon name="RefreshCw" class="h-4 w-4" />
            {{ t('productManagement_refresh') }}
          </Button>
          <Button @click="showCreateFolderModal = true" variant="primary" class="create-folder-button">
            <LucideIcon name="FolderPlus" class="h-4 w-4" />
            {{ t('productManagement_createFolder') }}
          </Button>
          <Button @click="showUploadFolderModal = true" variant="primary" class="upload-folder-button">
            <LucideIcon name="Upload" class="h-4 w-4" />
            {{ t('productManagement_uploadFolder') }}
          </Button>
          <Button @click="showBatchUploadModal = true" variant="primary" class="batch-upload-button">
            <LucideIcon name="Upload" class="h-4 w-4" />
            {{ t('productManagement_batchUpload') }}
          </Button>
        </div>
      </div>
      
      <div class="search-section">
        <div class="search-input-container">
          <Input
            v-model="searchQuery"
            :placeholder="t('productManagement_searchPlaceholder')"
            class="search-input"
          />
          <span class="search-icon">
            <LucideIcon name="Search" class="h-4 w-4" />
          </span>
        </div>
        <div class="folder-count">
          {{ t('productManagement_totalProductFolders') }} {{ filteredProducts.length }} {{ t('productManagement_productFolders') }}
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-spin">
        <div class="spinner">加载中...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <h3>{{ t('productManagement_loading') }}</h3>
          <p>{{ error }}</p>
          <Button @click="fetchProducts" variant="primary">
            {{ t('productManagement_retry') }}
          </Button>
        </div>
      </div>

      <!-- 产品文件夹列表 -->
      <div v-else class="folder-grid">
        <div
          v-for="product in filteredProducts"
          :key="product.name"
          class="folder-item"
          @click="openFolder(product.name)"
          @contextmenu.prevent="handleShowContextMenu($event, product)"
        >
          <div class="folder-icon">
            <LucideIcon name="Folder" class="h-8 w-8 text-primary" />
          </div>
          <div class="folder-info">
            <div class="folder-name">{{ product.name }}</div>
            <div class="folder-stats">
              <span>{{ t('productManagement_folderSize') }} {{ formatFileSize(product.totalSize || 0) }}</span>
            </div>
          </div>
          <div class="folder-actions">
            <Button
              variant="text"
              size="small"
              @click.stop="renameFolder(product.name)"
              :title="t('productManagement_rename')"
            >
              <LucideIcon name="Edit" class="h-4 w-4" />
            </Button>
            <Button
              variant="text"
              size="small"
              @click.stop="deleteFolder(product.name)"
              :title="t('productManagement_delete')"
              class="danger"
            >
              <LucideIcon name="Trash2" class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && !error && filteredProducts.length === 0" class="empty-state">
        <div class="empty-content">
          <LucideIcon name="FolderOpen" class="h-16 w-16 text-muted-foreground" />
          <p>{{ t('productManagement_noProductFolders') }}</p>
          <Button @click="showCreateFolderModal = true" variant="primary">
            {{ t('productManagement_createFirstFolder') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 创建文件夹模态框 -->
    <Modal
      :open="showCreateFolderModal"
      :title="t('productManagement_createProductFolder')"
      width="sm:max-w-md"
      @close="closeCreateFolderModal"
    >
      <div class="form-content">
        <div class="form-item">
          <label>{{ t('productManagement_folderName') }}</label>
          <Input
            v-model="newFolderName"
            :placeholder="t('productManagement_inputFolderName')"
            @input="validateFolderName"
          />
          <div v-if="folderNameError" class="error-text">{{ folderNameError }}</div>
        </div>
      </div>
      
      <template #footer>
        <Button @click="closeCreateFolderModal">
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
      width="lg:max-w-2xl"
      @close="closeBatchUploadModal"
    >
      <div class="batch-upload-content">
        <div class="upload-section">
          <div class="upload-info">
            <h4 class="upload-title">
              <LucideIcon name="Archive" class="h-5 w-5 text-primary mr-2" />
              {{ t('productManagement_batchUploadZipFiles') }}
            </h4>
            <p class="upload-description">{{ t('productManagement_batchUploadZipDescription') }}</p>
          </div>
          
          <!-- 警告提示 -->
          <div class="warning-section">
            <LucideIcon name="AlertTriangle" class="h-4 w-4 text-orange-500" />
            <span>{{ t('productManagement_batchUploadWarning') }}</span>
          </div>
          
          <!-- 压缩包选择器 -->
          <div class="file-selector">
            <input
              ref="zipFileInput"
              type="file"
              accept=".zip,.rar,.7z"
              @change="handleZipFileSelection"
              style="display: none;"
            />
            <Button
              @click="selectZipFiles"
              variant="primary"
              class="select-files-button"
              :disabled="uploading"
            >
              <LucideIcon name="Archive" class="h-4 w-4" />
              {{ t('productManagement_selectZipFiles') }}
            </Button>
            <span class="file-hint">{{ t('productManagement_zipFileHint') }}</span>
          </div>

          <!-- 已选择的压缩包 -->
          <div v-if="selectedZipFiles.length > 0" class="selected-files">
            <h5>{{ t('productManagement_selectedZipFiles') }} ({{ selectedZipFiles.length }})</h5>
            <div class="files-list">
              <div v-for="(file, index) in selectedZipFiles" :key="index" class="file-item">
                <LucideIcon name="Archive" class="h-4 w-4 text-primary" />
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">({{ formatFileSize(file.size) }})</span>
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
          </div>

          <!-- 上传进度 -->
          <div v-if="uploading" class="upload-progress">
            <div class="progress-info">
              <span>{{ uploadStatus }}</span>
              <span>{{ Math.round(uploadProgress) }}%</span>
            </div>
            <Progress :value="uploadProgress" />
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button @click="closeBatchUploadModal" :disabled="uploading">
          {{ t('productManagement_cancel') }}
        </Button>
        <Button
          @click="startBatchZipUpload"
          variant="primary"
          :disabled="selectedZipFiles.length === 0 || uploading"
          :loading="uploading"
          class="upload-button"
        >
          <LucideIcon name="Upload" class="h-4 w-4" />
          {{ t('productManagement_extractAndUpload') }}
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
      <div class="context-menu-item" @click="openFolder(contextMenuProduct.name)">
        <LucideIcon name="FolderOpen" class="h-4 w-4" />
        <span>{{ t('productManagement_open') }}</span>
      </div>
      <div class="context-menu-item" @click="renameFolder(contextMenuProduct.name)">
        <LucideIcon name="Edit" class="h-4 w-4" />
        <span>{{ t('productManagement_rename') }}</span>
      </div>
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
import ProductFolderUploader from './ProductFolderUploader.vue'

const { t } = useI18n()
const router = useRouter()
const { isAdminLoggedIn } = useAdminAuth()

// 响应式数据
const products = ref([])
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
const uploadStatus = ref('')
const uploadProgress = ref(0)

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
    loading.value = true
    error.value = null

    console.log('开始从API获取产品列表...')
    
    const response = await fetch(API_CONFIG.GET_PRODUCTS)
    console.log('API响应状态:', response.status)
    
    if (!response.ok) {
      throw new Error(`获取产品列表失败: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('产品数据:', data)
    
    if (Array.isArray(data)) {
      const processedProducts = data.map((product, index) => ({
        name: product.folderName || product.name,
        fileCount: product.fileCount || 0,
        totalSize: product.totalSize || 0,
        id: product.id || index + 1,
        category: product.category || 'general',
        description: product.description || `Product folder: ${product.folderName || product.name}`,
        path: product.path || `Product/${product.folderName || product.name}`
      }))
      
      products.value = processedProducts.filter(product => product.name && product.name.trim() !== '')
      console.log(`成功加载 ${products.value.length} 个产品`)
    } else {
      throw new Error('产品数据格式错误')
    }
    
  } catch (err) {
    console.error('获取产品列表失败:', err)
    error.value = err.message
    products.value = []
  } finally {
    loading.value = false
  }
}

const refreshProducts = async () => {
  try {
    await fetchProducts()
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
  if (!newFolderName.value) {
    folderNameError.value = ''
    return
  }
  
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/
  if (invalidChars.test(newFolderName.value)) {
    folderNameError.value = t('productManagement_folderNameContainsInvalid')
    return
  }
  
  // 检查文件夹名称是否已存在
  if (products.value.some(p => p.name === newFolderName.value)) {
    folderNameError.value = t('productManagement_folderNameExists')
    return
  }
  
  folderNameError.value = ''
}

const validateRenameFolderName = () => {
  if (!renameFolderName.value) {
    renameFolderNameError.value = ''
    return
  }
  
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/
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

const openFolder = (folderName) => {
  // 跳转到文件夹管理页面
  router.push(`/folder/${folderName}`)
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
}

const selectZipFiles = () => {
  zipFileInput.value?.click()
}

const handleZipFileSelection = (event) => {
  const files = Array.from(event.target.files)
  // 过滤只保留压缩包文件
  const zipFiles = files.filter(file => {
    const ext = file.name.toLowerCase().split('.').pop()
    return ['zip', 'rar', '7z'].includes(ext)
  })
  selectedZipFiles.value = zipFiles
}

const removeZipFile = (index) => {
  selectedZipFiles.value.splice(index, 1)
}

const startBatchZipUpload = async () => {
  if (selectedZipFiles.value.length === 0) return
  
  uploading.value = true
  uploadStatus.value = t('productManagement_startingBatchUpload')
  uploadProgress.value = 10
  
  try {
    const zipFile = selectedZipFiles.value[0] // 只处理第一个文件
    
    uploadStatus.value = t('productManagement_processing') + ': ' + zipFile.name
    uploadProgress.value = 30
    
    // 创建FormData
    const formData = new FormData()
    formData.append('zipFile', zipFile)
    
    uploadProgress.value = 50
    
    // 调用正确的批量替换API
    const response = await fetch('/api/uploads/batch-replace-products', {
      method: 'POST',
      body: formData
    })
    
    uploadProgress.value = 70
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`处理压缩包失败: ${zipFile.name} - ${errorData.message || response.status}`)
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(`处理压缩包失败: ${zipFile.name} - ${result.message}`)
    }
    
    console.log(`压缩包处理成功: ${zipFile.name}`, result)
    uploadProgress.value = 90
    
    // 上传完成，重新获取产品列表
    uploadStatus.value = t('productManagement_refreshingList')
    await fetchProducts()
    
    uploadProgress.value = 100
    uploadStatus.value = t('productManagement_uploadComplete')
    
    setTimeout(() => {
      closeBatchUploadModal()
    }, 1000)
    
  } catch (err) {
    console.error('批量压缩包上传错误:', err)
    uploadStatus.value = t('productManagement_uploadFailed') + ': ' + err.message
    uploadProgress.value = 0
    
    // 刷新产品列表以显示当前状态
    await fetchProducts()
  } finally {
    uploading.value = false
    setTimeout(() => {
      uploadProgress.value = 0
    }, 2000)
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
  router.back()
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
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: white;
}

/* 页面头部 */
.page-header {
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.page-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 28px;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border-radius: 2px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.search-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-input-container {
  position: relative;
}

.search-input {
  width: 300px;
  padding-right: 40px;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.folder-count {
  color: #8c8c8c;
  font-size: 14px;
  font-weight: 500;
}

/* 表单样式 */
.form-content {
  margin: 16px 0;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
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

/* 文件夹网格 */
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.folder-item {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.folder-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-color: #d9d9d9;
  transform: translateY(-2px);
}

.folder-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-info {
  flex: 1;
  min-width: 0;
}

.folder-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #8c8c8c;
}

.folder-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.folder-item:hover .folder-actions {
  opacity: 1;
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

/* 状态样式 */
.loading-spin {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.spinner {
  font-size: 16px;
  color: #1890ff;
}

.error-state {
  padding: 80px 20px;
  text-align: center;
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
  padding: 80px 20px;
  text-align: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  margin-bottom: 16px;
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
    padding: 20px;
  }
  
  .page-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: flex-start;
  }
  
  .search-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .search-input {
    width: 100%;
  }
  
  .folder-grid {
    grid-template-columns: 1fr;
  }
  
  .folder-item {
    padding: 16px;
  }
}

@media (max-width: 576px) {
  .page-title {
    font-size: 20px;
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .action-buttons .button {
    width: 100%;
    justify-content: center;
  }
}

.batch-upload-button {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
  border: none;
}

.batch-upload-button:hover {
  background: linear-gradient(135deg, #40a9ff, #36cfc9);
  opacity: 0.9;
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

.file-selector {
  margin-bottom: 20px;
  text-align: center;
}

.select-files-button {
  background: linear-gradient(135deg, #722ed1, #9254de);
  border: none;
  color: white;
  font-size: 14px;
  padding: 12px 24px;
}

.select-files-button:hover {
  background: linear-gradient(135deg, #9254de, #722ed1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(114, 46, 209, 0.3);
}

.file-hint {
  display: block;
  margin-top: 8px;
  color: #8c8c8c;
  font-size: 12px;
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
  background: linear-gradient(135deg, #fafafa, #f5f5f5);
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 13px;
  color: #262626;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: linear-gradient(135deg, #f0f9ff, #e6f7ff);
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

.upload-progress {
  margin-top: 20px;
  padding: 16px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: #52c41a;
  font-weight: 600;
}

.upload-status {
  margin-top: 8px;
  font-size: 12px;
  color: #389e0d;
  font-style: italic;
}

.upload-button {
  background: linear-gradient(135deg, #722ed1, #9254de) !important;
  border: none !important;
  color: white !important;
}

.upload-button:hover {
  background: linear-gradient(135deg, #9254de, #722ed1) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(114, 46, 209, 0.3) !important;
}

.upload-button:disabled {
  background: #d9d9d9 !important;
  transform: none !important;
  box-shadow: none !important;
}
</style>