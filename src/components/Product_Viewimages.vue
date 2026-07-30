<template>
  <div class="image-gallery">
    <!-- 使用Product3DHeader组件作为页面头部 -->
  <Product3DHeader :visible="allImagesLoaded" />
    
    <!-- 主画廊容器 -->
    <div class="gallery-container">
      <div class="main-viewer">
        <!-- 加载提示 -->
        <div class="loading-container" v-if="isLoading">
          <LoadingState 
            :loading="isLoading"
            :text="loadingText"
            :show-progress="true"
            :progress="loadingProgress || 0"
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
        
        <!-- 主展示图片 -->
        <img
          id="mainImage"
          :src="currentImageUrl"
          :alt="currentImageAlt"
          v-if="currentImageUrl"
        />
        
        <!-- 导航按钮 -->
        <button
          class="nav-button prev"
          :class="{ 'visible': images.length > 1 }"
          @click="prevImage"
        >❮</button>
        <button
          class="nav-button next"
          :class="{ 'visible': images.length > 1 }"
          @click="nextImage"
        >❯</button>
      </div>
      
      <!-- 缩略图容器 -->
      <div class="thumbnails-wrapper">
        <div class="thumbnails" ref="thumbnailContainer">
          <img
            v-for="(image, index) in images"
            :key="index"
            :src="image.url"
            :alt="image.alt"
            class="thumbnail"
            :class="{
              'active': currentIndex === index,
              'loaded': image.loaded
            }"
            @click="showImage(index)"
          />
        </div>
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
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import Product3DHeader from './Product3DHeader.vue'
import Drawer from './Drawer.vue'
import LoadingState from './ui/LoadingState.vue'
import Button from './ui/button.vue'
import { showMessage } from '../composables/useAdminAuth.js'
import apiService from '../services/apiService.js'

const { t, currentLanguage, toggleLanguage } = useI18n()
const route = useRoute()
const router = useRouter()

const productName = ref('')
const imageType = ref('6views') // '6views' 或 'other'
const images = ref([])
const currentIndex = ref(0)
const isLoading = ref(true)
const loadingText = ref('')
const loadingProgress = ref(0)
const showRetry = ref(false)
const thumbnailContainer = ref(null)
const drawerVisible = ref(false)

// 计算属性
const currentImageUrl = computed(() => {
  return images.value[currentIndex.value]?.url || ''
})

const currentImageAlt = computed(() => {
  return images.value[currentIndex.value]?.alt || '主展示图'
})

// 添加计算属性，判断是否所有图片都已加载完成
const allImagesLoaded = computed(() => {
  return images.value.length > 0 && images.value.every(img => img.loaded)
})

// 处理下载事件
const handleDownloadAllImages = () => {
  downloadAllImages()
}

// 初始化
onMounted(async () => {
  try {
    // 获取路由参数
    productName.value = route.params.name
    imageType.value = route.params.type || '6views'
    
    // 设置浏览器标题为当前产品名称
    document.title = productName.value
    
    console.log('Product_Viewimages 初始化:', {
      productName: productName.value,
      imageType: imageType.value
    })
    
    // 立即添加事件监听，不等待图片加载完成
    document.addEventListener('keydown', handleKeyboardNavigation)
    document.addEventListener('download-all-images', handleDownloadAllImages)
    document.addEventListener('toggle-3d-drawer', handleDrawerToggle)
    
    if (!productName.value || productName.value.trim() === '') {
      console.error('Product_Viewimages: 产品名称为空或无效')
      router.push('/')
      return
    }
    
    // 初始化图片展示
    await initGallery()
    
  } catch (error) {
    console.error('初始化失败:', error)
    const errorMessage = t('productViewimages_loadFailed').replace('{message}', error.message)
    showMessage('error', errorMessage)
  }
})

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardNavigation)
  document.removeEventListener('download-all-images', handleDownloadAllImages)
  document.removeEventListener('toggle-3d-drawer', handleDrawerToggle)
})

// 初始化图片展示
async function initGallery() {
  try {
    loadingProgress.value = 0

    // 1. 检查文件夹并检测可用图片
    const validImages = await detectAvailableImages()
    
    console.log('检测到的图片:', validImages)
    
    if (validImages.length === 0) {
      const folderType = imageType.value === '6views' ? '6视图图片' : '其他图片'
      throw new Error(`${folderType}文件夹为空或未找到可用图片`)
    }
    
    loadingText.value = t('productViewimages_loadingImages').replace('{count}', validImages.length)
    
    // 3. 设置图片数据
    images.value = validImages
    
    // 4. 创建缩略图
    await createThumbnails()
    
    // 5. 优先加载并显示第一张图片
    if (images.value.length > 0) {
      await loadAndShowImage(0)
    }
    
    // 6. 异步加载其他图片
    loadOtherImages()
    
    // 7. 初始化缩略图拖动功能
    setupThumbnailDrag()
    
    // 8. 预加载相邻图片
    preloadAdjacentImages()
    
    // 重要：完成初始化后设置 isLoading = false
    isLoading.value = false
    loadingText.value = ''
    loadingProgress.value = 0
    
    console.log('图片展示初始化完成')
    
  } catch (error) {
      console.error('初始化图片展示失败:', error)
      
      // 改进错误信息显示
      let errorMessage = error.message
      
      // 如果是文件夹不存在的错误，尝试显示友好提示
      if (error.message.includes('图片文件夹不存在')) {
        const folderType = imageType.value === '6views' ? '6视图图片' : '其他图片'
        errorMessage = `当前产品暂无${folderType}文件夹`
      } else if (error.message.includes('noImagesFound')) {
        errorMessage = '未找到可用的图片文件'
      }
      
      // 使用showMessage函数显示错误提示
      showMessage('error', errorMessage)
      
      // 即使失败也要停止加载状态，让用户知道有问题
      isLoading.value = false
      loadingText.value = ''
      loadingProgress.value = 0
      showRetry.value = true
    }
}

// 使用API获取图片列表
async function detectAvailableImages() {
  try {
    console.log(`🔍 正在调用API获取 ${imageType.value} 类型的图片列表`)
    
    // 调用API获取图片列表
    const response = await apiService.getProductImages(productName.value, imageType.value)
    
    if (response && response.success && response.images) {
      console.log(`🎉 API返回 ${response.images.length} 张图片`)
      
      // 转换API返回的图片数据格式，适配现有组件
      const validImages = response.images.map((img, index) => ({
        index: index,
        url: img.url,
        format: img.format,
        loaded: false,
        alt: img.name
      }))
      
      if (validImages.length === 0) {
        const folderType = imageType.value === '6views' ? '6视图图片' : '其他图片'
        throw new Error(`${folderType}文件夹为空或未找到可用图片`)
      }
      
      return validImages
    } else {
      console.error(`❌ API返回数据格式错误:`, response)
      throw new Error('获取图片列表失败，API返回格式错误')
    }
  } catch (error) {
    console.error(`❌ 获取图片列表失败:`, error.message)
    const folderType = imageType.value === '6views' ? '6视图图片' : '其他图片'
    throw new Error(`${folderType}图片获取失败: ${error.message}`)
  }
}



// 获取图片文件夹路径
function getImageFolderPath() {
  const folderName = imageType.value === 'other' ? 'images_other' : 'images_6Views'
  const path = `Product/${productName.value}/${folderName}`
  console.log('构建的图片路径:', path)
  return path
}



// 创建缩略图
async function createThumbnails() {
  // Vue会自动处理DOM更新
  await nextTick()
  
  // 为缩略图添加加载事件
  const thumbnailElements = document.querySelectorAll('.thumbnail')
  thumbnailElements.forEach((thumb, index) => {
    thumb.addEventListener('load', () => {
      if (images.value[index]) {
        images.value[index].loaded = true
      }
    })
    
    thumb.addEventListener('error', () => {
      console.warn(`Failed to load thumbnail: ${images.value[index]?.url}`)
    })
  })
}

// 智能加载图片（带缓存）
const imageCache = new Map()
const loadingPromises = new Map()

function loadImage(index) {
  if (index < 0 || index >= images.value.length) return Promise.resolve()
  
  const imageData = images.value[index]
  if (!imageData) return Promise.resolve()
  
  // 如果已经加载，直接返回
  if (imageData.loaded) return Promise.resolve()
  
  // 如果正在加载，返回现有的Promise
  if (loadingPromises.has(index)) {
    return loadingPromises.get(index)
  }
  
  // 检查图片缓存
  if (imageCache.has(imageData.url)) {
    imageData.loaded = true
    return Promise.resolve()
  }
  
  // 创建新的加载Promise
  const loadPromise = new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      imageCache.set(imageData.url, img)
      imageData.loaded = true
      loadingPromises.delete(index)
      resolve()
    }
    
    img.onerror = () => {
      console.warn(`Failed to load image: ${imageData.url}`)
      loadingPromises.delete(index)
      resolve()
    }
    
    // 添加加载超时
    const timeoutId = setTimeout(() => {
      img.onload = null
      img.onerror = null
      console.warn(`Image load timeout: ${imageData.url}`)
      loadingPromises.delete(index)
      resolve()
    }, 10000) // 10秒超时
    
    // 清除超时的函数
    const originalOnLoad = img.onload
    img.onload = (event) => {
      clearTimeout(timeoutId)
      originalOnLoad.call(img, event)
    }
    
    const originalOnError = img.onerror
    img.onerror = (event) => {
      clearTimeout(timeoutId)
      originalOnError.call(img, event)
    }
    
    img.src = imageData.url
  })
  
  loadingPromises.set(index, loadPromise)
  return loadPromise
}

// 加载并显示图片
async function loadAndShowImage(index) {
  if (index < 0 || index >= images.value.length) return
  
  try {
    await loadImage(index)
    showImage(index)
  } catch (error) {
    console.error('Failed to load image:', error)
  }
}

// 显示图片
function showImage(index) {
  if (index < 0 || index >= images.value.length) return
  
  currentIndex.value = index
  
  // 滚动到当前缩略图
  scrollToCurrentThumbnail(index)
  
  // 预加载相邻图片
  preloadAdjacentImages()
}

// 滚动到当前缩略图
function scrollToCurrentThumbnail(index) {
  if (!thumbnailContainer.value) return
  
  const thumbnails = thumbnailContainer.value
  const currentThumb = thumbnails.children[index]
  
  if (currentThumb) {
    const thumbLeft = currentThumb.offsetLeft
    const thumbWidth = currentThumb.offsetWidth
    const containerWidth = thumbnails.clientWidth
    const scrollLeft = thumbnails.scrollLeft
    
    const thumbLeftInView = thumbLeft - scrollLeft
    const thumbRightInView = thumbLeftInView + thumbWidth
    
    if (thumbLeftInView < 0 || thumbRightInView > containerWidth) {
      const scrollToPosition = thumbLeft - (containerWidth - thumbWidth) / 2
      const maxScrollLeft = thumbnails.scrollWidth - thumbnails.clientWidth
      const finalScrollPosition = Math.max(0, Math.min(scrollToPosition, maxScrollLeft))
      
      thumbnails.scrollTo({
        left: finalScrollPosition,
        behavior: 'smooth'
      })
    }
  }
}

// 优化的预加载相邻图片
function preloadAdjacentImages() {
  const preloadIndices = []
  
  for (let i = 1; i <= 3; i++) {
    const prevIndex = currentIndex.value - i
    if (prevIndex >= 0 && !images.value[prevIndex].loaded) {
      preloadIndices.push(prevIndex)
    }
    
    const nextIndex = currentIndex.value + i
    if (nextIndex < images.value.length && !images.value[nextIndex].loaded) {
      preloadIndices.push(nextIndex)
    }
  }
  
  // 并行加载，但限制并发数量
  const batchSize = 3
  for (let i = 0; i < preloadIndices.length; i += batchSize) {
    const batch = preloadIndices.slice(i, i + batchSize)
    Promise.all(batch.map(index => loadImage(index)))
  }
}

// 加载其他图片（带进度更新）
function loadOtherImages() {
  let loadedCount = 1 // 已经加载了一张主图
  
  for (let i = 1; i < images.value.length; i++) {
    loadImage(i).then(() => {
      loadedCount++
      const progress = Math.round((loadedCount / images.value.length) * 100)
      if (progress <= 100) {
        loadingProgress.value = progress
      }
    })
  }
}

// 上一张图片（循环）
function prevImage() {
  if (currentIndex.value > 0) {
    showImage(currentIndex.value - 1)
  } else {
    showImage(images.value.length - 1)
  }
}

// 下一张图片（循环）
function nextImage() {
  if (currentIndex.value < images.value.length - 1) {
    showImage(currentIndex.value + 1)
  } else {
    showImage(0)
  }
}

// 设置缩略图拖动功能
function setupThumbnailDrag() {
  if (!thumbnailContainer.value) return
  
  let isDragging = false
  let startPos = 0
  let scrollLeft = 0
  let velocity = 0
  let lastPos = 0
  let lastTime = 0
  let animationFrame
  let isAnimating = false
  
  // 鼠标事件
  thumbnailContainer.value.addEventListener('mousedown', (e) => {
    isDragging = true
    startPos = e.pageX - thumbnailContainer.value.offsetLeft
    scrollLeft = thumbnailContainer.value.scrollLeft
    velocity = 0
    lastPos = startPos
    lastTime = Date.now()
    thumbnailContainer.value.classList.add('grabbing')
    
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      isAnimating = false
    }
    
    e.preventDefault()
  })
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return
    
    const currentTime = Date.now()
    const currentPos = e.pageX - thumbnailContainer.value.offsetLeft
    const deltaPos = currentPos - lastPos
    
    if (currentTime > lastTime) {
      velocity = deltaPos / (currentTime - lastTime)
    }
    
    const walk = (currentPos - startPos) * 1.5
    thumbnailContainer.value.scrollLeft = scrollLeft - walk
    
    lastPos = currentPos
    lastTime = currentTime
  })
  
  document.addEventListener('mouseup', () => {
    if (!isDragging) return
    
    isDragging = false
    thumbnailContainer.value.classList.remove('grabbing')
    
    if (Math.abs(velocity) > 0.1) {
      applyInertia(velocity)
    }
  })
  
  // 应用惯性动画
  function applyInertia(initialVelocity) {
    if (isAnimating) return
    
    isAnimating = true
    const friction = 0.95
    let currentVelocity = -initialVelocity * 20
    
    function animate() {
      if (!isAnimating) return
      
      thumbnailContainer.value.scrollLeft += currentVelocity
      currentVelocity *= friction
      
      const maxScroll = thumbnailContainer.value.scrollWidth - thumbnailContainer.value.clientWidth
      const currentScroll = thumbnailContainer.value.scrollLeft
      
      if (currentScroll <= 0) {
        thumbnailContainer.value.scrollLeft = 0
        currentVelocity = 0
      } else if (currentScroll >= maxScroll) {
        thumbnailContainer.value.scrollLeft = maxScroll
        currentVelocity = 0
      }
      
      if (Math.abs(currentVelocity) > 0.5) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        isAnimating = false
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
  }
}

// 键盘导航处理
function handleKeyboardNavigation(e) {
  if (isLoading.value) return
  
  switch(e.key) {
    case 'ArrowLeft':
      prevImage()
      break
    case 'ArrowRight':
      nextImage()
      break
    case 'Home':
      showImage(0)
      break
    case 'End':
      showImage(images.value.length - 1)
      break
  }
}

// 下载所有图片
async function downloadAllImages() {
  if (images.value.length === 0) return
  
  try {
    loadingText.value = t('product3dViewer_preparingDownload')
    isLoading.value = true
    loadingProgress.value = 0
    
    // 动态导入JSZip和FileSaver
    const JSZip = (await import('jszip')).default
    const { saveAs } = await import('file-saver')
    
    const zip = new JSZip()
    const downloadFileName = `${productName.value}_${imageType.value === 'other' ? 'other_images' : '6views'}`
    const folder = zip.folder(downloadFileName)
    
    // 添加所有图片到zip
    for (let i = 0; i < images.value.length; i++) {
      const response = await fetch(images.value[i].url)
      const blob = await response.blob()
      const fileName = `image_${(i + 1).toString().padStart(2, '0')}.webp`
      folder.file(fileName, blob)
      
      // 更新进度
      loadingProgress.value = Math.round(((i + 1) / images.value.length) * 100)
    }
    
    // 生成zip文件
    const content = await zip.generateAsync({type: 'blob'})
    
    // 下载
    saveAs(content, `${downloadFileName}.zip`)
    
    loadingText.value = t('product3dViewer_downloadComplete')
    setTimeout(() => {
      isLoading.value = false
      loadingProgress.value = 0
    }, 2000)
    
  } catch (error) {
    console.error('Download failed:', error)
    const errorMessage = t('product3dViewer_downloadError').replace('{message}', error.message)
    showMessage('error', errorMessage)
    isLoading.value = false
    loadingText.value = ''
    loadingProgress.value = 0
  }
}

// 监听语言变化
watch(currentLanguage, () => {
  // 重新生成图片alt文本
  images.value.forEach((image, index) => {
    const originalIndex = image.index >= 100 ? image.index - 99 : image.index + 1
    image.alt = `${t('productViewimages_thumbnailAlt').replace('{index}', originalIndex)} (${image.format.toUpperCase()})`
  })
})

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

// 重试加载
const retryLoading = () => {
  loadingText.value = t('productViewimages_detectingImages')
  loadingProgress.value = 0
  showRetry.value = false
  images.value = []
  initGallery()
}

// 监听产品名称变化，更新浏览器标题
watch(productName, (newName) => {
  if (newName && newName.trim() !== '') {
    document.title = newName
  }
})
</script>

<style scoped>
.image-gallery {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  padding-top: 64px;
}

/* 主画廊容器 */
.gallery-container {
  width: 100%;
  max-width: 1200px;
  height: calc(90vh - 80px);
  display: flex;
  flex-direction: column;
}

.main-viewer {
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  touch-action: none;
}

.main-viewer img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 加载容器 */
.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 25px 20px;
  width: 280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--neutral-1);
  color: var(--neutral-12);
  z-index: 20;
  border-radius: 8px;
}

.retry-container {
  margin-top: 16px;
  width: 100%;
  display: flex;
  justify-content: center;
}

@keyframes loading {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* 缩略图容器 */
.thumbnails-wrapper {
  height: 140px;
  padding: 15px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.thumbnails {
  height: 100%;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  cursor: grab;
  justify-content: center;
  align-items: center;
}

.thumbnails.grabbing {
  cursor: grabbing;
}

/* 缩略图 */
.thumbnail {
  width: 100px;
  height: 100px;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 8px;
  flex-shrink: 0;
  user-select: none;
  position: relative;
  overflow: hidden;
  background: var(--neutral-3);
}

.thumbnail::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: loading 1.5s infinite;
  z-index: 1;
}

.thumbnail.loaded::before {
  display: none;
}

.thumbnail.active {
  border-color: var(--primary-9);
}

.thumbnail.loaded {
  background: var(--neutral-1);
}

/* 导航按钮 */
.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background: var(--neutral-1);
  color: var(--neutral-11);
  border: 1px solid var(--neutral-7);
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  visibility: hidden;
}

.nav-button.visible {
  opacity: 1;
  visibility: visible;
}

.prev {
  left: 20px;
}

.next {
  right: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .image-gallery {
    padding: 10px;
    padding-top: 70px;
  }
  
  .gallery-container {
    height: calc(100vh - 100px);
    max-width: none;
    margin: 0;
  }
  
  .thumbnails {
    gap: 8px;
  }
  
  .thumbnails-wrapper {
    padding: 12px;
    height: 120px;
  }
  
  .thumbnail {
    width: 80px;
    height: 80px;
    border-radius: 6px;
  }
  
  .nav-button {
    width: 42px;
    height: 42px;
    font-size: 16px;
  }
  
  .prev {
    left: 15px;
  }
  
  .next {
    right: 15px;
  }
  
  .loading-container {
    width: 260px;
    padding: 25px 20px;
  }
  
  .loading-text {
    font-size: 1em;
  }
}

@media (max-width: 480px) {
  .gallery-container {
    height: calc(100vh - 90px);
  }
  
  .thumbnails-wrapper {
    height: 110px;
    padding: 10px;
  }
  
  .thumbnail {
    width: 70px;
    height: 70px;
    border-radius: 4px;
  }
  
  .nav-button {
    width: 38px;
    height: 38px;
    font-size: 14px;
  }
  
  .prev {
    left: 12px;
  }
  
  .next {
    right: 12px;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .gallery-container {
    border: 1px solid var(--neutral-12);
  }
  
  .thumbnail {
    border-color: var(--neutral-12);
  }
  
  .thumbnail.active {
    border-color: var(--primary-9);
  }
  
  .nav-button {
    border-color: var(--neutral-12);
  }
  
  .loading-container {
    border: 1px solid var(--neutral-12);
  }
}

/* 深色模式支持 - 保持白色风格 */
@media (prefers-color-scheme: dark) {
  .image-gallery {
    background: var(--neutral-1);
  }
  
  .gallery-container {
    background: var(--neutral-1);
  }
  
  .main-viewer {
    background: var(--neutral-1);
  }
  
  .thumbnails-wrapper {
    background: var(--neutral-1);
  }
  
  .thumbnail {
    background: var(--neutral-3);
  }
  
  .nav-button {
    background: var(--neutral-1);
    color: var(--neutral-11);
    border-color: var(--neutral-7);
  }
  
  .loading-container {
    background: var(--neutral-1);
    color: var(--neutral-12);
  }
  
  .loading-text {
    color: var(--neutral-12);
  }
  
  .progress-text {
    color: var(--neutral-11);
  }
}

/* 打印样式 */
@media print {
  .image-gallery {
  }
  
  .gallery-container {
  }
  
  .nav-button {
    display: none;
  }
  
  .thumbnails-wrapper {
    display: none;
  }
}
</style>