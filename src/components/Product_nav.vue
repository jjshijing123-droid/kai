<template>
  <div class="containeruser">
    
    <div class="container1">
      <div class="header-container">
        <div class="lazy-load" :class="{ 'loaded': imageLoaded }" id="imageContainer">
          <img
            v-if="folderName && folderName.trim() !== ''"
            :src="productImage"
            :alt="productName"
            class="product-image"
            :class="{ 'loaded': imageLoaded, 'hidden': !imageLoaded }"
            @load="handleImageLoad"
            @error="handleImageError"
          />
          <div v-else class="placeholder-image">
            {{ t('common_placeholderImage') }}
          </div>
        </div>
        <h1 id="folderName">{{ productName }}</h1>
      </div>
      
      <div class="button-container">
        <button
          v-if="productName && productName.trim() !== '' && hasView1Files"
          id="rotateBtn"
          class="btn"
          @click="navigateTo3DViewer"
          :data-i18n="'productDetail_product360'"
        >
          {{ product360Text }}
        </button>
        <button
          v-if="productName && productName.trim() !== '' && hasImages6ViewsFiles"
          id="views6Btn"
          class="btn"
          @click="navigateToImages('6views')"
          :data-i18n="'productDetail_product6Views'"
        >
          {{ product6ViewsText }}
        </button>
        <button
          v-if="productName && productName.trim() !== '' && hasImagesOtherFiles"
          id="otherBtn"
          class="btn"
          @click="navigateToImages('other')"
          :data-i18n="'productDetail_productOther'"
        >
          {{ productOtherText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'

const { t, currentLanguage, toggleLanguage } = useI18n()
const route = useRoute()
const router = useRouter()

const productName = ref('')
const folderName = ref('')
const imageLoaded = ref(false)
const productData = ref(null)

// 文件夹存在性检测
const hasView1Files = ref(false)
const hasImages6ViewsFiles = ref(false)
const hasImagesOtherFiles = ref(false)

// 响应式翻译文本
const product360Text = ref('')
const product6ViewsText = ref('')
const productOtherText = ref('')

// 更新翻译文本
const updateTranslations = () => {
  product360Text.value = t('productDetail_product360')
  product6ViewsText.value = t('productDetail_product6Views')
  productOtherText.value = t('productDetail_productOther')
}

// 监听语言变化
watch(currentLanguage, () => {
  updateTranslations()
})

// 初始化翻译
updateTranslations()

// 导航到3D查看器页面
const navigateTo3DViewer = () => {
  if (productName.value && productName.value.trim() !== '') {
    router.push(`/product-3d/${encodeURIComponent(productName.value)}`)
  }
}

// 导航到图片展示页面
const navigateToImages = (type) => {
  if (productName.value && productName.value.trim() !== '') {
    router.push(`/product-images/${encodeURIComponent(productName.value)}/${type}`)
  }
}

// 根据ID或产品名称获取产品详情
const getProductDetails = async (productIdOrName) => {
  try {
    let productData = null
    
    // 尝试作为ID处理
    if (/^\d+$/.test(productIdOrName)) {
      console.log(`🔍 以ID方式获取产品: ${productIdOrName}`)
      const response = await fetch(`/api/products/${productIdOrName}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.product) {
          productData = result.product
          console.log('✅ 从API获取产品详情成功:', productData)
        }
      }
    }
    
    // 如果ID方式失败，尝试从JSON文件获取
    if (!productData) {
      console.log(`🔍 从JSON文件获取产品: ${productIdOrName}`)
      const response = await fetch('/data/product-catalog.json')
      
      if (response.ok) {
        const data = await response.json()
        const products = data.products || []
        
        // 首先尝试通过ID匹配
        if (/^\d+$/.test(productIdOrName)) {
          productData = products.find(p => p.id === parseInt(productIdOrName))
        }
        
        // 如果没有找到，尝试通过名称匹配
        if (!productData) {
          productData = products.find(p => p.folderName === productIdOrName)
        }
        
        if (productData) {
          console.log('✅ 从JSON文件获取产品详情成功:', productData)
        }
      }
    }
    
    return productData
  } catch (error) {
    console.error('获取产品详情失败:', error)
    return null
  }
}

// 根据产品名称获取文件夹名称
const getFolderName = async (productIdOrName) => {
  const productData = await getProductDetails(productIdOrName)
  if (productData) {
    return productData.folderName || productData.name
  }
  // 降级方案：直接使用参数作为文件夹名称
  return productIdOrName
}

// 检测文件夹中是否存在文件
const checkFolderFiles = async (folderPath) => {
  try {
    // 将整个路径（包括斜杠）作为一个参数进行URL编码
    const encodedPath = encodeURIComponent(folderPath)
    const response = await fetch(`/api/check-folder/${encodedPath}`)
    if (response.ok) {
      const result = await response.json()
      return result.hasFiles || false
    }
    return false
  } catch (error) {
    console.error(`检测文件夹 ${folderPath} 失败:`, error)
    return false
  }
}

// 检查产品相关的文件夹文件
const checkProductFolders = async () => {
  if (!folderName.value || folderName.value.trim() === '') {
    return
  }

  const basePath = `Product/${folderName.value}`

  // 检查各个文件夹
  try {
    const [view1Exists, images6ViewsExists, imagesOtherExists] = await Promise.all([
      checkFolderFiles(`${basePath}/view1`),
      checkFolderFiles(`${basePath}/images_6Views`),
      checkFolderFiles(`${basePath}/images_other`)
    ])

    hasView1Files.value = view1Exists
    hasImages6ViewsFiles.value = images6ViewsExists
    hasImagesOtherFiles.value = imagesOtherExists

    console.log('文件夹检测结果:', {
      view1: view1Exists,
      images_6Views: images6ViewsExists,
      images_other: imagesOtherExists
    })
  } catch (error) {
    console.error('检查产品文件夹失败:', error)
  }
}

const productImage = computed(() => {
  // 优先使用从API获取的主图片
  if (productData.value && productData.value.mainImage) {
    return productData.value.mainImage
  }
  // 降级方案：使用默认路径
  return `/Product/${folderName.value}/image_00.webp`
})

const handleImageLoad = () => {
  imageLoaded.value = true
}

const handleImageError = () => {
  imageLoaded.value = true
  // 如果webp加载失败，尝试png格式
  const imgElement = document.getElementById('productImage')
  if (imgElement) {
    imgElement.src = `/Product/${folderName.value}/image_00.png`
  }
}

onMounted(async () => {
  productName.value = route.params.name
  
  // 添加调试日志
  console.log('Product_nav 初始化:', {
    routeParams: route.params,
    productName: productName.value,
    fullRoute: route.fullPath
  })
  
  // 验证产品名称
  if (!productName.value || productName.value.trim() === '') {
    console.error('Product_nav: 产品名称为空或无效')
    // 可以重定向到首页或显示错误信息
    return
  }
  
  // 设置浏览器标题
  document.title = productName.value
  
  // 获取文件夹名称
  folderName.value = await getFolderName(productName.value)
  
  // 确保 folderName 不为空，如果为空则使用 productName
  if (!folderName.value || folderName.value.trim() === '') {
    folderName.value = productName.value
    console.log('🔧 使用备用 folderName:', folderName.value)
  }
  
  // 只有在有有效folderName时才预加载图片
  if (folderName.value && folderName.value.trim() !== '') {
    // 预加载产品主图片
    const img = new Image()
    img.onload = handleImageLoad
    img.onerror = handleImageError
    img.src = productImage.value
    
    // 检查产品相关文件夹的文件存在性
    await checkProductFolders()
  } else {
    console.log('⚠️ folderName 为空，跳过图片预加载')
    imageLoaded.value = true
  }
})
</script>

<style scoped>

.container1 {
  margin-top: 10%;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.header-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  background-color: var(--neutral-1);
  border: 1px var(--neutral-3) solid ;
  padding: 20px;
  border-radius: 30px;
}

.product-image {
  width: 250px;
  height: 250px;
  object-fit: contain;
  margin-bottom: 10px;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.product-image.loaded {
  opacity: 1;
}

.placeholder-image {
  width: 250px;
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--neutral-2);
  border-radius: 8px;
  color: var(--neutral-11);
  font-size: 14px;
  margin-bottom: 10px;
}

.lazy-load {
  position: relative;
  width: 250px;
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lazy-load::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, var(--neutral-2) 25%, var(--neutral-4) 50%, var(--neutral-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  z-index: 1;
  border-radius: 8px;
}

.lazy-load.loaded::before {
  opacity: 0;
  transition: opacity 0.3s ease;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

h1 {
  color: var(--neutral-12);
  margin: 0;
  font-weight: 800;
  font-size: 1.5rem;
}

.button-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.btn {
  padding: 12px;
  font-size: 1rem;
  color:  var(--anniu-2);
  background-color: var(--anniu-1);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition: background-color 0.2s;
  display: block; /* 默认显示按钮 */
  margin-bottom: 12px;
}

.btn:hover {
  background-color: var(--primary-9);
}

.hidden {
  display: none;
}



@media (min-width: 320px) and (max-width: 480px) {

  
}
</style>
