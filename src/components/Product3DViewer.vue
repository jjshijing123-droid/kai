<template>
  <div class="product-3d-viewer">
    <!-- 新的3D页面Header - 在沉浸模式下隐藏 -->
    <Product3DHeader v-if="!isImmersiveMode" />
    

    <!-- 3D查看器主容器 -->
    <div 
      class="viewer-container"
      ref="viewerContainer"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
      @wheel="handleWheel"
      @click="handleViewerClick"
    >
      <!-- 产品图片 -->
      <img
        v-if="productName && productName.trim() !== '' && currentImageSrc"
        id="product-image"
        ref="productImage"
        :src="currentImageSrc"
        :alt="productName + ' 3D展示'"
        class="product-image"
        :style="{
          transform: `scale(${currentScale})`,
          transformOrigin: 'center center'
        }"
        @click="handleImageClick"
        @mousedown="handleImageMouseDown"
        @touchstart="handleImageTouchStart"
      />
      
      <!-- 加载状态容器 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-text">{{ loadingText }}</div>
        <div class="loading-progress">
          <div class="progress-container">
            <div class="progress-bar" :style="{ width: loadingProgress + '%' }"></div>
          </div>
          <span class="progress-text">{{ loadingProgress }}%</span>
        </div>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <button v-if="showRetry" class="retry-btn" @click="retryLoading">
          {{ t('product3dViewer_retry') }}
        </button>
      </div>
    </div>

    <!-- 控制按钮容器 - 在沉浸模式下隐藏 -->
    <div v-if="!isImmersiveMode" class="controls-container">
      <button class="auto-rotate-btn" @click="toggleAutoRotation">
        {{ isAutoRotating ? t('product3dViewer_stopRotation') : t('product3dViewer_autoRotate') }}
      </button>
    </div>

    <!-- 下载进度容器 -->
    <div v-if="showDownloadProgress" class="download-progress-container">
      <div class="download-progress-content">
        <div class="download-progress-text">{{ downloadProgressText }}</div>
        <div class="download-progress-bar-container">
          <div class="download-progress-bar" :style="{ width: downloadProgress + '%' }"></div>
        </div>
        <div class="download-progress-percent">{{ downloadProgress }}%</div>
      </div>
    </div>

    <!-- 抽屉菜单 -->
    <Drawer
      :isOpen="drawerVisible"
      @close="closeDrawer"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import Product3DHeader from './Product3DHeader.vue'
import Drawer from './Drawer.vue'
const showMessage = (type, text) => {
  const messageDiv = document.createElement('div')
  messageDiv.className = `message-${type}`
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
    padding: 12px 20px;
    border-radius: 10px;
    color: white;
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    max-width: 400px;
    word-wrap: break-word;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    opacity: 0;
  `
  
  if (type === 'warning') {
    messageDiv.style.backgroundColor = 'var(--orange-8)'
  } else if (type === 'error') {
    messageDiv.style.backgroundColor = 'var(--red-9)'
  } else if (type === 'success') {
    messageDiv.style.backgroundColor = 'var(--green-8)'
  } else {
    messageDiv.style.backgroundColor = 'var(--primary-8)'
  }
  
  messageDiv.textContent = text
  document.body.appendChild(messageDiv)
  
  // 入场动画
  setTimeout(() => {
    messageDiv.style.opacity = '1'
    messageDiv.style.transform = 'translateX(-50%) translateY(0)'
  }, 10)
  
  // 3秒后自动移除
  setTimeout(() => {
    messageDiv.style.opacity = '0'
    messageDiv.style.transform = 'translateX(-50%) translateY(-100%)'
    setTimeout(() => {
      if (messageDiv.parentNode) {
        document.body.removeChild(messageDiv)
      }
    }, 300)
  }, 3000)
}

const { t } = useI18n()
const route = useRoute()

// 响应式数据
const productName = ref('')
const currentFrame = ref(0)
const currentViewIndex = ref(0)
const currentScale = ref(1.0)
const isDragging = ref(false)
const isAutoRotating = ref(false)
const isLoading = ref(true)
const isDownloading = ref(false)
const isImmersiveMode = ref(false) // 新增：沉浸模式状态
const showDownloadProgress = ref(false)
const errorMessage = ref('')
const showRetry = ref(false)
const drawerVisible = ref(false)

// 图片相关状态
const imageCache = ref([])
const loadedCount = ref(0)
const failedLoads = ref(0)

// 进度相关
const loadingProgress = ref(0)
const loadingText = ref('')

// 下载相关
const downloadProgress = ref(0)
const downloadProgressText = ref('')

// DOM 引用
const viewerContainer = ref(null)
const productImage = ref(null)

// 配置
const CONFIG = {
  totalFrames: 32,
  views: [
    { name: "view1", path: "", enabled: true },
    { name: "view2", path: "", enabled: true },
    { name: "view3", path: "", enabled: true },
    { name: "view4", path: "", enabled: true }
  ],
  imageExtension: '.webp',
  minHeight: 512,
  wheelStep: 100,
  rotationSpeed: 0.3,
  autoRotateSpeed: 0.07,
  keyFrames: [4],
  initialFrame: 4,
  minScale: 0.5,
  maxScale: 3.0,
  parallelLoads: Math.min(navigator.hardwareConcurrency || 2, 8),
  retryCount: 2,
  retryDelay: 500,
  loadTimeout: 100000,
  databaseApiUrl: '/api/db/products/name'
}

// 计算属性
const currentImageSrc = computed(() => {
  console.log('🔍 currentImageSrc 计算属性被调用')
  console.log('   productName:', productName.value)
  console.log('   currentViewIndex:', currentViewIndex.value)
  console.log('   enabledViews:', enabledViews.value)
  
  // 简化的验证逻辑
  if (!productName.value) {
    console.error('❌ Product3DViewer: productName 为空')
    return ''
  }
  
  if (!enabledViews.value || enabledViews.value.length === 0) {
    console.warn('⚠️ Product3DViewer: enabledViews 为空')
    // 使用默认路径
    const frame = currentFrame.value.toString().padStart(2, '0')
    return `/Product/${productName.value}/view1/image_${frame}${CONFIG.imageExtension}`
  }
  
  const view = enabledViews.value[currentViewIndex.value]
  if (!view) {
    console.warn('⚠️ Product3DViewer: view 未定义，使用默认路径')
    const frame = currentFrame.value.toString().padStart(2, '0')
    return `/Product/${productName.value}/view1/image_${frame}${CONFIG.imageExtension}`
  }
  
  // 使用视图路径，但不做过于严格的验证
  const frame = currentFrame.value.toString().padStart(2, '0')
  const imagePath = `${view.path}image_${frame}${CONFIG.imageExtension}`
  console.log('🖼️ 构建图片路径:', imagePath)
  
  return imagePath
})

const currentViewName = computed(() => {
  return enabledViews.value[currentViewIndex.value]?.name || ''
})

const totalFrames = computed(() => CONFIG.totalFrames)

const enabledViews = computed(() => {
  if (!productName.value || productName.value.trim() === '') {
    console.warn('⚠️ Product3DViewer: productName 为空，视图过滤跳过')
    return []
  }
  return CONFIG.views.filter(view => view.enabled)
})

// 动画相关变量
let autoRotateId = null
let inertiaAnimationId = null
let lastX = 0
let lastY = 0
let velocity = 0
let lastTime = 0
let isHorizontalDrag = false

// 初始化
onMounted(async () => {
  productName.value = route.params.name
  
  // 添加调试日志
  console.log('Product3DViewer 初始化:', {
    routeParams: route.params,
    productName: productName.value,
    fullRoute: route.fullPath
  })
  
  // 验证产品名称
  if (!productName.value || productName.value.trim() === '') {
    console.error('Product3DViewer: 产品名称为空或无效')
    showError(t('product3dViewer_invalidProductName'))
    return
  }
  
  await initializeViewer()
})

onUnmounted(() => {
  cleanup()
})

// 方法
const initializeViewer = async () => {
  try {
    console.log('🔧 初始化3D查看器，产品名称:', productName.value)
    console.log('🔧 完整路由参数:', route.params)
    
    // 验证产品名称
    if (!productName.value || productName.value.trim() === '') {
      console.error('❌ 产品名称为空或无效:', productName.value)
      showError(t('product3dViewer_invalidProductName'))
      return
    }
    
    console.log('✅ 产品名称验证通过:', productName.value)
    
    // 从JSON文件获取产品配置（包含4个旋转视角的路径）
    await fetchProductCatalog()
    
    // 确保所有视图路径都已正确设置
    ensureViewPaths()
    
    // 初始化图片缓存
    initializeImageCache()
    
    // 加载关键帧
    await loadKeyFrames()
    
    // 显示初始帧
    updateFrame(CONFIG.initialFrame)
    
    // 批量加载剩余图片
    await loadRemainingImages()
    
    // 完成初始化
    isLoading.value = false
    initializeEvents()
    
  } catch (error) {
    showError(t('product3dViewer_loadFailed', { message: error.message }))
    console.error('初始化错误:', error)
  }

  // 方法：显示错误
  const showError = (message, showRetryBtn = true) => {
    console.error('Product3DViewer showError:', message)
    errorMessage.value = message
    showRetryButton.value = showRetryBtn
  }
}

// 从数据库获取产品信息
const fetchProductInfo = async () => {
  try {
    console.log('从数据库获取产品信息...')
    const response = await fetch(`${CONFIG.databaseApiUrl}/${encodeURIComponent(productName.value)}`)
    
    if (!response.ok) {
      throw new Error(`获取产品信息失败: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('数据库返回的产品信息:', data)
    
    if (data.success && data.product) {
      // 这里可以处理从数据库获取的产品信息
      // 例如：检查产品是否存在、获取产品图片路径等
      console.log('产品信息获取成功:', data.product.name)
      return data.product
    } else {
      throw new Error('产品不存在或数据格式错误')
    }
  } catch (error) {
    console.error('从数据库获取产品信息失败:', error)
    // 如果数据库API失败，继续使用默认的文件路径
    console.log('使用默认文件路径继续初始化...')
  }
}

// 从JSON文件获取产品配置
const fetchProductCatalog = async () => {
  try {
    console.log('从JSON文件获取产品配置...')
    const response = await fetch('/data/product-catalog.json')
    
    if (!response.ok) {
      throw new Error(`获取产品目录失败: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('JSON文件返回的产品数据:', data)
    
    if (data.products && Array.isArray(data.products)) {
      // 根据产品名称查找产品配置
      const product = data.products.find(p => p.folderName === productName.value)
      
      if (product && product.views) {
        console.log('✅ 找到产品配置:', product)
        
        // 更新CONFIG中的视图路径
        CONFIG.views.forEach((view, index) => {
          if (product.views[view.name]) {
            view.path = product.views[view.name]
            console.log(`   从JSON更新视图路径 ${view.name}: ${view.path}`)
          } else {
            console.warn(`⚠️ JSON中未找到视图 ${view.name}，使用默认路径`)
            view.path = `/Product/${productName.value}/${view.name}/`
          }
        })
        
        console.log('✅ 从JSON文件成功更新所有视图路径')
        return product
      } else {
        console.warn('⚠️ 未在JSON中找到产品配置，使用默认路径')
        updateViewPaths()
        return null
      }
    } else {
      console.warn('⚠️ JSON文件格式不正确，使用默认路径')
      updateViewPaths()
      return null
    }
  } catch (error) {
    console.error('从JSON文件获取产品配置失败:', error)
    console.log('回退到默认路径构建...')
    updateViewPaths()
    return null
  }
}

// 确保路径设置完成的辅助函数
const ensureViewPaths = () => {
  // 检查是否所有视图都有有效的路径
  const allViewsHavePaths = CONFIG.views.every(view =>
    view.path && view.path.startsWith('/Product/') && view.path !== ''
  )
  
  if (!allViewsHavePaths) {
    console.log('🔄 某些视图路径缺失，使用默认路径')
    updateViewPaths()
  } else {
    console.log('✅ 所有视图路径已正确设置')
  }
}

const updateViewPaths = () => {
  if (!productName.value || productName.value.trim() === '') {
    console.error('❌ Product3DViewer: updateViewPaths - productName 为空，跳过路径更新')
    return
  }
  
  console.log('🔄 使用默认路径更新, productName:', productName.value)
  CONFIG.views.forEach((view, index) => {
    const newPath = `/Product/${productName.value}/${view.name}/`
    view.path = newPath
    console.log(`   默认视图路径 ${view.name}: ${newPath}`)
  })
  
  console.log('✅ 默认路径更新完成')
}

const initializeImageCache = () => {
  if (!productName.value || productName.value.trim() === '') {
    console.warn('⚠️ Product3DViewer: initializeImageCache - productName 为空，跳过缓存初始化')
    return
  }
  
  if (!enabledViews.value || enabledViews.value.length === 0) {
    console.warn('⚠️ Product3DViewer: initializeImageCache - 没有有效的视图，跳过缓存初始化')
    return
  }
  
  console.log('🔄 初始化图片缓存，视图数量:', enabledViews.value.length)
  imageCache.value = []
  for (let i = 0; i < enabledViews.value.length; i++) {
    imageCache.value.push([])
  }
  console.log('✅ 图片缓存初始化完成')
}

const loadKeyFrames = async () => {
  for (let viewIndex = 0; viewIndex < enabledViews.value.length; viewIndex++) {
    await batchLoadImages(CONFIG.keyFrames, viewIndex)
  }
}

const loadRemainingImages = async () => {
  const framesToLoad = []
  for (let i = 0; i < CONFIG.totalFrames; i++) {
    if (!CONFIG.keyFrames.includes(i) && !imageCache.value[0][i]) {
      framesToLoad.push(i)
    }
  }
  
  for (let viewIndex = 0; viewIndex < enabledViews.value.length; viewIndex++) {
    await batchLoadImages(framesToLoad, viewIndex)
  }
}

const batchLoadImages = async (frames, viewIndex) => {
  const batchSize = CONFIG.parallelLoads
  for (let i = 0; i < frames.length; i += batchSize) {
    const batch = frames.slice(i, i + batchSize)
    await Promise.all(batch.map(frame => loadImageWithRetry(frame, viewIndex)))
  }
}

const loadImageWithRetry = async (index, viewIndex, retry = 0) => {
  try {
    await loadSingleImage(index, viewIndex)
  } catch (error) {
    if (retry < CONFIG.retryCount) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay))
      return loadImageWithRetry(index, viewIndex, retry + 1)
    } else {
      failedLoads.value++
      throw error
    }
  }
}

const loadSingleImage = (index, viewIndex) => {
  return new Promise((resolve, reject) => {
    // 验证输入参数
    if (!productName.value || productName.value.trim() === '') {
      console.error('❌ Product3DViewer: loadSingleImage - productName 为空')
      reject(new Error(t('product3dViewer_productNameEmpty')))
      return
    }
    
    if (!enabledViews.value[viewIndex]) {
      console.error('❌ Product3DViewer: loadSingleImage - 视图未定义:', viewIndex)
      reject(new Error(t('product3dViewer_viewUndefined')))
      return
    }
    
    const frame = index.toString().padStart(2, '0')
    const view = enabledViews.value[viewIndex]
    const path = view.path
    
    // 验证路径格式
    if (!path || path === '' || path.includes('/product-3d/')) {
      console.error('❌ Product3DViewer: loadSingleImage - 无效的视图路径:', path)
      reject(new Error(t('product3dViewer_invalidViewPath')))
      return
    }
    
    const img = new Image()
    let timer
    
    const cleanup = () => {
      img.onload = null
      img.onerror = null
      clearTimeout(timer)
    }
    
    img.onload = () => {
      cleanup()
      imageCache.value[viewIndex][index] = img
      loadedCount.value++
      updateProgress()
      resolve(true)
    }
    
    img.onerror = () => {
      cleanup()
      console.error(t('product3dViewer_webpLoadFailed'))
      
      // 尝试加载PNG格式
      const pngImg = new Image()
      const pngUrl = `${path}image_${frame}.png`
      console.log(`尝试加载PNG格式: ${pngUrl}`)
      
      pngImg.onload = () => {
        imageCache.value[viewIndex][index] = pngImg
        loadedCount.value++
        updateProgress()
        resolve(true)
      }
      
      pngImg.onerror = () => {
        console.error(t('product3dViewer_pngLoadFailed'))
        reject(new Error(t('product3dViewer_frameLoadFailed', { frame })))
      }
      
      pngImg.src = pngUrl
    }
    
    timer = setTimeout(() => {
      img.src = ''
      reject(new Error(t('product3dViewer_frameLoadTimeout', { frame })))
    }, CONFIG.loadTimeout)
    
    const imageUrl = `${path}image_${frame}${CONFIG.imageExtension}`
    console.log(`正在加载图片: ${imageUrl}`)
    img.src = imageUrl
  })
}

const updateProgress = () => {
  const totalImages = CONFIG.totalFrames * enabledViews.value.length
  const percent = Math.round((loadedCount.value / totalImages) * 100)
  loadingProgress.value = percent
  loadingText.value = t('product3dViewer_loading', { loaded: loadedCount.value, total: totalImages })
}

const updateFrame = (frameInput) => {
  console.log('updateFrame called with frameInput:', frameInput)
  console.log('currentViewIndex.value:', currentViewIndex.value)
  console.log('imageCache.value:', imageCache.value)
  
  const totalFrames = CONFIG.totalFrames
  if (totalFrames <= 0) return
  
  let frame = frameInput % totalFrames
  if (frame < 0) frame += totalFrames
  
  const targetFrame = Math.floor(frame)
  console.log('Calculated targetFrame:', targetFrame)
  
  // 检查当前视角的图片缓存
  const currentViewCache = imageCache.value[currentViewIndex.value]
  console.log('currentViewCache:', currentViewCache)
  
  if (!currentViewCache || currentViewCache.length === 0) {
    console.error('No images cached for current view')
    return
  }
  
  const targetImg = currentViewCache[targetFrame]
  console.log('targetImg:', targetImg)
  if (!targetImg) {
    console.error('Target image not found for frame:', targetFrame)
    return
  }
  
  if (productImage.value && productImage.value.src !== targetImg.src) {
    console.log('Updating image src from', productImage.value.src, 'to', targetImg.src)
    productImage.value.src = targetImg.src
  }
  currentFrame.value = targetFrame
  console.log('currentFrame.value updated to:', currentFrame.value)
}

const switchView = (direction) => {
  if (direction === 'up') {
    if (currentViewIndex.value < enabledViews.value.length - 1) {
      currentViewIndex.value++
    }
  } else if (direction === 'down') {
    if (currentViewIndex.value > 0) {
      currentViewIndex.value--
    }
  }
  
  updateFrame(currentFrame.value)
}

// 事件处理
const handleMouseDown = (e) => {
  if (e.button === 0) {
    e.preventDefault()
    handleMoveStart(e.clientX, e.clientY)
  }
}

const handleTouchStart = (e) => {
  if (e.touches.length === 1) {
    e.preventDefault()
    const touch = e.touches[0]
    handleMoveStart(touch.clientX, touch.clientY)
  }
}

const handleWheel = (e) => {
  e.preventDefault()
  const delta = Math.sign(e.deltaY)
  const maxViewportHeight = window.innerHeight + 100
  let newHeight = viewerContainer.value.offsetHeight + (-delta * CONFIG.wheelStep)
  newHeight = Math.max(CONFIG.minHeight, Math.min(newHeight, maxViewportHeight))
  
  if (newHeight !== viewerContainer.value.offsetHeight) {
    viewerContainer.value.style.height = `${newHeight}px`
    productImage.value.style.maxHeight = `${newHeight}px`
  }
}

const handleMoveStart = (x, y) => {
  if (isLoading.value) return
  
  // 用户开始交互，退出沉浸模式
  if (isImmersiveMode.value) {
    isImmersiveMode.value = false
  }
  
  isDragging.value = true
  lastX = x
  lastY = y
  velocity = 0
  lastTime = performance.now()
  isHorizontalDrag = false
  productImage.value.style.transition = 'none'
  cancelInertiaAnimation()
  stopAutoRotation()
  viewerContainer.value.style.cursor = 'grabbing'
}

const handleMove = (clientX, clientY) => {
  if (!isDragging.value) return
  
  const now = performance.now()
  const deltaTime = now - lastTime
  
  const deltaX = clientX - lastX
  const deltaY = clientY - lastY
  
  // 同时处理水平旋转和垂直视角切换
  if (Math.abs(deltaX) > 0) {
    // 水平拖拽 - 旋转
    if (deltaTime > 0) {
      velocity = -deltaX * CONFIG.rotationSpeed / deltaTime * 16
    }
    updateFrame(currentFrame.value - deltaX * CONFIG.rotationSpeed)
  }
  
  if (Math.abs(deltaY) > 20) {
    // 垂直拖拽 - 切换视角
    const direction = deltaY > 0 ? 'up' : 'down'
    switchView(direction)
    lastY = clientY
  }
  
  lastX = clientX
  lastTime = now
}

const handleMoveEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false
  viewerContainer.value.style.cursor = 'grab'
  
  // 应用惯性效果
  if (Math.abs(velocity) > 0.5) {
    startInertiaAnimation()
  }
}

const startInertiaAnimation = () => {
  let lastFrameTime = performance.now()
  
  const animate = (timestamp) => {
    const deltaTime = timestamp - lastFrameTime
    lastFrameTime = timestamp
    
    // 应用摩擦力
    velocity *= 0.95
    
    if (Math.abs(velocity) > 0.1) {
      updateFrame(currentFrame.value + velocity * (deltaTime / 16))
      inertiaAnimationId = requestAnimationFrame(animate)
    } else {
      cancelInertiaAnimation()
    }
  }
  
  inertiaAnimationId = requestAnimationFrame(animate)
}

const cancelInertiaAnimation = () => {
  if (inertiaAnimationId) {
    cancelAnimationFrame(inertiaAnimationId)
    inertiaAnimationId = null
  }
}

// 自动旋转
const toggleAutoRotation = () => {
  if (isAutoRotating.value) {
    stopAutoRotation()
  } else {
    startAutoRotation()
  }
}

const startAutoRotation = () => {
  console.log('startAutoRotation called')
  
  // 先停止现有的旋转
  stopAutoRotation()
  
  isAutoRotating.value = true
  // 进入沉浸模式，隐藏界面元素
  isImmersiveMode.value = true
  
  // 累积旋转值，确保小数值也能有效工作
  let accumulatedRotation = 0
  
  const rotate = () => {
    if (!isAutoRotating.value) {
      console.log('Auto rotation stopped, exiting animation loop')
      return
    }
    
    console.log('Updating frame in auto rotation')
    accumulatedRotation += CONFIG.autoRotateSpeed
    
    // 当累积值达到或超过1时，才更新帧
    if (Math.abs(accumulatedRotation) >= 1) {
      const framesToUpdate = Math.floor(accumulatedRotation)
      updateFrame(currentFrame.value + framesToUpdate)
      accumulatedRotation -= framesToUpdate
    }
    
    autoRotateId = requestAnimationFrame(rotate)
  }
  
  autoRotateId = requestAnimationFrame(rotate)
  console.log('Auto rotation started, isAutoRotating:', isAutoRotating.value)
}

const stopAutoRotation = () => {
  if (autoRotateId) {
    cancelAnimationFrame(autoRotateId)
    autoRotateId = null
    isAutoRotating.value = false
    // 退出沉浸模式，显示界面元素
    isImmersiveMode.value = false
  }
}


// 下载全部图片功能
const downloadAllImages = async () => {
  if (isLoading.value) {
  showMessage('warning', t('product3dViewer_waitForLoading'))
  return
}

  try {
    isDownloading.value = true
    showDownloadProgress.value = true
    downloadProgress.value = 0
    downloadProgressText.value = t('product3dViewer_preparingDownload')

    // 创建JSZip实例
    const JSZip = await import('jszip')
    const zip = new JSZip.default()

    const totalImages = CONFIG.totalFrames * enabledViews.value.length
    let processedImages = 0
    const downloadPromises = []

    // 为每个视图创建文件夹并添加图片
    for (let viewIndex = 0; viewIndex < enabledViews.value.length; viewIndex++) {
      const view = enabledViews.value[viewIndex]
      const viewFolder = zip.folder(view.name)

      for (let frame = 0; frame < CONFIG.totalFrames; frame++) {
        const img = imageCache.value[viewIndex][frame]
        if (img) {
          const frameStr = frame.toString().padStart(2, '0')
          // 获取原始文件名和扩展名
          const originalFileName = `image_${frameStr}${CONFIG.imageExtension}`
          
          // 使用fetch直接下载原始图片
          const downloadPromise = fetch(img.src)
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${img.src}`)
              }
              return response.blob()
            })
            .then(blob => {
              viewFolder.file(originalFileName, blob)
              processedImages++
              downloadProgress.value = Math.round((processedImages / totalImages) * 100)
              downloadProgressText.value = t('product3dViewer_downloadingImages', {
                processed: processedImages, 
                total: totalImages 
              })
            })
            .catch(error => {
              console.error(`下载图片失败: ${img.src}`, error)
              // 即使某张图片下载失败，也计入已处理数量，以避免进度卡住
              processedImages++
              downloadProgress.value = Math.round((processedImages / totalImages) * 100)
              // 可以选择在这里记录失败的图片，以便后续报告
            })
          
          downloadPromises.push(downloadPromise)
        } else {
          // 如果图片未加载，也计入总数，但跳过下载
          processedImages++
          downloadProgress.value = Math.round((processedImages / totalImages) * 100)
        }
      }
    }

    // 等待所有图片下载完成
    await Promise.all(downloadPromises)

    // 当所有图片处理完成时，生成并下载zip文件
    if (processedImages === totalImages || downloadPromises.length === 0) { // 确保所有图片都已处理（无论成功与否）
      zip.generateAsync({ type: 'blob' }).then((content) => {
        const url = URL.createObjectURL(content)
        const a = document.createElement('a')
        a.href = url
        a.download = `${productName.value}_images.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        isDownloading.value = false
        showDownloadProgress.value = false
        downloadProgressText.value = t('product3dViewer_downloadComplete')
      }).catch(error => {
        console.error('生成ZIP文件失败:', error)
        showMessage('error', t('product3dViewer_zipGenerateFailed'))
        isDownloading.value = false
        showDownloadProgress.value = false
      })
    }
  } catch (error) {
    console.error('下载失败:', error)
    showMessage('error', t('product3dViewer_downloadFailed'))
    isDownloading.value = false
    showDownloadProgress.value = false
  }
}

// 错误处理
const showError = (message, showRetryBtn = true) => {
  errorMessage.value = message
  showRetry.value = showRetryBtn
}

const retryLoading = () => {
  errorMessage.value = ''
  showRetry.value = false
  loadedCount.value = 0
  failedLoads.value = 0
  loadingProgress.value = 0
  loadingText.value = t('product3dViewer_detectingImages')
  initializeViewer()
}

const initializeEvents = () => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
  
  // 添加键盘控制
  document.addEventListener('keydown', handleKeyDown)
  
  // 监听抽屉切换事件
  document.addEventListener('toggle-3d-drawer', handleDrawerToggle)
  
  // 监听下载事件
  document.addEventListener('download-all-images', handleDownloadAllImages)
}

const handleMouseMove = (e) => {
  if (isDragging.value && e.buttons === 1) {
    e.preventDefault()
    handleMove(e.clientX, e.clientY)
  }
}

const handleMouseUp = (e) => {
  if (e.button === 0) handleMoveEnd()
}

const handleTouchMove = (e) => {
  if (isDragging.value && e.touches.length === 1) {
    e.preventDefault()
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }
}

const handleTouchEnd = (e) => {
  if (e.touches.length === 0) {
    handleMoveEnd()
  }
}

// 新增：处理查看器点击事件
const handleViewerClick = (e) => {
  // 如果在沉浸模式下，点击查看器空白区域也退出沉浸模式
  if (isImmersiveMode.value && e.target === viewerContainer.value) {
    isImmersiveMode.value = false
  }
}

// 新增：处理图片点击事件
const handleImageClick = (e) => {
  e.stopPropagation()
  // 点击图片时退出沉浸模式
  if (isImmersiveMode.value) {
    isImmersiveMode.value = false
  }
}

// 新增：处理图片鼠标按下事件
const handleImageMouseDown = (e) => {
  e.stopPropagation()
  handleMouseDown(e)
}

// 新增：处理图片触摸开始事件
const handleImageTouchStart = (e) => {
  e.stopPropagation()
  handleTouchStart(e)
}

// 新增：处理键盘事件以退出沉浸模式
const handleKeyDown = (e) => {
  if (isLoading.value) return
  
  // 在沉浸模式下，任何按键都退出沉浸模式
  if (isImmersiveMode.value) {
    isImmersiveMode.value = false
    return
  }
  
  if (e.key === 'ArrowLeft') {
    updateFrame(currentFrame.value - 1)
  } else if (e.key === 'ArrowRight') {
    updateFrame(currentFrame.value + 1)
  } else if (e.key === 'ArrowUp') {
    switchView('up')
  } else if (e.key === 'ArrowDown') {
    switchView('down')
  } else if (e.key === 'Escape') {
    // ESC键也用于退出沉浸模式
    if (isImmersiveMode.value) {
      isImmersiveMode.value = false
    }
  }
}

// 抽屉控制方法
const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
}

const closeDrawer = () => {
  drawerVisible.value = false
}

// 处理抽屉切换事件
const handleDrawerToggle = () => {
  toggleDrawer()
}

// 处理下载事件
const handleDownloadAllImages = () => {
  downloadAllImages()
}

const cleanup = () => {
  stopAutoRotation()
  cancelInertiaAnimation()
  
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('toggle-3d-drawer', handleDrawerToggle)
  document.removeEventListener('download-all-images', handleDownloadAllImages)
}
</script>

<style scoped>
.product-3d-viewer {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  transition: all 0.3s ease;
}

/* 沉浸模式样式 */
.product-3d-viewer.immersive-mode {
  background: #000;
}

.product-3d-viewer.immersive-mode .viewer-container {
  height: 100vh !important;
  border-radius: 0;
}

.product-3d-viewer.immersive-mode .product-image {
  max-width: 100vw;
  max-height: 100vh;
}

.top-controls {
  position: absolute;
  top: 80px; /* 避免与Header重叠 */
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 100;
}


.viewer-container {
  position: relative;
  width: 100%;
  height: 95vh;
  border-radius: 8px;
  touch-action: pan-x pan-y pinch-zoom;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: var(--neutral-1);
  border-radius: 8px;
  padding: 25px 20px;
  width: 280px;
}

.loading-text {
  width: 100%;
  word-break: break-word;
  text-align: center;            
  color: var(--neutral-12);
  font-size: 1.2em;
  margin-bottom: 15px;
}

.loading-progress {
  width: 100%;
  margin: 0 auto;
}

.progress-container {
  height: 4px;
  background: var(--neutral-2);
  margin-bottom: 10px;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--primary-9);
  transition: width 0.3s;
}

.progress-text {
  font-size: 14px;
  color: var(--neutral-12);
}

.error-message {
  color: var(--red-9);
  font-size: 14px;
  margin-top: 10px;
}

.retry-btn {
  margin-top: 10px;
  padding: 6px 12px;
  background: var(--primary-9);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.controls-container {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 10;
}



.auto-rotate-btn {
  padding: 8px 20px;
  background: rgba(0, 0, 0, 0);
  color: var(--neutral-12);
  border: 1px solid var(--neutral-opacity-6);
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.auto-rotate-btn:hover {
  background: var(--neutral-opacity-6);
}

.download-progress-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.download-progress-content {
  background: white;
  padding: 25px;
  border-radius: 8px;
  width: 320px;
  text-align: center;
}

.download-progress-text {
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.download-progress-bar-container {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  margin-bottom: 10px;
  overflow: hidden;
}

.download-progress-bar {
  height: 100%;
  background: var(--primary-9);
  transition: width 0.3s;
}

.download-progress-percent {
  font-size: 14px;
  color: var(--neutral-11);
}


@media (max-width: 768px) {
  .viewer-container {
    height: 100vh !important;
  }
  
  .controls-container {
    bottom: 10px;
  }
  
  .frame-indicator,
  .auto-rotate-btn,
  .view-indicator {
    font-size: 12px;
    padding: 4px 12px;
  }
  
  .loading-text {
    font-size: 1em;
  }
  
  .top-controls {
    top: 10px;
    right: 10px;
  }
  
  
  .download-progress-content {
    width: 280px;
    padding: 20px;
  }
}
</style>
