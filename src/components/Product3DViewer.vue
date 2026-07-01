<template>
  <div class="product-3d-viewer" :class="{ 'immersive-mode': isImmersiveMode }">
    <!-- 新的3D页面Header - 在沉浸模式下隐藏 -->
  <Product3DHeader v-if="!isImmersiveMode && !isAutoRotating" :visible="allImagesLoaded" />
  
    <!-- 3D查看器主容器 -->
    <div 
      class="viewer-container"
      ref="viewerContainer"
      @mousedown="handleMouseDown"
      @touchstart.passive="handleTouchStart"
      @wheel.passive="handleWheel"
      @click="handleViewerClick"
    >
      <!-- 产品图片容器 -->
      <div class="product-images-container" ref="imagesContainer">
        <!-- 主显示图片 -->
        <img
          v-if="productName && productName.trim() !== ''"
          id="product-image"
          ref="productImage"
          :src="currentImageSrc || ''"
          :alt="productName + ' 3D展示'"
          class="product-image"
          :style="{
            transform: `scale(${currentScale})`,
            transformOrigin: 'center center'
          }"
          @click="handleImageClick"
          @mousedown="handleImageMouseDown"
          @touchstart.passive="handleImageTouchStart"
        />
        <!-- 隐藏的预加载图片容器 -->
        <div class="preloaded-images" ref="preloadedImages"></div>
      </div>
      
      <!-- 加载状态容器 -->
      <div v-if="isLoading" class="loading-container">
        <LoadingState 
          :loading="isLoading"
          :text="loadingText"
          :show-progress="true"
          :progress="loadingProgress"
        />
        <div v-if="showRetry" class="retry-container">
          <Button 
            variant="fill" 
            size="32" 
            @click="retryLoading"
          >
            {{ t('product3dViewer_retry') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 控制按钮容器 - 在沉浸模式下隐藏 -->
    <div v-if="!isImmersiveMode && allImagesLoaded && !isAutoRotating" class="controls-container">
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import apiService from '../services/apiService.js'
import Product3DHeader from './Product3DHeader.vue'
import Drawer from './Drawer.vue'
import LoadingState from './ui/LoadingState.vue'
import Button from './ui/button.vue'
import { showToast } from '../lib/toast.js'
import { throttle } from '../utils/responsive.js'

const showMessage = showToast

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

// 性能监控数据
const fps = ref(60)
const frameTime = ref(0)
const isPerformanceMonitoring = ref(false)

// 图片相关状态
const imageCache = ref([])
const loadedCount = ref(0)
const failedLoads = ref(0)
const totalImages = ref(0) // 新增：固定的总图片数量

// 进度相关
const loadingProgress = ref(0)
const loadingText = ref('')

// 下载相关
const downloadProgress = ref(0)
const downloadProgressText = ref('')

// DOM 引用
const viewerContainer = ref(null)
const productImage = ref(null)
const imagesContainer = ref(null)
const preloadedImages = ref(null)

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
  // 简化的验证逻辑
  if (!productName.value || productName.value.trim() === '') {
    console.error('❌ Product3DViewer: productName 为空或无效')
    return ''
  }
  
  if (!enabledViews.value || enabledViews.value.length === 0) {
    // 使用默认路径
    const frame = currentFrame.value.toString().padStart(2, '0')
    const url = `/Product/${productName.value}/view1/image_${frame}${CONFIG.imageExtension}`
    console.debug('📸 生成默认图片URL:', url)
    return url
  }
  
  const view = enabledViews.value[currentViewIndex.value]
  if (!view) {
    // 使用默认路径
    const frame = currentFrame.value.toString().padStart(2, '0')
    const url = `/Product/${productName.value}/view1/image_${frame}${CONFIG.imageExtension}`
    console.debug('📸 生成默认图片URL:', url)
    return url
  }
  
  // 使用视图路径，并添加严格的验证
  const frame = currentFrame.value.toString().padStart(2, '0')
  
  // 验证并修复视图路径
  let basePath = view.path
  if (!basePath || basePath.trim() === '' || !basePath.startsWith('/Product/')) {
    // 路径无效，使用默认路径
    basePath = `/Product/${productName.value}/${view.name}/`
    console.debug('⚠️ 视图路径无效，使用默认路径:', basePath)
  } else if (!basePath.endsWith('/')) {
    // 确保路径以斜杠结尾
    basePath += '/'
    console.debug('📌 路径缺少斜杠，自动添加:', basePath)
  }
  
  const imagePath = `${basePath}image_${frame}${CONFIG.imageExtension}`
  console.debug('📸 生成图片URL:', imagePath)
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
  const views = CONFIG.views.filter(view => view.enabled)
  return views
})

// 添加计算属性，判断是否所有图片都已加载完成
const allImagesLoaded = computed(() => {
  return loadedCount.value === totalImages.value && loadedCount.value > 0
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
  
  // 设置浏览器标题为当前产品名称
  document.title = productName.value
  
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

// 监听产品名称变化，更新浏览器标题
watch(productName, (newName) => {
  if (newName && newName.trim() !== '') {
    document.title = newName
  }
})

// 方法
const initializeViewer = async () => {
  try {
    console.log('🔧 初始化3D查看器，产品名称:', productName.value)
    console.log('🔧 完整路由参数:', route.params)
    
    // 验证产品名称
    if (!productName.value || productName.value.trim() === '') {
      const errorDetails = `产品名称: ${productName.value}`
      showError(t('product3dViewer_invalidProductName'), true, errorDetails)
      return
    }
    
    console.log('✅ 产品名称验证通过:', productName.value)
    
    // 从API获取产品配置（包含4个旋转视角的路径）
    await fetchProductCatalog()
    
    // 确保所有视图路径都已正确设置
    ensureViewPaths()
    
    // 初始化图片缓存
    initializeImageCache()
    
    // 设置固定的总图片数量
    totalImages.value = CONFIG.totalFrames * enabledViews.value.length
    console.log('📊 总图片数量:', totalImages.value)
    
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

// 从API获取产品配置（带重试机制）
const fetchProductCatalog = async (retryCount = 0) => {
  try {
    console.log('从API获取产品配置... (重试次数: ' + retryCount + ')')
    
    // 先尝试获取单个产品的详细信息
    const productData = await apiService.getProductByName(productName.value)
    console.log('API返回的产品数据:', productData)
    
    if (productData && productData.success && productData.product) {
      const product = productData.product
      console.log('✅ 找到产品配置:', product)
      
      // 更新CONFIG中的视图路径
      CONFIG.views.forEach((view, index) => {
        if (product.views && product.views[view.name]) {
          view.path = product.views[view.name]
          console.log(`   从API更新视图路径 ${view.name}: ${view.path}`)
        } else {
          console.warn(`⚠️ API中未找到视图 ${view.name}，使用默认路径`)
          view.path = `/Product/${productName.value}/${view.name}/`
        }
      })
      
      console.log('✅ 从API成功更新所有视图路径')
      return product
    } else {
      console.warn('⚠️ 未在API中找到产品配置，使用默认路径')
      updateViewPaths()
      return null
    }
  } catch (error) {
    console.error('从API获取产品配置失败:', error)
    
    // 如果重试次数未达到上限，进行重试
    if (retryCount < CONFIG.retryCount) {
      console.log(`⏳ 重试获取产品配置，等待 ${CONFIG.retryDelay}ms...`)
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay))
      return fetchProductCatalog(retryCount + 1)
    }
    
    // 重试次数达到上限，回退到默认路径
    console.log('❌ 所有重试都失败，回退到默认路径构建...')
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
  
  const enabledViewsCount = enabledViews.value.length
  if (enabledViewsCount === 0) {
    console.warn('⚠️ Product3DViewer: initializeImageCache - 没有有效的视图，跳过缓存初始化')
    return
  }
  
  console.log('🔄 初始化图片缓存，视图数量:', enabledViewsCount, '总帧数:', CONFIG.totalFrames)
  
  // 检查缓存是否需要初始化或重新初始化
  const needsInitialization = !imageCache.value || 
    imageCache.value.length !== enabledViewsCount || 
    imageCache.value.some(viewCache => !viewCache || viewCache.length !== CONFIG.totalFrames)
  
  if (needsInitialization) {
    // 重新初始化缓存结构
    imageCache.value = Array(enabledViewsCount).fill(null).map(() => Array(CONFIG.totalFrames).fill(null))
    console.log('✅ 图片缓存重新初始化完成，结构:', imageCache.value.length, 'x', CONFIG.totalFrames)
  } else {
    console.log('✅ 图片缓存已存在且结构正确')
  }

}
const loadKeyFrames = async () => {
  for (let viewIndex = 0; viewIndex < enabledViews.value.length; viewIndex++) {
    await batchLoadImages(CONFIG.keyFrames, viewIndex)
  }
}


const loadRemainingImages = async () => {
  console.log('📦 开始加载剩余图片...')
  
  for (let viewIndex = 0; viewIndex < enabledViews.value.length; viewIndex++) {
    // 为每个视图单独检查需要加载的帧
    const framesToLoad = []
    for (let i = 0; i < CONFIG.totalFrames; i++) {
      if (!CONFIG.keyFrames.includes(i)) {
        // 检查当前视图是否需要加载这张图片
        const needsLoading = !imageCache.value[viewIndex] || !imageCache.value[viewIndex][i]
        if (needsLoading) {
          framesToLoad.push(i)
        }
      }
    }
    console.log(`   视图 ${viewIndex} 需要加载 ${framesToLoad.length} 帧`)
    if (framesToLoad.length > 0) {
      await batchLoadImages(framesToLoad, viewIndex)
    }
  }
  
  console.log('📦 剩余图片加载完成')

}

const batchLoadImages = async (frames, viewIndex) => {
  const batchSize = CONFIG.parallelLoads
  console.log(`   批量加载图片：视图 ${viewIndex}，总帧数 ${frames.length}，批次大小 ${batchSize}`)
  
  for (let i = 0; i < frames.length; i += batchSize) {
    const batch = frames.slice(i, i + batchSize)
    console.log(`   处理批次 ${i/batchSize + 1}：帧数 ${batch.join(', ')}`)
    await Promise.all(batch.map(frame => loadImageWithRetry(frame, viewIndex)))
  }
  console.log(`   视图 ${viewIndex} 的批量加载完成`)
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
    let path = view.path
    
    // 验证路径格式
    if (!path || path === '') {
      console.error('❌ Product3DViewer: loadSingleImage - 无效的视图路径:', path)
      // 使用产品名称构建默认路径
      path = `/Product/${productName.value}/${view.name}/`
      console.log(`⚠️  使用默认路径: ${path}`)
    }
    
    // 确保路径以斜杠结尾
    if (!path.endsWith('/')) {
      path += '/'
    }
    
    const cleanup = (img, timer) => {
      img.onload = null
      img.onerror = null
      clearTimeout(timer)
    }
    
    const loadImage = (url, format) => {
      return new Promise((imgResolve, imgReject) => {
        const img = new Image()
        let timer
        
        img.onload = () => {
          cleanup(img, timer)
          // 将图片添加到预加载容器
          if (preloadedImages.value) {
            img.style.display = 'none'
            img.dataset.viewIndex = viewIndex
            img.dataset.frameIndex = index
            img.dataset.viewName = view.name
            preloadedImages.value.appendChild(img)
          }
          imgResolve(img)
        }
        
        img.onerror = () => {
          cleanup(img, timer)
          imgReject(new Error(`${format}加载失败: ${url}`))
        }
        
        timer = setTimeout(() => {
          img.src = ''
          imgReject(new Error(`${format}加载超时: ${url}`))
        }, CONFIG.loadTimeout)
        
        img.src = url
      })
    }
    
    // 使用API返回的路径构建图片URL
    const webpUrl = `${path}image_${frame}${CONFIG.imageExtension}`
    const pngUrl = `${path}image_${frame}.png`
    
    console.log(`📥 尝试加载图片: ${webpUrl}`)
    
    // 首先尝试加载WebP格式
    loadImage(webpUrl, 'WebP')
      .then(img => {
        imageCache.value[viewIndex][index] = img
        loadedCount.value++
        console.log(`✅ WebP图片加载成功: [${view.name}-${index}]`)
        updateProgress()
        // 如果是当前显示的帧，立即更新图片
        if (viewIndex === currentViewIndex.value && index === currentFrame.value && productImage.value) {
          productImage.value.src = img.src
        }
        resolve(true)
      })
      .catch(webpError => {
        console.log(`⚠️ WebP加载失败，尝试加载PNG格式: ${pngUrl}`)
        // WebP加载失败，尝试加载PNG格式
        return loadImage(pngUrl, 'PNG')
          .then(img => {
            imageCache.value[viewIndex][index] = img
            loadedCount.value++
            console.log(`✅ PNG图片加载成功: [${view.name}-${index}]`)
            updateProgress()
            // 如果是当前显示的帧，立即更新图片
            if (viewIndex === currentViewIndex.value && index === currentFrame.value && productImage.value) {
              productImage.value.src = img.src
            }
            resolve(true)
          })
      })
      .catch(pngError => {
        console.error(`❌ PNG加载也失败: ${pngUrl}`)
        failedLoads.value++
        // 记录失败的图片信息，但不中断整体加载流程
        console.warn(`⚠️ 图片加载失败，继续加载其他图片: ${pngError.message}`)
        resolve(false) // 返回false表示加载失败，但继续执行
      })
  })
}

const updateProgress = () => {
  const percent = totalImages.value > 0 ? Math.round((loadedCount.value / totalImages.value) * 100) : 0
  // 确保进度不超过100%
  loadingProgress.value = Math.min(percent, 100)
  loadingText.value = t('product3dViewer_loading', { loaded: loadedCount.value, total: totalImages.value })
}

const updateFrame = (frameInput) => {
  const totalFrames = CONFIG.totalFrames
  if (totalFrames <= 0) return
  
  // 简化帧计算，使用更高效的数学运算
  let targetFrame = Math.floor(frameInput)
  targetFrame = ((targetFrame % totalFrames) + totalFrames) % totalFrames
  
  // 只有当帧变化时才更新
  if (currentFrame.value !== targetFrame) {
    currentFrame.value = targetFrame
    
    // 检查当前视角的图片缓存
    const currentViewCache = imageCache.value[currentViewIndex.value]
    
    if (currentViewCache && currentViewCache.length > 0) {
      const targetImg = currentViewCache[targetFrame]
      // 只有当图片存在且与当前显示的图片不同时才更新
      if (targetImg && productImage.value) {
        // 直接使用缓存的图片对象，避免重复的图片加载
        if (productImage.value.src !== targetImg.src) {
          // 使用requestAnimationFrame确保DOM更新在动画帧中进行
          requestAnimationFrame(() => {
            if (productImage.value) {
              productImage.value.src = targetImg.src
            }
          })
        }
      }
    }
  }
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

// 为handleWheel添加节流，限制调用频率
let lastWheelTime = 0
const WHEEL_THROTTLE_MS = 16 // 约60fps

// 优化的handleWheel函数
const handleWheel = (e) => {
  // 使用节流限制调用频率
  const now = Date.now()
  if (now - lastWheelTime < WHEEL_THROTTLE_MS) {
    return
  }
  lastWheelTime = now
  
  // 简化计算，使用更高效的数学运算
  const delta = Math.sign(e.deltaY)
  const currentHeight = viewerContainer.value.offsetHeight
  const newHeight = Math.max(
    CONFIG.minHeight,
    Math.min(
      currentHeight + (-delta * CONFIG.wheelStep),
      window.innerHeight + 100
    )
  )
  
  // 只有当高度变化时才更新DOM
  if (newHeight !== currentHeight) {
    // 使用requestAnimationFrame确保DOM更新在动画帧中进行
    requestAnimationFrame(() => {
      viewerContainer.value.style.height = `${newHeight}px`
      if (productImage.value) {
        productImage.value.style.maxHeight = `${newHeight}px`
      }
    })
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

// 添加优化的节流函数
;

// 优化的handleMove函数，使用节流限制调用频率
const handleMove = (clientX, clientY) => {
  if (!isDragging.value) return
  
  const deltaX = clientX - lastX
  const deltaY = clientY - lastY
  
  // 只处理有效拖动
  if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 5) {
    const now = performance.now()
    const deltaTime = now - lastTime
    
    // 水平拖拽 - 旋转
    if (Math.abs(deltaX) > 0) {
      // 简化速度计算
      velocity = -deltaX * CONFIG.rotationSpeed
      // 直接计算目标帧，减少不必要的计算
      const targetFrame = currentFrame.value + velocity
      updateFrame(targetFrame)
    }
    
    // 垂直拖拽切换视角，增加阈值减少频繁切换
    if (Math.abs(deltaY) > 5) {
      // 垂直拖拽 - 切换视角
      const direction = deltaY > 0 ? 'up' : 'down'
      switchView(direction)
      lastY = clientY
    }
    
    lastX = clientX
    lastTime = now
  }
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
  // 使用简化的衰减算法，提高性能
  const animate = () => {
    // 应用摩擦力 - 使用更高效的衰减算法
    velocity *= 0.93
    
    if (Math.abs(velocity) > 0.05) {
      // 直接计算目标帧，简化计算
      const targetFrame = currentFrame.value + velocity
      updateFrame(targetFrame)
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
  // 先停止现有的旋转
  stopAutoRotation()
  
  isAutoRotating.value = true
  // 移除进入沉浸模式的代码，避免改变背景色
  
  // 累积旋转值，确保小数值也能有效工作
  let accumulatedRotation = 0
  
  const rotate = () => {
    if (!isAutoRotating.value) {
      return
    }
    
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
}

const stopAutoRotation = () => {
  if (autoRotateId) {
    cancelAnimationFrame(autoRotateId)
    autoRotateId = null
    isAutoRotating.value = false
    // 移除退出沉浸模式的代码，避免改变背景色
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
const showError = (message, showRetryBtn = true, errorDetails = '') => {
  let fullMessage = message
  if (errorDetails) {
    fullMessage += ` (${errorDetails})`
  }
  showMessage('error', fullMessage)
  showRetry.value = showRetryBtn
  console.error(`🔴 ${fullMessage}`)
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

// 性能监控函数
const startPerformanceMonitoring = () => {
  if (isPerformanceMonitoring.value) return
  
  isPerformanceMonitoring.value = true
  let frameCount = 0
  let lastTime = performance.now()
  let startTime = lastTime
  
  const updateFPS = () => {
    frameCount++
    const now = performance.now()
    const deltaTime = now - lastTime
    
    // 更新帧时间
    frameTime.value = deltaTime
    
    // 每秒更新一次FPS
    if (now - startTime >= 1000) {
      fps.value = Math.round((frameCount * 1000) / (now - startTime))
      frameCount = 0
      startTime = now
      
      // 只在开发环境输出FPS
      if (import.meta.env.DEV) {
        console.log(`🎮 FPS: ${fps.value}, 帧时间: ${frameTime.value.toFixed(2)}ms`)
      }
    }
    
    if (isPerformanceMonitoring.value) {
      requestAnimationFrame(updateFPS)
    }
  }
  
  requestAnimationFrame(updateFPS)
}

const stopPerformanceMonitoring = () => {
  isPerformanceMonitoring.value = false
}

const initializeEvents = () => {
  // 使用节流函数包装鼠标和触摸移动事件处理
  const throttledHandleMouseMove = throttle(handleMouseMove, 16) // 约60fps
  const throttledHandleTouchMove = throttle(handleTouchMove, 16) // 约60fps
  
  document.addEventListener('mousemove', throttledHandleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('touchmove', throttledHandleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd, { passive: true })
  
  // 添加键盘控制
  document.addEventListener('keydown', handleKeyDown)
  
  // 监听抽屉切换事件
  document.addEventListener('toggle-3d-drawer', handleDrawerToggle)
  
  // 监听下载事件
  document.addEventListener('download-all-images', handleDownloadAllImages)
  
  // 保存节流函数引用，以便清理
  initializeEvents.throttledMouseMove = throttledHandleMouseMove
  initializeEvents.throttledTouchMove = throttledHandleTouchMove
  
  // 启动性能监控（仅开发环境）
  if (import.meta.env.DEV) {
    startPerformanceMonitoring()
  }
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
  // 停止性能监控
  stopPerformanceMonitoring()
  
  // 移除事件监听器，使用节流包装后的函数引用
  document.removeEventListener('mousemove', initializeEvents.throttledMouseMove || handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', initializeEvents.throttledTouchMove || handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('toggle-3d-drawer', handleDrawerToggle)
  document.removeEventListener('download-all-images', handleDownloadAllImages)
}
</script>

<style scoped>
.product-3d-viewer {
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

.product-images-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.product-image {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.preloaded-images {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.retry-container {
  margin-top: 16px;
  width: 100%;
  display: flex;
  justify-content: center;
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
  padding: 4px 16px;
  color: var(--neutral-12);
  border: 1px solid var(--neutral-4);
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.auto-rotate-btn:hover {
  background: var(--neutral-1);
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
