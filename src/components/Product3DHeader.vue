<template>
  <div class="product-3d-header">
    <!-- 左边：返回按钮 -->
    <Button 
      @click="handleBack" 
      class="back-button"
      variant="no"
      size="icon40"
    >
      <LucideIcon name="ChevronLeft" size="18" />
    </Button>
    
    <!-- 右边：下载按钮和抽屉按钮 -->
    <div class="right-buttons">
      <!-- 下载按钮 -->
      <Button 
        v-if="props.visible"
        @click="handleDownload" 
        class="download-button"
        variant="no"
        size="32"
      >
        <LucideIcon name="Download" size="16" />
        {{ t('product3dHeader_downloadAllImages') }}
      </Button>
      
      <!-- 抽屉按钮 -->
      <Button 
        variant="no"
        size="icon40"
        @click="toggleDrawer" 
      >
        <LucideIcon name="Menu" size="18" />
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

// 添加props
const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  }
})

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


</script>

<style scoped>
.product-3d-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 64px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.right-buttons {
  display:flex;
  align-items: center;
  gap: 6px;
}



/* 响应式设计 */
@media (max-width: 768px) {
  .product-3d-header {
    padding: 0 16px;
  }
  

  

  

}

@media (max-width: 480px) {
  .product-3d-header {
    padding: 0 12px;
  }
  


  

}
</style>
