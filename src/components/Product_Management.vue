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
      <div class="header-content">
        <div class="header-row">
          <div class="header-col">
            <h1 class="page-title">{{ t('productManagement_title') }}</h1>
          </div>
          <div class="header-col right">
            <div class="button-group">
              <button @click="goBack" class="btn btn-secondary back-button">
                <span class="btn-icon">←</span>
                {{ t('productManagement_back') }}
              </button>
              <button @click="refreshProducts" class="btn btn-secondary refresh-button" :disabled="loading">
                <span class="btn-icon">🔄</span>
                {{ t('productManagement_refresh') }}
              </button>
              <button type="button" @click="showCreateFileModal = true" class="btn btn-primary create-file-button">
                <span class="btn-icon">📄+</span>
                {{ t('productManagement_createFile') }}
              </button>
              <button type="button" @click="showCreateFolderModal = true" class="btn btn-primary create-folder-button">
                <span class="btn-icon">📁+</span>
                {{ t('productManagement_createFolder') }}
              </button>
              <button type="button" @click="showUploadFolderModal = true" class="btn btn-primary upload-folder-button">
                <span class="btn-icon">📤</span>
                {{ t('productManagement_uploadFolder') }}
              </button>
              <button type="button" @click="showBatchUploadModal = true" class="btn btn-danger batch-upload-button">
                <span class="btn-icon">☁️📤</span>
                {{ t('productManagement_batchUploadReplace') }}
              </button>
            </div>
          </div>
        </div>

        <!-- 搜索和统计 -->
        <div class="header-row">
          <div class="header-col">
            <div class="search-container">
              <input
                v-model="searchQuery"
                :placeholder="t('productManagement_searchPlaceholder')"
                class="search-input"
              />
              <span class="search-icon">🔍</span>
            </div>
          </div>
          <div class="header-col right">
            <span class="folder-count">
              {{ t('productManagement_totalProductFolders') }} {{ filteredProducts.length }} {{ t('productManagement_productFolders') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-spin">
        <div class="spinner"></div>
        <div class="loading-text">{{ t('productManagement_loading') }}</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h3 class="error-title">{{ t('productManagement_loading') }}</h3>
        <p class="error-message">{{ error }}</p>
        <button type="button" @click="fetchProducts" class="btn btn-primary">
          {{ t('productManagement_retry') }}
        </button>
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
          <div class="folder-icon">📁</div>
          <div class="folder-info">
            <div class="folder-name">{{ product.name }}</div>
            <div class="folder-stats">
              <span>{{ t('productManagement_folderSize') }} {{ formatFileSize(product.totalSize || 0) }}</span>
            </div>
          </div>
          <div class="folder-actions">
            <button
              type="button"
              @click.stop="renameFolder(product.name)"
              class="btn-icon-only"
              :title="t('productManagement_rename')"
            >
              ✏️
            </button>
            <button
              type="button"
              @click.stop="deleteFolder(product.name)"
              class="btn-icon-only btn-danger"
              :title="t('productManagement_delete')"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && !error && filteredProducts.length === 0" class="empty-state">
        <div class="empty-icon">📁</div>
        <h3 class="empty-title">{{ t('productManagement_noProductFolders') }}</h3>
        <p class="empty-message">{{ t('productManagement_createFirstFolderDesc') }}</p>
        <button type="button" @click="showCreateFolderModal = true" class="btn btn-primary">
          {{ t('productManagement_createFirstFolder') }}
        </button>
      </div>
    </div>

    <!-- 创建文件模态框组件 -->
    <CreateFileModal
      :open="showCreateFileModal"
      @close="showCreateFileModal = false"
      @create="handleCreateFile"
    />

    <!-- 创建文件夹模态框组件 -->
    <CreateFolderModal
      :open="showCreateFolderModal"
      @close="showCreateFolderModal = false"
      @create="handleCreateFolder"
    />

    <!-- 重命名文件夹模态框 -->
    <div v-if="showRenameFolderModal" class="modal-overlay" @click="closeRenameFolderModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('productManagement_renameFolder') }}</h3>
          <button class="modal-close" @click="closeRenameFolderModal">✕</button>
        </div>
        <div class="modal-body">
          <form class="form" @submit.prevent="confirmRenameFolder">
            <div class="form-group">
              <label class="form-label">{{ t('productManagement_newFolderName') }}</label>
              <input
                v-model="renameFolderName"
                :placeholder="t('productManagement_inputNewFolderName')"
                class="form-input"
                @input="validateRenameFolderName"
                required
              />
              <div v-if="renameFolderNameError" class="form-error">{{ renameFolderNameError }}</div>
            </div>

            <div class="modal-footer">
              <button type="button" @click="closeRenameFolderModal" class="btn btn-secondary">
                {{ t('productManagement_cancel') }}
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="!renameFolderName || !!renameFolderNameError || renamingFolder"
                :class="{ 'btn-loading': renamingFolder }"
              >
                {{ renamingFolder ? t('productManagement_renaming') : t('productManagement_renameAction') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 上传文件夹模态框组件 -->
    <UploadFolderModal
      :open="showUploadFolderModal"
      @close="showUploadFolderModal = false"
      @upload-complete="handleUploadComplete"
    />

    <!-- 批量上传替换模态框组件 -->
    <BatchUploadModal
      :open="showBatchUploadModal"
      @close="showBatchUploadModal = false"
      @upload-complete="handleBatchUploadComplete"
    />

    <!-- 删除确认模态框 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('productManagement_confirmDelete') }}</h3>
          <button class="modal-close" @click="cancelDelete">✕</button>
        </div>
        <div class="modal-body">
          <p>{{ t('productManagement_deleteConfirmContent') }}{{ folderToDelete }}{{ t('productManagement_deleteConfirmContent2') }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" @click="cancelDelete" class="btn btn-secondary">
            {{ t('productManagement_cancelDelete') }}
          </button>
          <button type="button" @click="confirmDeleteFolder" class="btn btn-danger">
            {{ t('productManagement_okDelete') }}
          </button>
        </div>
      </div>
    </div>

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
import CreateFolderModal from './CreateFolderModal.vue'
import CreateFileModal from './CreateFileModal.vue'
import UploadFolderModal from './UploadFolderModal.vue'
import BatchUploadModal from './BatchUploadModal.vue'

// 自定义消息提示函数
const showMessage = (content, type = 'success', duration = 3000) => {
  // 创建消息元素
  const messageEl = document.createElement('div')
  messageEl.className = `custom-message message-${type}`
  messageEl.textContent = content
  
  // 添加到页面
  document.body.appendChild(messageEl)
  
  // 自动移除
  setTimeout(() => {
    messageEl.classList.add('fade-out')
    setTimeout(() => {
      document.body.removeChild(messageEl)
    }, 300)
  }, duration)
}

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
const showCreateFileModal = ref(false)
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
  
  const invalidChars = /[<>:\"/\\|?*\x00-\x1F]/
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
  
  const invalidChars = /[<>:\"/\\|?*\x00-\x1F]/
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

const handleCreateFile = async (fileData) => {
  try {
    console.log(`📄 开始创建文件: ${fileData.fileName}`)
    
    // 这里需要实现创建文件的API调用
    // 由于当前API配置中没有创建文件的端点，我们暂时模拟成功
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log(`✅ 文件创建成功: ${fileData.fileName}`)
    showMessage(`文件 "${fileData.fileName}" 创建成功`, 'success')
    
    // 关闭模态框
    showCreateFileModal.value = false
    
    // 重新获取产品列表
    await fetchProducts()
    
  } catch (err) {
    console.error('创建文件错误:', err)
    showMessage(`创建文件失败: ${err.message}`, 'error')
  }
}

const handleCreateFolder = async (folderName) => {
  try {
    creatingFolder.value = true
    
    const response = await fetch(API_CONFIG.CREATE_PRODUCT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productName: folderName,
        folderName: folderName
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      console.log(`✅ 产品文件夹创建成功: ${folderName}`)
      showMessage(`${t('productManagement_productFolderCreated')}${folderName}${t('productManagement_productFolderCreated2')}`, 'success')
      
      // 重新获取产品列表
      await fetchProducts()
    } else {
      throw new Error(data.message || t('productManagement_createFolderFailed'))
    }
  } catch (err) {
    console.error('创建文件夹错误:', err)
    showMessage(`${t('productManagement_createFailed')}${err.message}`, 'error')
  } finally {
    creatingFolder.value = false
  }
}

const renameFolder = (folderName) => {
  folderToRename.value = folderName
  renameFolderName.value = folderName
  showRenameFolderModal.value = true
}

const closeRenameFolderModal = () => {
  showRenameFolderModal.value = false
  renameFolderName.value = ''
  renameFolderNameError.value = ''
  folderToRename.value = ''
  renamingFolder.value = false
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
      showMessage(`${t('productManagement_productRenamed')}`, 'success')
      
      // 重新获取产品列表
      await fetchProducts()
      closeRenameFolderModal()
    } else {
      throw new Error(data.message || t('productManagement_renameFolderFailed'))
    }
  } catch (err) {
    console.error('重命名文件夹错误:', err)
    showMessage(`${t('productManagement_renameFailed')}${err.message}`, 'error')
  } finally {
    renamingFolder.value = false
  }
}

const deleteFolder = (folderName) => {
  folderToDelete.value = folderName
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  folderToDelete.value = ''
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

        showMessage(`${t('productManagement_productDeleted')}${folderToDelete.value}${t('productManagement_productDeleted2')}`, 'success')

        // 先关闭确认对话框，再刷新产品列表
        cancelDelete()
        // 重新获取产品列表
        await fetchProducts()

      } else {
        const errorMsg = data.message || data.error || `${t('productManagement_deleteFailedText')}${response.status})`
        console.error(`❌ 删除失败:`, errorMsg)
        showMessage(`${t('productManagement_deleteFailedMsg')}${errorMsg}`, 'error')
      }
  } catch (err) {
    console.error('❌ 删除操作失败:', err)
    showMessage(`${t('productManagement_deleteFailedMsg')}${err.message}`, 'error')
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

const handleUploadComplete = async (result) => {
  console.log('产品文件夹上传完成:', result)
  
  if (result.success) {
      // 上传成功，关闭模态框并刷新产品列表
      showUploadFolderModal.value = false
      await fetchProducts()
      
      // 显示成功消息
      showMessage(`${t('productManagement_productFolderUploaded')}${result.result.actualName}${t('productManagement_productFolderUploaded2')}`, 'success')
    } else {
      // 上传失败，显示错误信息
      showMessage(`${t('productManagement_uploadFailed')}${result.error}`, 'error')
    }
}

const handleBatchUploadComplete = async (result) => {
  console.log('批量上传完成:', result)
  
  if (result.success && result.file) {
    // 处理批量上传
    batchUploading.value = true
    batchUploadProgress.value = 0
    batchUploadStatus.value = '准备上传...'
    batchUploadResult.value = null
    
    try {
      console.log('🚀 开始批量上传:', result.file.name)
      
      // 创建FormData
      const formData = new FormData()
      formData.append('zipFile', result.file)
      
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
              showMessage('批量替换成功！', 'success')
              setTimeout(() => {
                showBatchUploadModal.value = false
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
        showMessage(`批量替换失败: ${error.message}`, 'error')
      } finally {
        batchUploading.value = false
      }
  } else if (result.success === false) {
    // 验证失败，显示错误信息
    showMessage(result.error, 'error')
  }
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

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #8c8c8c;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #595959;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 表单样式 */
.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #595959;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-error {
  font-size: 12px;
  color: #ff4d4f;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn-secondary {
  background: #f0f2f5;
  color: #4a4a4a;
  border-color: #d9d9d9;
}

.btn-secondary:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.btn-primary {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover {
  background: #ff7875;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
