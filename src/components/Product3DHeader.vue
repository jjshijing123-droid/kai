<template>
  <div class="product-3d-header">
    <!-- 左边：返回按钮 -->
    <Button 
      variant="text"
      @click="handleBack" 
      class="back-button"
    >
      <LucideIcon name="ArrowLeft" size="18" class="icon" />
    </Button>
    
    <!-- 右边：下载按钮和抽屉按钮 -->
    <div class="right-buttons">
      <!-- 下载按钮 -->
      <Button 
        variant="text"
        @click="handleDownload" 
        class="download-button"
      >
        <LucideIcon name="Download" size="18" class="icon" />
        {{ t('product3dHeader_downloadAllImages') }}
      </Button>
      
      <!-- 抽屉按钮 -->
      <Button 
        variant="text"
        @click="toggleDrawer" 
        class="drawer-button"
      >
        <LucideIcon name="Menu" size="18" class="icon" />
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
  padding: 0 24px;
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
  gap: 8px;
}

.back-button,
.drawer-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  color: #4d4d4d;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover,
.drawer-button:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #4d4d4d;
  transform: scale(1.05);
}

.download-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  color: #4d4d4d;
  font-weight: 500;
  gap: 4px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-button:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #4d4d4d;
  transform: scale(1.02);
}

.back-button:hover,
.download-button:hover,
.drawer-button:hover {
  color: #4d4d4d;
}

.icon {
  font-size: 18px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .product-3d-header {
    padding: 0 16px;
  }
  
  .back-button,
  .drawer-button {
    width: 36px;
    height: 36px;
  }
  
  .download-button {
    height: 36px;
    font-size: 14px;
  }
  
  .icon {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .product-3d-header {
    padding: 0 12px;
  }
  
  .back-button,
  .drawer-button {
    width: 32px;
    height: 32px;
  }
  
  .download-button {
    height: 32px;
    font-size: 13px;
    padding: 6px 10px;
  }
  
  .download-button span {
    font-size: 14px;
  }
  
  .icon {
    font-size: 14px;
  }
}
</style>
