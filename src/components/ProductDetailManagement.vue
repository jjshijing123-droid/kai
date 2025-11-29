<template>
  <div class="product-detail-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title-section">
          <h1 class="page-title">{{ t('productDetailManagement_productDetails', { name: productName }) }}</h1>
        </div>
        <div class="header-actions">
          <button @click="goBack" class="back-button">
            ← {{ t('productDetailManagement_backToList') }}
          </button>
          <button class="rename-button" @click="editProduct">
            ✏️ {{ t('productDetailManagement_editProduct') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ t('productDetailManagement_loading') }}</div>
    </div>
    
    <div v-else>
    <!-- 产品图片管理区域 -->
    <div class="custom-tabs image-management">
      <!-- 标签页导航 -->
      <div class="custom-tabs-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.key" 
          class="custom-tab" 
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <!-- 标签页内容 -->
      <div class="custom-tabs-content">
        <!-- 主图管理 -->
        <div v-if="activeTab === 'main'" class="tab-content">
          <div class="custom-card">
            <div class="card-title">
              <span>{{ t('productDetailManagement_mainImage') }} (image_00.webp)</span>
            </div>
            <div class="main-image-section">
              <div class="image-grid">
                <div class="image-preview-column">
                  <div class="image-preview-container">
                    <div v-if="mainImage" class="image-preview">
                      <img
                        :src="mainImage"
                        :alt="t('productDetailManagement_mainImage')"
                        class="product-image"
                        @error="handleImageError('main')"
                      />
                    </div>
                    <div v-else class="empty-state">
                      <div class="empty-icon">📷</div>
                      <div class="empty-text">暂无{{ t('productDetailManagement_mainImage') }}</div>
                    </div>
                  </div>
                </div>
                <div class="upload-column">
                  <div class="upload-section">
                    <div class="custom-card upload-card-main">
                      <div class="card-title">上传{{ t('productDetailManagement_mainImage') }}</div>
                      <div class="upload-content">
                        <FileUploader
                          :productName="productName"
                          folderType="main"
                          :onUpload="handleFileUpload"
                          :multiple="false"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 六视图管理 -->
        <div v-else-if="activeTab === 'sixViews'" class="tab-content">
          <div class="custom-card">
            <div class="card-title">
              <span>{{ t('productDetailManagement_sixViews') }} (images_6Views/)</span>
            </div>
            <div class="grid-image-section">
              <div class="image-grid">
                <div 
                  v-for="(image, index) in sixViewsImages" 
                  :key="index"
                  class="image-item"
                >
                  <div class="image-card">
                    <div class="image-container">
                      <img
                        :src="image"
                        :alt="`${t('productDetailManagement_sixViews')} ${index + 1}`"
                        class="grid-image"
                        @error="handleGridImageError('sixViews', index)"
                        @click="showImagePreview(image)"
                      />
                    </div>
                    <div class="image-actions">
                      <button 
                        class="action-btn preview-btn" 
                        @click="showImagePreview(image)"
                        title="{{ t('productDetailManagement_previewImage') }}"
                      >
                        👁️
                      </button>
                      <button 
                        class="action-btn delete-btn" 
                        @click="deleteImage('sixViews', image)"
                        title="{{ t('productDetailManagement_deleteImage') }}"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
                <div class="upload-item">
                  <div class="upload-card-grid">
                    <div class="upload-grid-content">
                      <FileUploader
                        :productName="productName"
                        folderType="sixViews"
                        :onUpload="handleFileUpload"
                        :multiple="true"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 其他图片管理 -->
        <div v-else-if="activeTab === 'other'" class="tab-content">
          <div class="custom-card">
            <div class="card-title">
              <span>{{ t('productDetailManagement_otherImages') }} (images_other/)</span>
            </div>
            <div class="grid-image-section">
              <div class="image-grid">
                <div 
                  v-for="(image, index) in otherImages" 
                  :key="index"
                  class="image-item"
                >
                  <div class="image-card">
                    <div class="image-container">
                      <img
                        :src="image"
                        :alt="`${t('productDetailManagement_otherImages')} ${index + 1}`"
                        class="grid-image"
                        @error="handleGridImageError('other', index)"
                        @click="showImagePreview(image)"
                      />
                    </div>
                    <div class="image-actions">
                      <button 
                        class="action-btn preview-btn" 
                        @click="showImagePreview(image)"
                        title="{{ t('productDetailManagement_previewImage') }}"
                      >
                        👁️
                      </button>
                      <button 
                        class="action-btn delete-btn" 
                        @click="deleteImage('other', image)"
                        title="{{ t('productDetailManagement_deleteImage') }}"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
                <div class="upload-item">
                  <div class="upload-card-grid">
                    <div class="upload-grid-content">
                      <FileUploader
                        :productName="productName"
                        folderType="other"
                        :onUpload="handleFileUpload"
                        :multiple="true"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 视角序列帧管理 -->
        <div 
          v-for="view in 4" 
          :key="'view' + view" 
          v-if="activeTab === 'view' + view" 
          class="tab-content"
        >
          <div class="custom-card">
            <div class="card-title">
              <span>视角 {{ view }} (view{{ view }}/)</span>
            </div>
            <div class="grid-image-section">
              <div class="image-grid">
                <div 
                  v-for="(image, index) in viewImages[view - 1]" 
                  :key="index"
                  class="image-item"
                >
                  <div class="image-card">
                    <div class="image-container">
                      <img
                        :src="image"
                        :alt="`视角 ${view} - 图片 ${index + 1}`"
                        class="grid-image"
                        @error="handleGridImageError('view' + view, index)"
                        @click="showImagePreview(image)"
                      />
                    </div>
                    <div class="image-actions">
                      <button 
                        class="action-btn preview-btn" 
                        @click="showImagePreview(image)"
                        title="{{ t('productDetailManagement_previewImage') }}"
                      >
                        👁️
                      </button>
                      <button 
                        class="action-btn delete-btn" 
                        @click="deleteImage('view' + view, image)"
                        title="{{ t('productDetailManagement_deleteImage') }}"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
                <div class="upload-item">
                  <div class="upload-card-grid">
                    <div class="upload-grid-content">
                      <FileUploader
                        :productName="productName"
                        :folderType="'view' + view"
                        :onUpload="handleFileUpload"
                        :multiple="true"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- 编辑产品模态框 -->
    <div v-if="showEditProductModal" class="modal-overlay" @click="cancelEdit">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ t('productDetailManagement_editProduct') }}</h3>
          <button class="modal-close" @click="cancelEdit">×</button>
        </div>
        <div class="modal-body">
          <form class="custom-form">
            <div class="form-item">
              <label>{{ t('productDetailManagement_productName') }}</label>
              <input
                v-model="editingProduct.name"
                :placeholder="`输入新的${t('productDetailManagement_productName')}`"
                class="form-input"
              />
              <div v-if="editNameError" class="form-error">{{ editNameError }}</div>
            </div>
            <div class="form-item">
              <label>{{ t('productDetailManagement_productFolderName') }}</label>
              <input
                v-model="editingProduct.folderName"
                :placeholder="`输入新的${t('productDetailManagement_productFolderName')}`"
                class="form-input"
              />
              <div v-if="editFolderNameError" class="form-error">{{ editFolderNameError }}</div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="cancelEdit">{{ t('common_cancel') }}</button>
          <button 
            class="modal-confirm" 
            @click="updateProduct"
            :disabled="editNameError || editFolderNameError || !editingProduct.name || !editingProduct.folderName"
            :class="{ loading: updatingProduct }"
          >
            {{ updatingProduct ? t('common_saving') : t('common_save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <div v-if="showPreviewModal" class="modal-overlay" @click="closeImagePreview">
      <div class="modal-content preview-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ previewFileInfo?.name }}</h3>
          <button class="modal-close" @click="closeImagePreview">×</button>
        </div>
        <div class="modal-body">
          <img
            :src="previewImage"
            :alt="t('productDetailManagement_previewImage')"
            class="preview-image"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import FileUploader from './FileUploader.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// 响应式数据
const productName = ref('')
const productData = ref(null)
const mainImage = ref('')
const sixViewsImages = ref([])
const otherImages = ref([])
const viewImages = ref([[], [], [], []])
const showEditProductModal = ref(false)
const updatingProduct = ref(false)
const editingProduct = ref({
  name: '',
  folderName: '',
  originalName: '',
  originalFolderName: ''
})
const loading = ref(false)
const imageErrors = ref(new Set())
const previewImage = ref('')
const showPreviewModal = ref(false)

// 标签页相关数据
const activeTab = ref('main')
const tabs = ref([
  { key: 'main', label: t('productDetailManagement_mainImage') },
  { key: 'sixViews', label: t('productDetailManagement_sixViews') },
  { key: 'other', label: t('productDetailManagement_otherImages') },
  { key: 'view1', label: '视角 1' },
  { key: 'view2', label: '视角 2' },
  { key: 'view3', label: '视角 3' },
  { key: 'view4', label: '视角 4' }
])

// 消息通知
const showMessage = (message, type = 'info') => {
  const messageEl = document.createElement('div')
  messageEl.className = `custom-message custom-message-${type}`
  messageEl.textContent = message
  document.body.appendChild(messageEl)
  
  setTimeout(() => {
    messageEl.classList.add('show')
  }, 100)
  
  setTimeout(() => {
    messageEl.classList.remove('show')
    setTimeout(() => {
      document.body.removeChild(messageEl)
    }, 300)
  }, 3000)
}

// 计算属性
const editNameError = computed(() => {
  if (!editingProduct.value.name) return ''
  
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/
  if (invalidChars.test(editingProduct.value.name)) {
    return `${t('productDetailManagement_productName')}包含无效字符`
  }
  
  return ''
})

const editFolderNameError = computed(() => {
  if (!editingProduct.value.folderName) return ''
  
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/
  if (invalidChars.test(editingProduct.value.folderName)) {
    return `${t('productDetailManagement_folderNameContainsInvalidChars')}`
  }
  
  return ''
})

// 方法
// 从服务器获取产品目录数据
const fetchProductCatalog = async () => {
  try {
    const response = await fetch('/api/products/catalog')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(t('productDetailManagement_getCatalogFailed'), error)
    throw error
  }
}

// 获取产品详情
const fetchProductDetails = async () => {
  try {
    const response = await fetch(`/api/products/${encodeURIComponent(productName.value)}/details`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(t('productDetailManagement_getDetailsFailed'), error)
    throw error
  }
}

const loadProductImages = async () => {
  if (!productName.value) return
  
  try {
    loading.value = true
    imageErrors.value.clear()
    
    console.log(t('productDetailManagement_startLoadingImages'), productName.value)
    
    // 重置所有图片数组
    mainImage.value = ''
    sixViewsImages.value = []
    otherImages.value = []
    viewImages.value = [[], [], [], []]
    
    // 从服务器获取产品目录数据
    const catalog = await fetchProductCatalog()
    const product = catalog.products.find(p => p.name === productName.value)
    
    if (!product) {
      console.warn(`在产品目录中未找到产品: ${productName.value}`)
      showMessage(t('productDetailManagement_productNotInCatalog'), 'error')
      return
    }
    
    // 使用产品目录数据加载图片
    productData.value = product
    await loadImagesFromCatalog(product)
  } catch (error) {
    console.error(t('productDetailManagement_loadImagesFailed'), error)
    showMessage(t('productDetailManagement_loadImagesFailed'), 'error')
  } finally {
    loading.value = false
  }
}

// 从产品目录数据加载图片
const loadImagesFromCatalog = async (product) => {
  console.log(t('productDetailManagement_loadImageDetailsFailed'), product)
  
  try {
    // 获取产品详情（包含文件夹扫描结果）
    const productDetailsResponse = await fetchProductDetails()
    const productDetails = productDetailsResponse.product || productDetailsResponse
    
    // 加载{{ t('productDetailManagement_mainImage') }}
    if (product.mainImage) {
      mainImage.value = product.mainImage
      console.log(`${t('productDetailManagement_mainImage')}路径:`, mainImage.value)
    }
    
    // 加载{{ t('productDetailManagement_sixViews') }}图片
    if (product.additionalImages?.sixViews && productDetails.folders) {
      const sixViewsFolder = productDetails.folders.images_6Views || []
      sixViewsImages.value = sixViewsFolder.map(file =>
        `${product.additionalImages.sixViews}${file.name}`
      )
      console.log(`${t('productDetailManagement_sixViews')}图片数量:`, sixViewsImages.value.length)
    }
    
    // 加载{{ t('productDetailManagement_otherImages') }}
    if (product.additionalImages?.other && productDetails.folders) {
      const otherFolder = productDetails.folders.images_other || []
      otherImages.value = otherFolder.map(file =>
        `${product.additionalImages.other}${file.name}`
      )
      console.log(`${t('productDetailManagement_otherImages')}数量:`, otherImages.value.length)
    }
    
    // 加载视角图片
    for (let i = 1; i <= 4; i++) {
      const viewKey = `view${i}`
      if (product.views?.[viewKey] && productDetails.folders) {
        const viewFolder = productDetails.folders[viewKey] || []
        viewImages.value[i - 1] = viewFolder.map(file =>
          `${product.views[viewKey]}${file.name}`
        )
        console.log(`视角${i}图片数量:`, viewImages.value[i - 1].length)
      }
    }
  } catch (error) {
    console.error('加载产品图片详情失败:', error)
    message.error(t('productDetailManagement_loadImagesFailed'))
  }
}


const handleFileUpload = (result) => {
  console.log('文件上传结果:', result)
  if (result.success) {
    showMessage('文件上传成功', 'success')
    // 文件上传成功后重新加载图片
    loadProductImages()
  } else {
    showMessage('文件上传失败: ' + (result.error || '未知错误'), 'error')
  }
}

const deleteImage = async (folderType, imageUrl) => {
  try {
    // 使用原生 confirm 对话框
    const confirmed = confirm('确定要删除这张图片吗？此操作不可撤销。')
    
    if (!confirmed) return
    
    // 从URL中提取文件名
    const fileName = imageUrl.split('/').pop()
    console.log(`${t('productDetailManagement_deleteImage')}:`, folderType, fileName, imageUrl)
    
    // 构建文件路径
    let filePath = ''
    if (folderType === 'main') {
      filePath = `${productName.value}/${fileName}`
    } else if (folderType === 'sixViews') {
      filePath = `${productName.value}/images_6Views/${fileName}`
    } else if (folderType === 'other') {
      filePath = `${productName.value}/images_other/${fileName}`
    } else if (folderType.startsWith('view')) {
      const viewNumber = folderType.replace('view', '')
      filePath = `${productName.value}/view${viewNumber}/${fileName}`
    }
    
    // 调用API删除文件
    const response = await fetch('/api/delete-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filePath: filePath
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      // 显示删除成功提示
      showMessage('图片删除成功', 'success')
      
      // 重新加载产品图片
      await loadProductImages()
    } else {
      throw new Error(result.error || `${t('productDetailManagement_deleteImage')}失败`)
    }
  } catch (error) {
    console.error(`${t('productDetailManagement_deleteImage')}失败:`, error)
    showMessage(`${t('productDetailManagement_deleteImage')}失败: ` + error.message, 'error')
  }
}

const handleImageError = (type) => {
  console.log(`${type} 图片加载失败`)
  imageErrors.value.add(`${type}_main`)
}

const handleGridImageError = (folderType, index) => {
  console.log(`${folderType} 中的第 ${index + 1} 张图片加载失败`)
  imageErrors.value.add(`${folderType}_${index}`)
}

const showImagePreview = (imageUrl) => {
  previewImage.value = imageUrl
  showPreviewModal.value = true
}

const closeImagePreview = () => {
  showPreviewModal.value = false
  previewImage.value = ''
}

const editProduct = () => {
  // 使用产品目录数据填充编辑表单
  if (productData.value) {
    editingProduct.value = {
      name: productData.value.name,
      folderName: productData.value.folderName,
      originalName: productData.value.name,
      originalFolderName: productData.value.folderName
    }
  } else {
    // 如果没有产品目录数据，使用默认值
    editingProduct.value = {
      name: productName.value,
      folderName: productName.value,
      originalName: productName.value,
      originalFolderName: productName.value
    }
  }
  showEditProductModal.value = true
}

const updateProduct = async () => {
  if (editNameError.value || !editingProduct.value.name || editFolderNameError.value || !editingProduct.value.folderName) return
  
  try {
    updatingProduct.value = true
    
    // 调用服务器API更新产品信息
    const response = await fetch(`/api/products/${encodeURIComponent(editingProduct.value.originalName)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newProductName: editingProduct.value.name,
        newFolderName: editingProduct.value.folderName
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '更新产品失败')
    }
    
    const result = await response.json()
    
    if (result.success) {
      showMessage('产品信息已更新', 'success')
      
      // 更新当前产品名称
      productName.value = editingProduct.value.name
      
      // 重新加载产品图片
      await loadProductImages()
      
      cancelEdit()
    } else {
      throw new Error(result.error || '更新产品失败')
    }
    
  } catch (err) {
    console.error('更新产品错误:', err)
    showMessage(err.message || '更新产品失败', 'error')
  } finally {
    updatingProduct.value = false
  }
}

const cancelEdit = () => {
  showEditProductModal.value = false
  editingProduct.value = {
    name: '',
    folderName: '',
    originalName: '',
    originalFolderName: ''
  }
}

const goBack = () => {
  router.push('/product-management')
}

// 监听路由参数变化
watch(
  () => route.params.name,
  (newName) => {
    if (newName && newName !== productName.value) {
      productName.value = newName
      loadProductImages()
    }
  }
)

// 生命周期
onMounted(() => {
  productName.value = route.params.name
  loadProductImages()
})
</script>

<style scoped>
.product-detail-management {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-title-section {
  flex: 1;
  min-width: 200px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
  height: 36px;
}

.back-button:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
}

.rename-button {
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
  height: 36px;
}

.rename-button:hover {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: #666;
}

/* 自定义标签页样式 */
.custom-tabs {
  background: transparent;
}

.custom-tabs-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.custom-tab {
  padding: 12px 24px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
  border-bottom: none;
}

.custom-tab:hover {
  color: #1890ff;
  border-color: #d9d9d9;
}

.custom-tab.active {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.custom-tabs-content {
  background: white;
  border-radius: 0 12px 12px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 24px;
}

.tab-content {
  width: 100%;
}

/* 自定义卡片样式 */
.custom-card {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
  overflow: hidden;
}

.card-title {
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.card-content {
  padding: 24px;
}

/* 主图管理区域 */
.main-image-section {
  padding: 16px 0;
}

.image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
}

.image-preview-column {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.upload-column {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 100%;
}

.image-preview {
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  overflow: hidden;
  max-width: 100%;
}

.product-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  color: #d9d9d9;
}

.empty-text {
  font-size: 14px;
  color: #8c8c8c;
}

.upload-section {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.upload-card-main {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  width: 100%;
}

.upload-content {
  padding: 8px 0;
}

/* 网格图片管理区域 */
.grid-image-section {
  padding: 16px 0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  align-items: start;
}

.image-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-container {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}

.grid-image {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 6px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.grid-image:hover {
  transform: scale(1.05);
  opacity: 0.9;
}

.image-card {
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.image-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f0f0f0;
}

.preview-btn {
  color: #1890ff;
}

.delete-btn {
  color: #ff4d4f;
}

/* 网格上传卡片 */
.upload-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-card-grid {
  border: 2px dashed #d9d9d9;
  transition: all 0.3s ease;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 180px;
  padding: 16px;
}

.upload-card-grid:hover {
  border-color: #1890ff;
  background: #f0f8ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
}

.upload-grid-content {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease;
}

.preview-modal {
  max-width: 90%;
  max-height: 90vh;
  width: auto;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #8c8c8c;
  transition: color 0.2s ease;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.modal-close:hover {
  color: #1a1a1a;
  background: #f0f0f0;
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
  background: #fafafa;
}

/* 自定义表单样式 */
.custom-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
  width: 100%;
}

.form-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-error {
  font-size: 12px;
  color: #ff4d4f;
  margin-top: 4px;
}

/* 模态框按钮样式 */
.modal-cancel {
  padding: 8px 16px;
  background: #f0f2f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #4a4a4a;
  transition: all 0.3s ease;
}

.modal-cancel:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.modal-confirm {
  padding: 8px 16px;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.modal-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.modal-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.modal-confirm.loading {
  opacity: 0.8;
  cursor: wait;
}

/* 图片预览样式 */
.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  border-radius: 8px;
}

/* 自定义消息样式 */
.custom-message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  z-index: 2000;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.custom-message.show {
  opacity: 1;
  transform: translateX(0);
}

.custom-message-info {
  background: #1890ff;
}

.custom-message-success {
  background: #52c41a;
}

.custom-message-error {
  background: #ff4d4f;
}

.custom-message-warning {
  background: #faad14;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .product-detail-management {
    padding: 16px;
  }
  
  .page-header {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .header-actions {
    justify-content: flex-start;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .image-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .image-preview-container {
    min-height: 200px;
  }
  
  .product-image {
    max-height: 300px;
  }
  
  .grid-image {
    height: 120px;
  }
  
  .upload-card-grid {
    min-height: 180px;
  }
  
  .custom-tabs-nav {
    gap: 4px;
  }
  
  .custom-tab {
    padding: 10px 16px;
    font-size: 13px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .modal-header,
  .modal-footer {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .product-detail-management {
    padding: 12px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .back-button,
  .rename-button {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .grid-image {
    height: 100px;
  }
  
  .upload-card-grid {
    min-height: 160px;
  }
  
  .image-card {
    margin-bottom: 12px;
  }
  
  .custom-tabs-content {
    padding: 16px;
  }
}
</style>
