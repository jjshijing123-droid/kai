<template>
  <div class="product-list">
    <LoadingState 
      :loading="state.isLoading" 
      :text="t('productList_loadingProducts')"
      :show-progress="true"
      :progress="loadingProgress"
    />
    
    <ErrorState
      v-else-if="state.hasError"
      :message="state.error"
      :retry-text="t('productList_retry')"
      @retry="handleRetry"
    />
    
    <EmptyState
      v-else-if="!state.hasData || filteredProducts.length === 0"
      :message="t('productList_noProducts')"
      :show-action="true"
      :action-text="t('productManagement_createFirstFolder')"
      :icon="emptyIcon"
      @action="handleCreateProduct"
    />
    
    <!-- 产品列表 -->
    <div v-else class="product-grid">
      <div 
        v-for="product in paginatedProducts" 
        :key="product.id" 
        class="product-card"
        @click="handleProductClick(product)"
      >
        <div class="product-image-container" :class="{ 'lazy-load': !product.imageLoaded }">
          <img 
            :src="product.mainImage" 
            :alt="product.name"
            class="product-image"
            loading="lazy"
            @load="handleImageLoad(product, $event)"
            @error="handleImageError(product, $event)"
          />
          <div class="image-overlay">
            <div class="product-stats">
              <span class="file-count">{{ product.fileCount }} {{ t('common_files') }}</span>
              <span class="file-size">{{ product.displaySize }}</span>
            </div>
          </div>
        </div>
        <div class="product-info">
          <h3 class="product-name">{{ product.displayName }}</h3>
          <div class="product-meta">
            <span class="product-date">{{ product.displayDate }}</span>
            <a-button 
              type="text" 
              size="small" 
              @click.stop="handleQuickPreview(product)"
              class="preview-btn"
            >
              <EyeOutlined />
            </a-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分页组件 -->
    <div v-if="totalPages > 1" class="pagination-container">
      <a-pagination
        v-model:current="pagination.current"
        v-model:page-size="pagination.pageSize"
        :total="filteredProducts.length"
        :show-size-changer="true"
        :show-quick-jumper="true"
        :show-total="(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`"
        @change="handlePageChange"
        @show-size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import { useDataFetch, useListDataFetch } from '../composables/useDataFetch.js'
import { message } from 'ant-design-vue'

// 导入UI组件
import LoadingState from './ui/LoadingState.vue'
import ErrorState from './ui/ErrorState.vue'
import EmptyState from './ui/EmptyState.vue'

// 导入服务
import productService from '../services/productService.js'

// 图标
import { EyeOutlined } from '@ant-design/icons-vue'

const { t } = useI18n()
const router = useRouter()

// 状态管理
const { 
  state, 
  fetch: fetchProducts, 
  reset: resetState,
  clearError 
} = useListDataFetch()

// 本地状态
const loadingProgress = ref(0)
const searchQuery = ref('')
const selectedCategory = ref('all')
const sortBy = ref('name')
const sortOrder = ref('asc')

// 分页状态
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0
})

// 获取产品数据
const loadProducts = async () => {
  try {
    loadingProgress.value = 30
    
    const result = await productService.getProducts()
    loadingProgress.value = 60
    
    // 处理和格式化产品数据
    const formattedProducts = result.map(product => 
      productService.formatProductData(product)
    )
    
    loadingProgress.value = 100
    
    // 设置数据到状态
    state.data = formattedProducts
    state.loading = false
    
  } catch (error) {
    loadingProgress.value = 0
    throw error
  }
}

// 计算属性
const filteredProducts = computed(() => {
  if (!state.data) return []
  
  let filtered = [...state.data]
  
  // 搜索过滤
  if (searchQuery.value) {
    filtered = productService.searchProducts(filtered, searchQuery.value)
  }
  
  // 分类过滤
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(product => product.category === selectedCategory.value)
  }
  
  // 排序
  filtered = productService.sortProducts(filtered, sortBy.value, sortOrder.value)
  
  return filtered
})

const paginatedProducts = computed(() => {
  const start = (pagination.value.current - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return filteredProducts.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / pagination.value.pageSize)
})

const emptyIcon = computed(() => {
  if (searchQuery.value || selectedCategory.value !== 'all') {
    return '🔍'
  }
  return '📦'
})

// 事件处理
const handleRetry = async () => {
  clearError()
  await loadProducts()
}

const handleProductClick = (product) => {
  console.log('点击了产品:', product.name)
  
  if (product.originalData?.folderName) {
    router.push(`/product/${encodeURIComponent(product.originalData.folderName)}`)
  } else {
    router.push(`/product/${encodeURIComponent(product.name)}`)
  }
}

const handleQuickPreview = (product) => {
  router.push(`/product-3d/${encodeURIComponent(product.name)}`)
}

const handleCreateProduct = () => {
  router.push('/product-management')
}

const handlePageChange = (page, pageSize) => {
  pagination.value.current = page
  pagination.value.pageSize = pageSize
}

const handlePageSizeChange = (current, size) => {
  pagination.value.current = 1
  pagination.value.pageSize = size
}

const handleImageLoad = (product, event) => {
  product.imageLoaded = true
  const container = event.target.parentElement
  container.classList.add('loaded')
}

const handleImageError = (product, event) => {
  product.imageLoaded = true
  const container = event.target.parentElement
  
  event.target.style.display = 'none'
  container.classList.add('image-error')
  
  console.warn(`图片加载失败: ${product.mainImage}`)
}

// 生命周期
onMounted(() => {
  loadProducts()
})

// 导出方法供外部调用
defineExpose({
  refresh: loadProducts,
  search: (query) => searchQuery.value = query,
  filter: (category) => selectedCategory.value = category,
  sort: (field, order) => {
    sortBy.value = field
    sortOrder.value = order
  }
})
</script>

<style scoped>
.product-list {
  width: 100%;
  background: #ffffff;
  padding-top: 20px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 0;
}

.product-card {
  background: #ffffff;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #d9d9d9;
}

.product-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1/1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-card:hover .image-overlay {
  opacity: 1;
}

.product-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-size: 12px;
}

.product-info {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.product-date {
  font-size: 12px;
  color: #8c8c8c;
}

.preview-btn {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-card:hover .preview-btn {
  opacity: 1;
}

/* 分页容器 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin: 32px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    padding: 16px 0;
  }
  
  .product-info {
    padding: 12px;
  }
  
  .product-name {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px 0;
  }
  
  .product-info {
    padding: 10px;
  }
  
  .product-name {
    font-size: 13px;
  }
}
</style>