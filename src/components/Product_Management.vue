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
      <a-space direction="vertical" :size="16" style="width: 100%">
        <a-row justify="space-between" align="middle">
          <a-col>
            <h1 class="page-title">{{ t('productManagement_title') }}</h1>
          </a-col>
          <a-col>
            <a-space>
              <a-button @click="goBack" class="back-button">
                <template #icon>
                  <ArrowLeftOutlined />
                </template>
                {{ t('productManagement_back') }}
              </a-button>
              <a-button @click="refreshProducts" class="refresh-button" :loading="loading">
                <template #icon>
                  <ReloadOutlined />
                </template>
                {{ t('productManagement_refresh') }}
              </a-button>
              <a-button type="primary" @click="showCreateFolderModal = true" class="create-folder-button">
                <template #icon>
                  <FolderAddOutlined />
                </template>
                {{ t('productManagement_createFolder') }}
              </a-button>
              <a-button type="primary" @click="showUploadFolderModal = true" class="upload-folder-button">
                <template #icon>
                  <UploadOutlined />
                </template>
                {{ t('productManagement_uploadFolder') }}
              </a-button>
              <a-button type="primary" danger @click="showBatchUploadModal = true" class="batch-upload-button">
                <template #icon>
                  <CloudUploadOutlined />
                </template>
                {{ t('productManagement_batchUploadReplace') }}
              </a-button>
            </a-space>
          </a-col>
        </a-row>

        <!-- 搜索和统计 -->
        <a-row justify="space-between" align="middle">
          <a-col>
            <a-input
              v-model:value="searchQuery"
              :placeholder="t('productManagement_searchPlaceholder')"
              style="width: 300px"
            >
              <template #prefix>
                <SearchOutlined />
              </template>
            </a-input>
          </a-col>
          <a-col>
            <span class="folder-count">
              {{ t('productManagement_totalProductFolders') }} {{ filteredProducts.length }} {{ t('productManagement_productFolders') }}
            </span>
          </a-col>
        </a-row>
      </a-space>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 加载状态 -->
      <a-spin v-if="loading" :spinning="loading" size="large" class="loading-spin">
        <template #indicator>
          <a-spin size="large" />
        </template>
      </a-spin>

      <!-- 错误状态 -->
      <a-result
        v-else-if="error"
        status="error"
        :title="t('productManagement_loading')"
        :sub-title="error"
      >
        <template #extra>
          <a-button type="primary" @click="fetchProducts">
            {{ t('productManagement_retry') }}
          </a-button>
        </template>
      </a-result>

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
            <FolderOutlined />
          </div>
          <div class="folder-info">
            <div class="folder-name">{{ product.name }}</div>
            <div class="folder-stats">
              <span>{{ t('productManagement_folderSize') }} {{ formatFileSize(product.totalSize || 0) }}</span>
            </div>
          </div>
          <div class="folder-actions">
            <a-button
              type="text"
              size="small"
              @click.stop="renameFolder(product.name)"
              :title="t('productManagement_rename')"
            >
              <EditOutlined />
            </a-button>
            <a-button
              type="text"
              size="small"
              @click.stop="deleteFolder(product.name)"
              :title="t('productManagement_delete')"
              danger
            >
              <DeleteOutlined />
            </a-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <a-empty
        v-if="!loading && !error && filteredProducts.length === 0"
        :image="simpleImage"
        class="empty-state"
      >
        <template #description>
          <p>{{ t('productManagement_noProductFolders') }}</p>
        </template>
        <a-button type="primary" @click="showCreateFolderModal = true">
          {{ t('productManagement_createFirstFolder') }}
        </a-button>
      </a-empty>
    </div>

    <!-- 创建文件夹模态框 -->
    <a-modal
      v-model:open="showCreateFolderModal"
      :title="t('productManagement_createProductFolder')"
      width="500px"
      @cancel="closeCreateFolderModal"
    >
      <a-form layout="vertical">
        <a-form-item
          :label="t('productManagement_folderName')"
          :validate-status="folderNameError ? 'error' : ''"
          :help="folderNameError"
        >
          <a-input
            v-model:value="newFolderName"
            :placeholder="t('productManagement_inputFolderName')"
            size="large"
            @input="validateFolderName"
          />
        </a-form-item>

        <a-alert
          type="info"
          show-icon
          :message="t('productManagement_folderStructure')"
          :description="t('productManagement_folderStructureDesc')"
          style="margin-bottom: 16px"
        />
      </a-form>

      <template #footer>
        <a-space>
          <a-button @click="closeCreateFolderModal">
            {{ t('productManagement_cancel') }}
          </a-button>
          <a-button
            type="primary"
            @click="createFolder"
            :disabled="!newFolderName || !!folderNameError || creatingFolder"
            :loading="creatingFolder"
          >
            {{ creatingFolder ? t('productManagement_creating') : t('productManagement_create') }}
          </a-button>
        </a-space>
      </template>
    </a-modal>

    <!-- 重命名文件夹模态框 -->
    <a-modal
      v-model:open="showRenameFolderModal"
      :title="t('productManagement_renameFolder')"
      width="500px"
      @cancel="closeRenameFolderModal"
    >
      <a-form layout="vertical">
        <a-form-item
          :label="t('productManagement_newFolderName')"
          :validate-status="renameFolderNameError ? 'error' : ''"
          :help="renameFolderNameError"
        >
          <a-input
            v-model:value="renameFolderName"
            :placeholder="t('productManagement_inputNewFolderName')"
            size="large"
            @input="validateRenameFolderName"
          />
        </a-form-item>
      </a-form>

      <template #footer>
        <a-space>
          <a-button @click="closeRenameFolderModal">
            {{ t('productManagement_cancel') }}
          </a-button>
          <a-button
            type="primary"
            @click="confirmRenameFolder"
            :disabled="!renameFolderName || !!renameFolderNameError || renamingFolder"
            :loading="renamingFolder"
          >
            {{ renamingFolder ? t('productManagement_renaming') : t('productManagement_renameAction') }}
          </a-button>
        </a-space>
      </template>
    </a-modal>

    <!-- 上传文件夹模态框 -->
    <a-modal
      v-model:open="showUploadFolderModal"
      :title="t('productManagement_uploadProductFolder')"
      width="800px"
      @cancel="closeUploadFolderModal"
      :footer="null"
    >
      <ProductFolderUploader
        :button-text="t('productManagement_selectZipPackage')"
        @upload-complete="handleUploadComplete"
      />
    </a-modal>

    <!-- 批量上传替换模态框 -->
    <a-modal
      v-model:open="showBatchUploadModal"
      :title="t('productManagement_batchUploadReplaceTitle')"
      width="800px"
      @cancel="closeBatchUploadModal"
      :footer="null"
    >
      <div class="batch-upload-content">
        <a-alert
          type="warning"
          show-icon
          :message="t('productManagement_dangerousOperation')"
          :description="t('productManagement_dangerousOperationDesc')"
          style="margin-bottom: 20px"
        />
         
        <div class="batch-upload-area">
          <div
            class="upload-zone"
            :class="{ 'upload-zone--dragover': isBatchDragOver }"
            @click="triggerBatchFileInput"
            @drop="handleBatchDrop"
            @dragover.prevent="handleBatchDragOver"
            @dragleave.prevent="handleBatchDragLeave"
          >
            <div class="upload-zone-content">
              <div class="upload-zone-icon">
                <CloudUploadOutlined />
              </div>
              <div class="upload-zone-text">
                <div class="upload-zone-title">{{ t('productManagement_selectZipTitle') }}</div>
                <div class="upload-zone-subtitle">
                  {{ t('productManagement_selectZipSubtitle') }}
                </div>
              </div>
              <input
                ref="batchFileInput"
                type="file"
                accept=".zip"
                @change="handleBatchFileSelect"
                class="batch-file-input"
              />
            </div>
          </div>
        </div>

        <!-- 已选择文件信息 -->
        <div v-if="selectedBatchFile" class="selected-file-info">
          <a-alert
            type="info"
            show-icon
            :message="`${t('productManagement_selectedFile')} ${selectedBatchFile.name}`"
            :description="`${t('productManagement_fileSize')} ${formatFileSize(selectedBatchFile.size)} ${t('productManagement_clickUploadButton')}`"
            style="margin-bottom: 16px"
          />
        </div>

        <!-- 上传按钮 -->
        <div v-if="selectedBatchFile && !batchUploading" class="batch-upload-actions">
          <a-button
            type="primary"
            danger
            size="large"
            @click="startBatchUpload"
            class="batch-upload-start-button"
          >
            <template #icon>
              <CloudUploadOutlined />
            </template>
            {{ t('productManagement_startBatchReplace') }}
          </a-button>
        </div>

        <!-- 上传进度 -->
        <div v-if="batchUploading" class="batch-upload-progress">
          <div class="progress-header">
            <span>{{ t('productManagement_executingBatchReplace') }}</span>
            <span class="progress-percent">{{ batchUploadProgress }}%</span>
          </div>
          <a-progress
            :percent="batchUploadProgress"
            :show-info="false"
            status="active"
          />
          <div class="progress-details">
            <div>{{ batchUploadStatus }}</div>
          </div>
        </div>

        <!-- 上传结果 -->
        <div v-if="batchUploadResult" class="batch-upload-result">
          <a-alert
            :message="batchUploadResult.success ? t('productManagement_batchReplaceSuccess') : t('productManagement_batchReplaceFailed')"
            :type="batchUploadResult.success ? 'success' : 'error'"
            show-icon
            closable
            @close="batchUploadResult = null"
          >
            <template #description>
              <div v-if="batchUploadResult.success">
                <p>{{ batchUploadResult.message }}</p>
                <p>{{ t('productManagement_processedFiles') }} {{ batchUploadResult.fileCount }} {{ t('common_files') }}</p>
                <p>{{ t('productManagement_createdFolders') }} {{ batchUploadResult.folderCount }} {{ t('common_folders') }}</p>
                <p v-if="batchUploadResult.backupPath">
                  {{ t('productManagement_backupLocation') }} {{ batchUploadResult.backupPath }}
                </p>
              </div>
              <div v-else>
                <p>{{ batchUploadResult.message }}</p>
              </div>
            </template>
          </a-alert>
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
    </a-modal>

    <!-- 删除确认模态框 -->
    <a-modal
      v-model:open="showDeleteConfirm"
      :title="t('productManagement_confirmDelete')"
      @cancel="cancelDelete"
      @ok="confirmDeleteFolder"
      :ok-text="t('productManagement_okDelete')"
      :cancel-text="t('productManagement_cancelDelete')"
      ok-type="danger"
    >
      <p>{{ t('productManagement_deleteConfirmContent') }}{{ folderToDelete }}{{ t('productManagement_deleteConfirmContent2') }}</p>
    </a-modal>

    <!-- 右键菜单 -->
    <div
      v-if="showContextMenu"
      class="context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      @click="hideContextMenu"
    >
      <div class="context-menu-item" @click="openFolder(contextMenuProduct.name)">
        <FolderOpenOutlined />
        <span>{{ t('productManagement_open') }}</span>
      </div>
      <div class="context-menu-item" @click="renameFolder(contextMenuProduct.name)">
        <EditOutlined />
        <span>{{ t('productManagement_rename') }}</span>
      </div>
      <div class="context-menu-item" @click="deleteFolder(contextMenuProduct.name)">
        <DeleteOutlined />
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
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  FolderAddOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  CloudUploadOutlined
} from '@ant-design/icons-vue'
import ProductFolderUploader from './ProductFolderUploader.vue'

const { t } = useI18n()
const router = useRouter()
const { isAdminLoggedIn } = useAdminAuth()

// 简单的空状态图片
const simpleImage = undefined

// 响应式数据
const products = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const showCreateFolderModal = ref(false)
const showUploadFolderModal = ref(false)
const showRenameFolderModal = ref(false)
const showDeleteConfirm = ref(false)
const showBatchUploadModal = ref(false)
const creatingFolder = ref(false)
const renamingFolder = ref(false)
const newFolderName = ref('')
const renameFolderName = ref('')
const folderToDelete = ref('')
const folderToRename = ref('')
const folderNameError = ref('')
const renameFolderNameError = ref('')
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuProduct = ref(null)

// 批量上传相关数据
const batchFileInput = ref(null)
const selectedBatchFile = ref(null)
const isBatchDragOver = ref(false)
const batchUploading = ref(false)
const batchUploadProgress = ref(0)
const batchUploadStatus = ref('')
const batchUploadResult = ref(null)

// 计算属性
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  return products.value.filter(product => 
    product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const canBatchUpload = computed(() => {
  return selectedBatchFile.value && true
})

// API接口配置
const API_CONFIG = {
  GET_PRODUCTS: '/api/products',
  CREATE_PRODUCT: '/api/products',
  RENAME_PRODUCT: '/api/products',
  DELETE_PRODUCT: '/api/products',
  BATCH_REPLACE: '/api/batch-replace-products'
}

// 主要的获取产品列表方法
const fetchProducts = async () => {
  try {
    loading.value = true
    error.value = null

    console.log('🔄 开始从API获取产品列表...')
    
    // 使用后端API获取产品列表
    const response = await fetch(API_CONFIG.GET_PRODUCTS)
    console.log('📡 API响应状态:', response.status)
    
    if (!response.ok) {
      throw new Error(`获取产品列表失败: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('📊 产品数据:', data)
    
    // 服务器直接返回产品数组，不需要包装
    if (Array.isArray(data)) {
      const processedProducts = data.map((product, index) => ({
        // 优先使用folderName，如果没有则回退到name，确保数据一致性
        name: product.folderName || product.name,
        fileCount: product.fileCount || 0,
        totalSize: product.totalSize || 0,
        id: product.id || index + 1,
        category: product.category || 'general',
        // 描述也优先使用folderName
        description: product.description || `Product folder: ${product.folderName || product.name}`,
        path: product.path || `Product/${product.folderName || product.name}`
      }))
      
      products.value = processedProducts.filter(product => product.name && product.name.trim() !== '')
      
      // 添加调试信息：显示处理后的产品名称
      console.log('📋 处理后的产品列表名称:', products.value.map(p => ({
        name: p.name,
        folderName: p.folderName || 'undefined',
        model: p.model
      })))
      
      console.log(`✅ 成功加载 ${products.value.length} 个产品`)
    } else {
      console.error('❌ 产品数据格式错误')
      throw new Error('产品数据格式错误')
    }
    
  } catch (err) {
    console.error('❌ 获取产品列表失败:', err)
    error.value = err.message
    products.value = []
  } finally {
    loading.value = false
  }
}

const refreshProducts = async () => {
  try {
    console.log('🔄 手动刷新产品列表...')
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
      console.log(`✅ 产品文件夹创建成功: ${newFolderName.value}`)
      message.success(`${t('productManagement_productFolderCreated')}${newFolderName.value}${t('productManagement_productFolderCreated2')}`)
      
      // 重新获取产品列表
      await fetchProducts()
      // 关闭模态框
      closeCreateFolderModal()
    } else {
      throw new Error(data.message || t('productManagement_createFolderFailed'))
    }
  } catch (err) {
    console.error('创建文件夹错误:', err)
    message.error(`${t('productManagement_createFailed')}${err.message}`)
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
      console.log(`✅ 产品重命名成功: ${folderToRename.value} -> ${renameFolderName.value}`)
      message.success(`${t('productManagement_productRenamed')}`)
      
      // 重新获取产品列表
      await fetchProducts()
      closeRenameFolderModal()
    } else {
      throw new Error(data.message || t('productManagement_renameFolderFailed'))
    }
  } catch (err) {
    console.error('重命名文件夹错误:', err)
    message.error(`${t('productManagement_renameFailed')}${err.message}`)
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
    console.log(`🗑️ 开始删除产品: ${folderToDelete.value}`)

    const response = await fetch(`${API_CONFIG.DELETE_PRODUCT}/${encodeURIComponent(folderToDelete.value)}`, {
      method: 'DELETE'
    })

    const data = await response.json()

    if (response.ok && data.success) {
      console.log(`✅ 产品删除成功: ${folderToDelete.value}`)
      console.log(`🗑️ 删除详情:`, data)

      message.success(`${t('productManagement_productDeleted')}${folderToDelete.value}${t('productManagement_productDeleted2')}`)

      // 先关闭确认对话框，再刷新产品列表
      cancelDelete()
      // 重新获取产品列表
      await fetchProducts()

    } else {
      const errorMsg = data.message || data.error || `${t('productManagement_deleteFailedText')}${response.status})`
      console.error(`❌ 删除失败:`, errorMsg)
      message.error(`${t('productManagement_deleteFailedMsg')}${errorMsg}`)
    }
  } catch (err) {
    console.error('❌ 删除操作失败:', err)
    message.error(`${t('productManagement_deleteFailedMsg')}${err.message}`)
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
  // 清空批量上传相关状态
  selectedBatchFile.value = null
  isBatchDragOver.value = false
}

const handleUploadComplete = async (result) => {
  console.log('产品文件夹上传完成:', result)
  
  if (result.success) {
    // 上传成功，关闭模态框并刷新产品列表
    closeUploadFolderModal()
    await fetchProducts()
    
    // 显示成功消息
    message.success(`${t('productManagement_productFolderUploaded')}${result.result.actualName}${t('productManagement_productFolderUploaded2')}`)
  } else {
    // 上传失败，显示错误信息
    message.error(`${t('productManagement_uploadFailed')}${result.error}`)
  }
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  folderToDelete.value = ''
}

const goBack = () => {
  router.back()
}

// 批量上传相关方法
const triggerBatchFileInput = () => {
  batchFileInput.value?.click()
}

const handleBatchFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    addBatchFile(files[0])
  }
  // 清空input值，允许重复选择相同文件
  event.target.value = ''
}

const handleBatchDrop = (event) => {
  event.preventDefault()
  isBatchDragOver.value = false
  
  const files = Array.from(event.dataTransfer.files)
  if (files.length > 0) {
    addBatchFile(files[0])
  }
}

const handleBatchDragOver = (event) => {
  event.preventDefault()
  isBatchDragOver.value = true
}

const handleBatchDragLeave = (event) => {
  event.preventDefault()
  isBatchDragOver.value = false
}

const addBatchFile = (file) => {
  // 验证文件类型
  if (!file.name.toLowerCase().endsWith('.zip')) {
    message.error(t('productManagement_zipOnly'))
    return
  }

  // 验证文件大小（500MB）
  const maxSize = 500 * 1024 * 1024
  if (file.size > maxSize) {
    message.error(t('productManagement_fileSizeExceeded500'))
    return
  }

  selectedBatchFile.value = file
  console.log(`${t('productManagement_selectingBatchFile')}:`, file.name)
}

const startBatchUpload = async () => {
  if (!selectedBatchFile.value || batchUploading.value) return
  
  batchUploading.value = true
  batchUploadProgress.value = 0
  batchUploadStatus.value = '准备上传...'
  batchUploadResult.value = null
  
  try {
    console.log('🚀 开始批量上传:', selectedBatchFile.value.name)
    
    // 创建FormData
    const formData = new FormData()
    formData.append('zipFile', selectedBatchFile.value)
    
    batchUploadStatus.value = '正在上传文件...'
    batchUploadProgress.value = 10
    
    // 使用XMLHttpRequest来监听上传进度
    const xhr = new XMLHttpRequest()
    
    // 监听上传进度
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 30) // 上传阶段占30%
        batchUploadProgress.value = Math.max(batchUploadProgress.value, progress)
      }
    })
    
    // 监听响应
    xhr.addEventListener('load', async () => {
      if (xhr.status === 200) {
        try {
          batchUploadStatus.value = '正在处理文件...'
          batchUploadProgress.value = 40
          
          const response = JSON.parse(xhr.responseText)
          
          if (response.success) {
            batchUploadStatus.value = '更新产品列表...'
            batchUploadProgress.value = 80
            
            // 刷新产品列表
            await fetchProducts()
            
            batchUploadStatus.value = '完成'
            batchUploadProgress.value = 100
            
            batchUploadResult.value = {
              success: true,
              message: response.message,
              fileCount: response.fileCount,
              folderCount: response.folderCount,
              backupPath: response.backupPath
            }
            
            // 关闭模态框并显示成功消息
            message.success('批量替换成功！')
            setTimeout(() => {
              closeBatchUploadModal()
            }, 3000)
            
          } else {
            throw new Error(response.message || '批量替换失败')
          }
        } catch (parseError) {
          throw new Error('解析响应失败: ' + parseError.message)
        }
      } else {
        // 尝试解析错误响应
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          throw new Error(errorResponse.message || `服务器错误: ${xhr.status}`)
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
    xhr.open('POST', API_CONFIG.BATCH_REPLACE)
    xhr.send(formData)
    
  } catch (error) {
    console.error('批量上传失败:', error)
    batchUploadResult.value = {
      success: false,
      message: error.message
    }
    message.error(`批量替换失败: ${error.message}`)
  } finally {
    batchUploading.value = false
  }
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

/* 操作按钮 */
.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0f2f5;
  color: #4a4a4a;
  border: 1px solid #d9d9d9;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #52c41a;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.2);
}

.refresh-button:hover {
  background: #73d13d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.create-folder-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.create-folder-button:hover {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* 文件夹计数 */
.folder-count {
  color: #8c8c8c;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.folder-count::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #52c41a;
  border-radius: 50%;
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
  font-size: 32px;
  color: #1890ff;
  flex-shrink: 0;
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

/* 加载状态 */
.loading-spin {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

/* 空状态 */
.empty-state {
  padding: 80px 20px;
  text-align: center;
}

/* 批量上传样式 */
.batch-upload-content {
  width: 100%;
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

/* 批量上传提示 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  .file-manager {
    padding: 16px;
  }
  
  .page-header {
    padding: 20px;
  }
  
  .page-title {
    font-size: 24px;
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
  
  .back-button, .create-folder-button {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>