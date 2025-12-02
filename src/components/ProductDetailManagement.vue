<template>
  <div class="product-detail-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title-section">
        <h1 class="page-title">{{ t('productDetailManagement_productDetails', { name: productName }) }}</h1>
        
        <div class="action-buttons">
          <Button @click="goBack" variant="text" class="back-button">
            <LucideIcon name="ArrowLeft" size="16" />
            {{ t('productDetailManagement_backToList') }}
          </Button>
          <Button @click="editProduct" variant="primary" class="rename-button">
            <LucideIcon name="Edit" size="16" />
            {{ t('productDetailManagement_editProduct') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 产品图片管理区域 -->
    <div v-if="loading" class="loading-spin">
      <div class="spinner">加载中...</div>
    </div>

    <div v-else class="image-management">
      <!-- 标签页导航 -->
      <div class="tabs-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-button', { 'active': currentTab === tab.key }]"
          @click="currentTab = tab.key"
        >
          <LucideIcon :name="tab.icon" size="16" />
          {{ tab.label }}
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- 主图管理 -->
        <div v-if="currentTab === 'main'" class="main-image-section">
          <div class="image-preview-section">
            <Card v-if="mainImage" class="image-preview-card">
              <img
                :src="mainImage"
                :alt="t('productDetailManagement_mainImage')"
                class="main-image"
                @error="handleImageError('main')"
              />
            </Card>
            <div v-else class="empty-preview">
              <LucideIcon name="Camera" size="48" class="empty-icon" />
              <p>暂无{{ t('productDetailManagement_mainImage') }}</p>
            </div>
          </div>
          
          <div class="upload-section">
            <Card title="上传主图" class="upload-card">
              <div class="upload-content">
                <FileUploader
                  :productName="productName"
                  folderType="main"
                  :onUpload="handleFileUpload"
                  :multiple="false"
                />
              </div>
            </Card>
          </div>
        </div>

        <!-- 六视图管理 -->
        <div v-if="currentTab === 'sixViews'" class="grid-image-section">
          <div class="grid-container">
            <div
              v-for="(image, index) in sixViewsImages"
              :key="index"
              class="grid-item"
            >
              <Card class="image-grid-card">
                <div class="image-container">
                  <img
                    :src="image"
                    :alt="`六视图 ${index + 1}`"
                    class="grid-image"
                    @error="handleGridImageError('sixViews', index)"
                    @click="showImagePreview(image)"
                  />
                </div>
                <div class="image-actions">
                  <Button
                    variant="text"
                    size="small"
                    @click="showImagePreview(image)"
                    :title="t('productDetailManagement_previewImage')"
                  >
                    <LucideIcon name="Eye" size="16" />
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    @click="deleteImage('sixViews', image)"
                    :title="t('productDetailManagement_deleteImage')"
                    class="danger"
                  >
                    <LucideIcon name="Trash2" size="16" />
                  </Button>
                </div>
              </Card>
            </div>
            
            <div class="grid-item">
              <Card class="upload-grid-card">
                <div class="upload-grid-content">
                  <FileUploader
                    :productName="productName"
                    folderType="sixViews"
                    :onUpload="handleFileUpload"
                    :multiple="true"
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>

        <!-- 其他图片管理 -->
        <div v-if="currentTab === 'other'" class="grid-image-section">
          <div class="grid-container">
            <div
              v-for="(image, index) in otherImages"
              :key="index"
              class="grid-item"
            >
              <Card class="image-grid-card">
                <div class="image-container">
                  <img
                    :src="image"
                    :alt="`其他图片 ${index + 1}`"
                    class="grid-image"
                    @error="handleGridImageError('other', index)"
                    @click="showImagePreview(image)"
                  />
                </div>
                <div class="image-actions">
                  <Button
                    variant="text"
                    size="small"
                    @click="showImagePreview(image)"
                    :title="t('productDetailManagement_previewImage')"
                  >
                    <LucideIcon name="Eye" size="16" />
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    @click="deleteImage('other', image)"
                    :title="t('productDetailManagement_deleteImage')"
                    class="danger"
                  >
                    <LucideIcon name="Trash2" size="16" />
                  </Button>
                </div>
              </Card>
            </div>
            
            <div class="grid-item">
              <Card class="upload-grid-card">
                <div class="upload-grid-content">
                  <FileUploader
                    :productName="productName"
                    folderType="other"
                    :onUpload="handleFileUpload"
                    :multiple="true"
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>

        <!-- 视角图片管理 -->
        <div v-if="currentTab.startsWith('view')" class="grid-image-section">
          <div class="grid-container">
            <div
              v-for="(image, index) in viewImages[parseInt(currentTab.replace('view', '')) - 1]"
              :key="index"
              class="grid-item"
            >
              <Card class="image-grid-card">
                <div class="image-container">
                  <img
                    :src="image"
                    :alt="`${currentTab} - 图片 ${index + 1}`"
                    class="grid-image"
                    @error="handleGridImageError(currentTab, index)"
                    @click="showImagePreview(image)"
                  />
                </div>
                <div class="image-actions">
                  <Button
                    variant="text"
                    size="small"
                    @click="showImagePreview(image)"
                    :title="t('productDetailManagement_previewImage')"
                  >
                    <LucideIcon name="Eye" size="16" />
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    @click="deleteImage(currentTab, image)"
                    :title="t('productDetailManagement_deleteImage')"
                    class="danger"
                  >
                    <LucideIcon name="Trash2" size="16" />
                  </Button>
                </div>
              </Card>
            </div>
            
            <div class="grid-item">
              <Card class="upload-grid-card">
                <div class="upload-grid-content">
                  <FileUploader
                    :productName="productName"
                    :folderType="currentTab"
                    :onUpload="handleFileUpload"
                    :multiple="true"
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑产品模态框 -->
    <Modal
      :open="showEditProductModal"
      :title="t('productDetailManagement_editProduct')"
      width="sm:max-w-md"
      @close="cancelEdit"
      @ok="updateProduct"
      :showFooter="true"
    >
      <div class="form-content">
        <div class="form-item">
          <label>{{ t('productDetailManagement_productName') }}</label>
          <Input
            v-model="editingProduct.name"
            :placeholder="`输入新的${t('productDetailManagement_productName')}`"
          />
          <div v-if="editNameError" class="error-text">{{ editNameError }}</div>
        </div>
        
        <div class="form-item">
          <label>{{ t('productDetailManagement_productFolderName') }}</label>
          <Input
            v-model="editingProduct.folderName"
            :placeholder="`输入新的${t('productDetailManagement_productFolderName')}`"
          />
          <div v-if="editFolderNameError" class="error-text">{{ editFolderNameError }}</div>
        </div>
      </div>
      
      <template #footer>
        <Button @click="cancelEdit">
          {{ t('productManagement_cancel') }}
        </Button>
        <Button
          @click="updateProduct"
          variant="primary"
          :loading="updatingProduct"
        >
          {{ t('productManagement_save') }}
        </Button>
      </template>
    </Modal>

    <!-- 图片预览模态框 -->
    <Modal
      :open="showPreviewModal"
      :title="t('productDetailManagement_previewImage')"
      width="80%"
      @close="closeImagePreview"
      :showFooter="false"
    >
      <div class="image-preview-modal">
        <img
          :src="previewImage"
          :alt="t('productDetailManagement_previewImage')"
          class="preview-image"
        />
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import FileUploader from './FileUploader.vue'
import Button from './ui/button.vue'
import Card from './ui/card.vue'
import Input from './ui/input.vue'
import Modal from './ui/modal.vue'
import LucideIcon from './ui/LucideIcon.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// 响应式数据
const productName = ref('')
const mainImage = ref('')
const sixViewsImages = ref([])
const otherImages = ref([])
const viewImages = ref([[], [], [], []])
const currentTab = ref('main')
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

// 标签页配置
const tabs = [
  { key: 'main', label: t('productDetailManagement_mainImage'), icon: 'Image' },
  { key: 'sixViews', label: t('productDetailManagement_sixViews'), icon: 'RotateCcw' },
  { key: 'other', label: t('productDetailManagement_otherImages'), icon: 'Camera' },
  { key: 'view1', label: '视角 1', icon: 'Eye' },
  { key: 'view2', label: '视角 2', icon: 'Eye' },
  { key: 'view3', label: '视角 3', icon: 'Eye' },
  { key: 'view4', label: '视角 4', icon: 'Eye' }
]

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
const loadProductImages = async () => {
  if (!productName.value) return
  
  try {
    loading.value = true
    imageErrors.value.clear()
    
    console.log('开始加载产品图片:', productName.value)
    
    // 重置所有图片数组
    mainImage.value = ''
    sixViewsImages.value = []
    otherImages.value = []
    viewImages.value = [[], [], [], []]
    
    // 模拟数据加载 - 这里应该从实际API获取
    // 在实际项目中，这里应该调用真实的API
    setTimeout(() => {
      mainImage.value = `/uploads/${productName.value}/image_00.webp`
      sixViewsImages.value = [
        `/uploads/${productName.value}/images_6Views/view1.webp`,
        `/uploads/${productName.value}/images_6Views/view2.webp`,
        `/uploads/${productName.value}/images_6Views/view3.webp`
      ]
      otherImages.value = [
        `/uploads/${productName.value}/images_other/other1.webp`,
        `/uploads/${productName.value}/images_other/other2.webp`
      ]
      
      // 模拟视角图片
      for (let i = 0; i < 4; i++) {
        const viewNum = i + 1
        viewImages.value[i] = [
          `/uploads/${productName.value}/view${viewNum}/frame1.webp`,
          `/uploads/${productName.value}/view${viewNum}/frame2.webp`
        ]
      }
      
      loading.value = false
    }, 1000)
    
  } catch (error) {
    console.error('加载产品图片失败:', error)
    loading.value = false
  }
}

const handleFileUpload = (result) => {
  console.log('文件上传结果:', result)
  if (result.success) {
    // 文件上传成功后重新加载图片
    loadProductImages()
  }
}

const deleteImage = async (folderType, imageUrl) => {
  try {
    const confirmed = confirm('确定要删除这张图片吗？此操作不可撤销。')
    if (!confirmed) return
    
    // 从URL中提取文件名
    const fileName = imageUrl.split('/').pop()
    console.log(`删除图片:`, folderType, fileName, imageUrl)
    
    // 模拟删除操作
    setTimeout(() => {
      // 重新加载图片
      loadProductImages()
    }, 500)
    
  } catch (error) {
    console.error('删除图片失败:', error)
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
  editingProduct.value = {
    name: productName.value,
    folderName: productName.value,
    originalName: productName.value,
    originalFolderName: productName.value
  }
  showEditProductModal.value = true
}

const updateProduct = async () => {
  if (editNameError.value || !editingProduct.value.name || 
      editFolderNameError.value || !editingProduct.value.folderName) return
  
  try {
    updatingProduct.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新当前产品名称
    productName.value = editingProduct.value.name
    
    // 关闭模态框
    cancelEdit()
    
    // 重新加载图片
    loadProductImages()
    
  } catch (err) {
    console.error('更新产品错误:', err)
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

.page-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
}

/* 标签页导航 */
.tabs-nav {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  background: white;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow-x: auto;
}

.tab-button {
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #8c8c8c;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-button:hover {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
}

.tab-button.active {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

/* 主图管理 */
.main-image-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
}

.image-preview-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.image-preview-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  width: 100%;
}

.main-image {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
}

.empty-preview {
  text-align: center;
  padding: 40px 0;
}

.empty-icon {
  color: #d9d9d9;
  margin-bottom: 16px;
}

.upload-section {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.upload-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  width: 100%;
}

.upload-content {
  padding: 16px 0;
}

/* 网格图片管理 */
.grid-image-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 24px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.grid-item {
  display: flex;
  flex-direction: column;
}

.image-grid-card {
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.image-grid-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.image-container {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
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

.image-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 上传网格卡片 */
.upload-grid-card {
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

.upload-grid-card:hover {
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
  padding: 16px;
}

/* 模态框内容 */
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

.image-preview-modal {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

/* 加载状态 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  .product-detail-management {
    padding: 16px;
  }
  
  .page-title-section {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .tabs-nav {
    padding: 4px;
  }
  
  .tab-button {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  .main-image-section {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
  
  .grid-image {
    height: 120px;
  }
  
  .upload-grid-card {
    min-height: 160px;
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
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
  
  .tabs-nav {
    gap: 2px;
  }
  
  .tab-button {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .grid-container {
    grid-template-columns: 1fr;
  }
  
  .grid-image {
    height: 100px;
  }
}
</style>
