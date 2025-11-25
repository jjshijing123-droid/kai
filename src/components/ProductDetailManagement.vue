<template>
  <div class="product-detail-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <a-space direction="vertical" :size="16" style="width: 100%">
        <a-row justify="space-between" align="middle">
          <a-col>
            <h1 class="page-title">{{ t('productDetailManagement_productDetails', { name: productName }) }}</h1>
          </a-col>
          <a-col>
            <a-space>
              <a-button @click="goBack" class="back-button">
                <template #icon>
                  <ArrowLeftOutlined />
                </template>
                {{ t('productDetailManagement_backToList') }}
              </a-button>
              <a-button type="primary" @click="editProduct" class="rename-button">
                <template #icon>
                  <EditOutlined />
                </template>
                {{ t('productDetailManagement_editProduct') }}
              </a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-space>
    </div>

    <!-- 加载状态 -->
    <a-spin :spinning="loading" size="large" :tip="t('productDetailManagement_loading')">
    <!-- 产品图片管理区域 -->
    <a-tabs type="card" class="image-management">
      <!-- {{ t('productDetailManagement_mainImage') }}管理 -->
      <a-tab-pane key="main" :tab="t('productDetailManagement_mainImage')">
        <a-card>
          <template #title>
            <span>{{ t('productDetailManagement_mainImage') }} (image_00.webp)</span>
          </template>
          <div class="main-image-section">
            <a-row :gutter="[32, 32]" align="middle">
              <a-col :xs="24" :md="12" :lg="10">
                <div class="image-preview-container">
                  <a-card v-if="mainImage" class="image-preview">
                    <img
                      :src="mainImage"
                      :alt="t('productDetailManagement_mainImage')"
                      class="product-image"
                      @error="handleImageError('main')"
                    />
                  </a-card>
                  <a-empty v-else description="暂无{{ t('productDetailManagement_mainImage') }}" class="empty-state" />
                </div>
              </a-col>
              <a-col :xs="24" :md="12" :lg="14">
                <div class="upload-section">
                  <a-card title="上传{{ t('productDetailManagement_mainImage') }}" class="upload-card-main">
                    <div class="upload-content">
                      <FileUploader
                        :productName="productName"
                        folderType="main"
                        :onUpload="handleFileUpload"
                        :multiple="false"
                      />
                    </div>
                  </a-card>
                </div>
              </a-col>
            </a-row>
          </div>
        </a-card>
      </a-tab-pane>

      <!-- {{ t('productDetailManagement_sixViews') }}管理 -->
      <a-tab-pane key="sixViews" :tab="t('productDetailManagement_sixViews')">
        <a-card>
          <template #title>
            <span>{{ t('productDetailManagement_sixViews') }} (images_6Views/)</span>
          </template>
          <div class="grid-image-section">
            <a-row :gutter="[20, 20]">
              <a-col
                v-for="(image, index) in sixViewsImages"
                :key="index"
                :xs="12"
                :sm="8"
                :md="6"
                :lg="4"
              >
                <a-card class="image-card" :body-style="{ padding: '12px' }">
                  <div class="image-container">
                    <img
                      :src="image"
                      :alt="`${t('productDetailManagement_sixViews')} ${index + 1}`"
                      class="grid-image"
                      @error="handleGridImageError('sixViews', index)"
                      @click="showImagePreview(image)"
                    />
                  </div>
                  <template #actions>
                    <a-space class="image-actions">
                      <a-button
                        type="text"
                        size="small"
                        @click="showImagePreview(image)"
                        :title="t('productDetailManagement_previewImage')"
                      >
                        <EyeOutlined />
                      </a-button>
                      <a-button
                        type="text"
                        danger
                        size="small"
                        @click="deleteImage('sixViews', image)"
                        :title="t('productDetailManagement_deleteImage')"
                      >
                        <DeleteOutlined />
                      </a-button>
                    </a-space>
                  </template>
                </a-card>
              </a-col>
              <a-col :xs="12" :sm="8" :md="6" :lg="4">
                <a-card class="upload-card-grid" :body-style="{ padding: '16px 12px' }">
                  <div class="upload-grid-content">
                    <FileUploader
                      :productName="productName"
                      folderType="sixViews"
                      :onUpload="handleFileUpload"
                      :multiple="true"
                    />
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </div>
        </a-card>
      </a-tab-pane>

      <!-- {{ t('productDetailManagement_otherImages') }}管理 -->
      <a-tab-pane key="other" :tab="t('productDetailManagement_otherImages')">
        <a-card>
          <template #title>
            <span>{{ t('productDetailManagement_otherImages') }} (images_other/)</span>
          </template>
          <div class="grid-image-section">
            <a-row :gutter="[20, 20]">
              <a-col
                v-for="(image, index) in otherImages"
                :key="index"
                :xs="12"
                :sm="8"
                :md="6"
                :lg="4"
              >
                <a-card class="image-card" :body-style="{ padding: '12px' }">
                  <div class="image-container">
                    <img
                      :src="image"
                      :alt="`${t('productDetailManagement_otherImages')} ${index + 1}`"
                      class="grid-image"
                      @error="handleGridImageError('other', index)"
                      @click="showImagePreview(image)"
                    />
                  </div>
                  <template #actions>
                    <a-space class="image-actions">
                      <a-button
                        type="text"
                        size="small"
                        @click="showImagePreview(image)"
                        :title="t('productDetailManagement_previewImage')"
                      >
                        <EyeOutlined />
                      </a-button>
                      <a-button
                        type="text"
                        danger
                        size="small"
                        @click="deleteImage('other', image)"
                        :title="t('productDetailManagement_deleteImage')"
                      >
                        <DeleteOutlined />
                      </a-button>
                    </a-space>
                  </template>
                </a-card>
              </a-col>
              <a-col :xs="12" :sm="8" :md="6" :lg="4">
                <a-card class="upload-card-grid" :body-style="{ padding: '16px 12px' }">
                  <div class="upload-grid-content">
                    <FileUploader
                      :productName="productName"
                      folderType="other"
                      :onUpload="handleFileUpload"
                      :multiple="true"
                    />
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </div>
        </a-card>
      </a-tab-pane>

      <!-- 视角序列帧管理 -->
      <a-tab-pane v-for="view in 4" :key="'view' + view" :tab="`视角 ${view}`">
        <a-card>
          <template #title>
            <span>视角 {{ view }} (view{{ view }}/)</span>
          </template>
          <div class="grid-image-section">
            <a-row :gutter="[20, 20]">
              <a-col
                v-for="(image, index) in viewImages[view - 1]"
                :key="index"
                :xs="12"
                :sm="8"
                :md="6"
                :lg="4"
              >
                <a-card class="image-card" :body-style="{ padding: '12px' }">
                  <div class="image-container">
                    <img
                      :src="image"
                      :alt="`视角 ${view} - 图片 ${index + 1}`"
                      class="grid-image"
                      @error="handleGridImageError('view' + view, index)"
                      @click="showImagePreview(image)"
                    />
                  </div>
                  <template #actions>
                    <a-space class="image-actions">
                      <a-button
                        type="text"
                        size="small"
                        @click="showImagePreview(image)"
                        :title="t('productDetailManagement_previewImage')"
                      >
                        <EyeOutlined />
                      </a-button>
                      <a-button
                        type="text"
                        danger
                        size="small"
                        @click="deleteImage('view' + view, image)"
                        :title="t('productDetailManagement_deleteImage')"
                      >
                        <DeleteOutlined />
                      </a-button>
                    </a-space>
                  </template>
                </a-card>
              </a-col>
              <a-col :xs="12" :sm="8" :md="6" :lg="4">
                <a-card class="upload-card-grid" :body-style="{ padding: '16px 12px' }">
                  <div class="upload-grid-content">
                    <FileUploader
                      :productName="productName"
                      :folderType="'view' + view"
                      :onUpload="handleFileUpload"
                      :multiple="true"
                    />
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </div>
        </a-card>
      </a-tab-pane>
      </a-tabs>
    </a-spin>

    <!-- {{ t('productDetailManagement_editProduct') }}模态框 -->
    <a-modal
      v-model:open="showEditProductModal"
      :title="t('productDetailManagement_editProduct')"
      @cancel="cancelEdit"
      @ok="updateProduct"
      :confirm-loading="updatingProduct"
    >
      <a-form layout="vertical">
        <a-form-item
          :label="t('productDetailManagement_productName')"
          :validate-status="editNameError ? 'error' : ''"
          :help="editNameError"
        >
          <a-input
            v-model:value="editingProduct.name"
            :placeholder="`输入新的${t('productDetailManagement_productName')}`"
            size="large"
          />
        </a-form-item>
        <a-form-item
          :label="t('productDetailManagement_productFolderName')"
          :validate-status="editFolderNameError ? 'error' : ''"
          :help="editFolderNameError"
        >
          <a-input
            v-model:value="editingProduct.folderName"
            :placeholder="`输入新的${t('productDetailManagement_productFolderName')}`"
            size="large"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 图片预览模态框 -->
    <a-modal
      v-model:open="showPreviewModal"
      :footer="null"
      width="80%"
      style="top: 20px;"
      @cancel="closeImagePreview"
    >
      <div style="text-align: center;">
        <img
          :src="previewImage"
          :alt="t('productDetailManagement_previewImage')"
          style="max-width: 100%; max-height: 70vh; object-fit: contain;"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import FileUploader from './FileUploader.vue'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, LoadingOutlined, EyeOutlined } from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'

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
      message.error(t('productDetailManagement_productNotInCatalog'))
      return
    }
    
    // 使用产品目录数据加载图片
    productData.value = product
    await loadImagesFromCatalog(product)
  } catch (error) {
    console.error(t('productDetailManagement_loadImagesFailed'), error)
    message.error(t('productDetailManagement_loadImagesFailed'))
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
    message.success('文件上传成功')
    // 文件上传成功后重新加载图片
    loadProductImages()
  } else {
    message.error('文件上传失败: ' + (result.error || '未知错误'))
  }
}

const deleteImage = async (folderType, imageUrl) => {
  try {
    // 使用 Ant Design 的确认对话框替代原生 confirm
    const confirmed = await new Promise((resolve) => {
      const modal = Modal.confirm({
        title: '确认删除',
        content: '确定要删除这张图片吗？此操作不可撤销。',
        okText: '确定',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false)
      })
    })
    
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
      message.success('图片删除成功')
      
      // 重新加载产品图片
      await loadProductImages()
    } else {
      throw new Error(result.error || `${t('productDetailManagement_deleteImage')}失败`)
    }
  } catch (error) {
    console.error(`${t('productDetailManagement_deleteImage')}失败:`, error)
    message.error(`${t('productDetailManagement_deleteImage')}失败: ` + error.message)
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
      message.success('产品信息已更新')
      
      // 更新当前{{ t('productDetailManagement_productName') }}
      productName.value = editingProduct.value.name
      
      // 重新加载产品图片
      await loadProductImages()
      
      cancelEdit()
    } else {
      throw new Error(result.error || '更新产品失败')
    }
    
  } catch (err) {
    console.error('更新产品错误:', err)
    message.error(err.message || '更新产品失败')
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

.image-management {
  background: transparent;
}

.image-management :deep(.ant-tabs-content) {
  padding-top: 16px;
}

/* {{ t('productDetailManagement_mainImage') }}管理区域 */
.main-image-section {
  padding: 16px 0;
}

.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.image-preview {
  text-align: center;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
}

.product-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
}

.empty-state {
  padding: 40px 0;
}

.upload-section {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.upload-card-main {
  border: none;
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
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  overflow: hidden;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.image-actions {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* 网格上传卡片 */
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

/* 确保上传组件在网格中正确显示 */
.grid-image-section .ant-card {
  height: 100%;
}

.grid-image-section .ant-card-body {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.image-card .ant-card-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.image-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  border-radius: 6px;
  margin-bottom: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .product-detail-management {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .main-image-section .ant-row {
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
}

@media (max-width: 480px) {
  .product-detail-management {
    padding: 12px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .page-title {
    font-size: 18px;
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
}

/* 标签页样式优化 */
.image-management :deep(.ant-tabs-tab) {
  font-weight: 500;
  padding: 12px 24px;
}

.image-management :deep(.ant-tabs-tab-active) {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
  border-radius: 6px 6px 0 0;
}

.image-management :deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: white;
}

.image-management :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.image-management :deep(.ant-tabs-content) {
  background: white;
  border-radius: 0 12px 12px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 24px;
}
</style>
