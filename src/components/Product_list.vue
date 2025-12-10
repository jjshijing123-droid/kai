<template>
  <div class="containeruser">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ t('productList_loadingProducts') }}</p>
      <div class="loading-progress" v-if="loadingProgress > 0">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
        </div>
        <span>{{ loadingProgress }}%</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <LucideIcon name="AlertTriangle" size="48" class="error-icon" />
      <p>{{ error }}</p>
      <button @click="loadProducts" class="retry-button">{{ t('productList_retry') }}</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="products.length === 0" class="empty-container">
      <LucideIcon name="Package" size="64" class="empty-icon" />
      <p>{{ t('productList_noProducts') }}</p>
    </div>

    <!-- 产品列表 -->
    <div v-else class="product-grid">
      <div 
        v-for="product in products" 
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
          <div class="ditu" :class="{ 'show': product.imageLoaded }"></div>
        </div>
        <div class="product-info" :class="{ 'show': product.imageLoaded }">
          <h3 class="product-name">{{ product.name }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import LucideIcon from './ui/LucideIcon.vue'

const { t } = useI18n()
const router = useRouter()

// 响应式状态
const products = ref([])
const loading = ref(true)
const error = ref(null)
const loadingProgress = ref(0)

// 配置常量
const API_CONFIG = {
  PRODUCT_CATALOG_URL: '/data/product-catalog.json',
  DATABASE_API_URL: '/api/db/products',
  DEFAULT_IMAGE: '../images/Logo.png',
  PRELOAD_DELAY: 100
}

// 图片预加载队列
const preloadQueue = ref([])
const preloadIndex = ref(0)



/**
 * 从产品目录JSON文件获取产品数据
 */
const fetchProductDataFromCatalog = async () => {
  try {
    const response = await fetch(API_CONFIG.PRODUCT_CATALOG_URL)
    
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status} - ${response.statusText}`)
    }
    
    return await response.json()
    
  } catch (error) {
    throw error
  }
}

/**
 * 从数据库API获取产品数据
 */
const fetchProductDataFromDatabase = async () => {
  try {
    const response = await fetch(API_CONFIG.DATABASE_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status} - ${response.statusText}`)
    }
    
    return await response.json()
    
  } catch (error) {
    throw error
  }
}

/**
 * 处理产品目录JSON数据
 */
const processCatalogData = (rawData) => {
  const processedProducts = []
  
  // 处理产品目录API返回的数据结构
  const products = rawData.products || rawData
  
  for (const product of products) {
    // 只需要基本的字段检查
    if (!product.folderName || product.folderName.trim() === '') {
      continue
    }
    
    // 从产品目录数据中提取主图片
    let mainImage = product.mainImage || API_CONFIG.DEFAULT_IMAGE
    
    processedProducts.push({
      id: product.id || Date.now(),
      name: product.folderName,
      model: product.folderName,
      mainImage: mainImage,
      imageLoaded: false,
      category: 'product',
      description: `Product folder: ${product.folderName}`,
      originalData: product
    })
  }
  
  return processedProducts.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * 处理产品数据
 */
const processProductData = (rawData) => {
  const processedProducts = []
  
  // 处理数据库API返回的数据结构
  const products = rawData.products || rawData
  
  for (const product of products) {
    // 验证数据完整性 - 优先使用folderName，如果没有则回退到name
    const displayName = product.folderName || product.name
    if (!displayName || displayName.trim() === '') {
      continue
    }
    
    // 从数据库产品数据中提取主图片
    let mainImage = product.mainImage
    if (!mainImage && product.images) {
      // 从产品图片中查找主图片
      const mainImageObj = product.images.find(img => img.image_type === 'main')
      if (mainImageObj) {
        mainImage = mainImageObj.image_path
      } else if (product.images.length > 0) {
        // 如果没有主图片，使用第一张图片
        mainImage = product.images[0].image_path
      }
    }
    
    // 如果没有图片，使用默认图片
    if (!mainImage) {
      mainImage = API_CONFIG.DEFAULT_IMAGE
    }
    
    processedProducts.push({
      id: product.id || Date.now(),
      name: displayName,
      mainImage: mainImage,
      imageLoaded: false,
      category: product.category || 'product',
      description: product.folderName ? `Product folder: ${product.folderName}` : product.description || ''
    })
  }
  
  return processedProducts.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * 加载产品列表 - 优先使用产品目录JSON文件
 */
const loadProducts = async () => {
  try {
    loading.value = true
    error.value = null
    loadingProgress.value = 30
    
    // 优先尝试从产品目录JSON文件获取数据
    try {
      const catalogData = await fetchProductDataFromCatalog()
      loadingProgress.value = 60
      
      // 处理产品目录数据
      const processedProducts = processCatalogData(catalogData)
      loadingProgress.value = 80
      
      // 更新产品列表
      products.value = processedProducts
      loadingProgress.value = 100
      
      // 开始图片预加载
      if (processedProducts.length > 0) {
        startImagePreload(processedProducts)
      }
      
      loading.value = false
      return
      
    } catch (catalogError) {
      // 如果产品目录文件读取失败，尝试数据库API
      loadingProgress.value = 40
      
      const rawData = await fetchProductDataFromDatabase()
      loadingProgress.value = 60
      
      // 获取产品数据并处理
      const processedProducts = processProductData(rawData)
      loadingProgress.value = 80
      
      // 更新产品列表
      products.value = processedProducts
      loadingProgress.value = 100
      
      // 开始图片预加载
      if (processedProducts.length > 0) {
        startImagePreload(processedProducts)
      }
      
      loading.value = false
    }
    
  } catch (err) {
    error.value = err.message
    loading.value = false
  }
}

/**
 * 图片预加载
 */
const startImagePreload = (productData) => {
  preloadQueue.value = [...productData]
  preloadIndex.value = 0
  preloadNextImage()
}

const preloadNextImage = () => {
  if (preloadIndex.value >= preloadQueue.value.length) return
  
  const product = preloadQueue.value[preloadIndex.value]
  const img = new Image()
  
  img.onload = () => {
    product.imageLoaded = true
    preloadIndex.value++
    
    // 延迟加载下一个图片，避免阻塞
    if (preloadIndex.value < preloadQueue.value.length) {
      setTimeout(preloadNextImage, API_CONFIG.PRELOAD_DELAY)
    }
  }
  
  img.onerror = () => {
    preloadIndex.value++
    if (preloadIndex.value < preloadQueue.value.length) {
      setTimeout(preloadNextImage, API_CONFIG.PRELOAD_DELAY)
    }
  }
  
  img.src = product.mainImage
}

/**
 * 事件处理函数
 */
const handleProductClick = (product) => {
  // 导航到产品详情页，传递产品文件夹名称
  if (product.originalData && product.originalData.folderName) {
    router.push(`/product/${encodeURIComponent(product.originalData.folderName)}`)
  } else {
    router.push(`/product/${encodeURIComponent(product.name)}`)
  }
}

const handleImageLoad = (product, event) => {
  product.imageLoaded = true
  const container = event.target.parentElement
  container.classList.add('loaded')
}

const handleImageError = (product, event) => {
  product.imageLoaded = true
  const container = event.target.parentElement
  
  // 图片加载失败时，隐藏图片并显示错误状态
  event.target.style.display = 'none'
  container.classList.add('image-error')
}

/**
 * 生命周期
 */
onMounted(() => {
  loadProducts()
  
  // 监听语言变化
  const unsubscribe = useI18n().addListener(() => {
    loadProducts()
  })
  
  // 清理监听器
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })
})
</script>

<style scoped>


/* ===== 加载状态样式 ===== */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4a90e2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  color: #666;
  font-size: 16px;
  margin: 0 0 20px 0;
}

.loading-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 200px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4a90e2;
  transition: width 0.3s ease;
  border-radius: 3px;
}

.loading-progress span {
  font-size: 12px;
  color: #666;
}

/* ===== 错误状态样式 ===== */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.error-icon {
  margin-bottom: 16px;
  color: #ff4d4f;
}

.error-container p {
  color: #e74c3c;
  font-size: 16px;
  margin-bottom: 20px;
  max-width: 400px;
  line-height: 1.5;
}

.retry-button {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background-color: #357abd;
}

/* ===== 空状态样式 ===== */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 20px;
  color: #8c8c8c;
  opacity: 0.6;
}

.empty-container p {
  color: #666;
  font-size: 16px;
  margin: 0;
  line-height: 1.5;
}

/* ===== 产品网格布局 ===== */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  /* grid-template-columns: repeat(5, 1fr); */
  gap: 12px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 0;
}

/* ===== 产品卡片样式 ===== */
.product-card {
  border-radius: 32px;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.product-card:hover {
  transform: translateY(-5px);
}

/* ===== 地图区域样式 ===== */
.ditu {
  position: absolute;
  bottom: 0px;
  left: 50%;
  width: 97%;
  height: 75%;
  background-color: var(--neutral-3);
  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 0;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.ditu.show {
  opacity: 1;
}

/* ===== 产品图片容器 ===== */
.product-image-container {
  width: 100%;
  aspect-ratio: 1/1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1;
  transform: scale(1.1);
  transform-origin: center center;
}

/* ===== 懒加载样式 ===== */
.lazy-load {
  position: relative;
}

.lazy-load::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, #f5f5f5 25%, #e8e8e8 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  z-index: 10; /* 提高层级确保覆盖整个容器 */
  border-radius: 8px; /* 匹配容器圆角 */
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.lazy-load.loaded::before {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-load img {
  opacity: 0;
  transition: opacity 0.5s ease;
}

.lazy-load.loaded img {
  opacity: 1;
}

/* 确保产品卡片容器有正确的层级 */
.product-card {
  position: relative;
}

.product-image-container {
  position: relative;
  overflow: hidden;
}

/* ===== 无图片状态样式 ===== */
.no-image {
  color: #868e96;
  font-size: 13px;
  text-align: center;
  padding: 15px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.no-image small {
  display: block;
  font-size: 11px;
  margin-top: 5px;
  opacity: 0.7;
}

/* ===== 图片错误状态样式 ===== */
.product-image-container.image-error::before {
  content: '图片加载失败';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 12px;
  text-align: center;
  z-index: 5;
}

/* ===== 产品信息样式 ===== */
.product-info {
  position: absolute;
  bottom: -3px;
  left: -3px;
  padding: 5px 0;
  text-align: center;
  flex-grow: 1;
  display: flex;
  border-radius: 8px;
  flex-direction: column;
  justify-content: center;
  background-color: #626262;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-info.show {
  opacity: 1;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0px 16px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px){
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .product-name {
    font-size: 14px;
    margin: 0px 13px;
  }

  .ditu {
    border-radius: 28px;
  }
}


</style>
