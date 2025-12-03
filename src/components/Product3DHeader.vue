<template>
  <div class="product-3d-header">
    <!-- 左边：返回按钮 -->
    <Button 
      variant="text"
      @click="handleBack" 
      class="back-button"
      size="icon"
    >
      <LucideIcon name="ChevronLeft" size="16" />
    </Button>
    
    <!-- 右边：下载按钮和抽屉按钮 -->
    <div class="right-buttons">
      <!-- 下载按钮 -->
      <Button 
        variant="text"
        @click="handleDownload" 
        class="download-button"
      >
        <LucideIcon name="Download" size="16" />
        {{ t('product3dHeader_downloadAllImages') }}
      </Button>
      
      <!-- 抽屉按钮 -->
      <Button 
        variant="text"
        @click="toggleDrawer" 
        class="drawer-button"
        size="icon"
      >
        <LucideIcon name="Menu" size="16" />
      </Button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import Button from './ui/button.vue'
import LucideIcon from './ui/LucideIcon.vue'

const { t } = useI18n()
const router = useRouter()

// 下载按钮点击事件
const handleDownload = () => {
  // 触发下载事件
  const event = new CustomEvent('download-all-images')
  document.dispatchEvent(event)
}

// 返回按钮点击事件
const handleBack = () => {
  // 返回上一页，如果没有上一页则返回首页
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

// 抽屉按钮点击事件
const toggleDrawer = () => {
  // 触发抽屉显示/隐藏
  const event = new CustomEvent('toggle-3d-drawer')
  document.dispatchEvent(event)
}

// 监听抽屉切换事件
const handleDrawerToggle = () => {
  toggleDrawer()
}

onMounted(() => {
  document.addEventListener('toggle-3d-drawer', handleDrawerToggle)
})

onUnmounted(() => {
  document.removeEventListener('toggle-3d-drawer', handleDrawerToggle)
})
</script>

<style scoped>
.product-3d-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 64px;
  background-color: transparent;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.right-buttons {
  display: flex;
  gap: 6px;
}

.download-button {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #4d4d4d;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.back-button:hover,
.download-button:hover,
.drawer-button:hover {
  color: #4d4d4d;
}



/* 响应式设计 */
@media (max-width: 768px) {
  .product-3d-header {
    padding: 0 16px;
  }
  

  
  .download-button {
    height: 36px;
    font-size: 14px;
  }
  

}

@media (max-width: 480px) {
  .product-3d-header {
    padding: 0 12px;
  }
  

  
  .download-button {
    height: 32px;
    font-size: 13px;
    padding: 6px 10px;
  }
  
  .download-button span {
    font-size: 14px;
  }
  

}
</style>
