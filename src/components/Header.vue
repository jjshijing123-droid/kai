<template>
  <div class="header" :class="{ 'header-3d-view': is3DViewerPage }">
    <div class="logo" @click="goToHome">
      <img src="../images/Logo.png" alt="Logo" class="logo-image">
    </div>
    
    <!-- 统一响应式导航 -->
    <div class="header-controls">
      <!-- 桌面端显示的导航按钮 -->
      <div class="nav-buttons desktop-only">
        <Button variant="text" @click="goToI18nManager" class="nav-button">
          <LucideIcon name="Globe" size="16" />
          {{ t('header_i18nManager') }}
        </Button>
        
        <Button variant="text" @click="goToProductManager" class="nav-button">
          <LucideIcon name="Package" size="16" />
          {{ t('header_productManager') }}
        </Button>
        
        <Button variant="text" @click="toggleLanguage" class="lang-button">
          <LucideIcon name="RefreshCw" size="16" />
          {{ currentLanguage === 'zh-CN' ? t('common_english') : t('common_chinese') }}
        </Button>
      </div>
      
      <!-- 通用抽屉菜单按钮（在所有屏幕尺寸下显示） -->
      <Button variant="text" @click="toggleMenu" class="menu-button">
        <LucideIcon name="Menu" class="h-5 w-5" />
      </Button>
    </div>
    
    <!-- 统一抽屉菜单 -->
    <Drawer
      :isOpen="menuVisible"
      @close="closeMenu"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { useRouter, useRoute } from 'vue-router'
import Drawer from './Drawer.vue'
import Button from './ui/button.vue'
import LucideIcon from './ui/LucideIcon.vue'

const { currentLanguage, toggleLanguage, t } = useI18n()
const router = useRouter()
const route = useRoute()

const menuVisible = ref(false)

// 检测是否为3D查看器页面
const is3DViewerPage = computed(() => {
  return route.path.startsWith('/product-3d/')
})

const goToHome = () => {
  router.push('/')
}

const goToI18nManager = () => {
  router.push('/i18n-manager')
  menuVisible.value = false
}

const goToProductManager = () => {
  router.push('/product-management')
  menuVisible.value = false
}

// 统一菜单控制
const toggleMenu = () => {
  menuVisible.value = !menuVisible.value
}

// 关闭菜单
const closeMenu = () => {
  menuVisible.value = false
}

// 点击外部关闭菜单
const handleClickOutside = (event) => {
  const headerElement = document.querySelector('.header')
  if (headerElement && !headerElement.contains(event.target)) {
    menuVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.logo {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.logo-image {
  height: 60px;
  width: auto;
  object-fit: contain;
}

/* 统一导航控制 */
.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

/* 导航按钮组 */
.nav-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 桌面端专用导航按钮（在小屏幕上隐藏） */
.desktop-only {
  display: flex;
}

@media (max-width: 1024px) {
  .desktop-only {
    display: none;
  }
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
}

.nav-button,
.lang-button {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #4d4d4d;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.nav-button:hover,
.lang-button:hover {
  background: #f5f5f5;
  color: #4d4d4d;
}

.nav-button .icon,
.lang-button .icon {
  font-size: 16px;
}

/* 菜单按钮（在所有屏幕尺寸下都显示） */
.menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
}

.menu-button:hover {
  background: #f5f5f5;
}

/* 3D查看器页面专用样式 */
.header-3d-view {
  border-bottom: none !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    padding: 0 16px;
  }
  
  .logo-image {
    height: 50px;
  }
}

@media (max-width: 576px) {
  .header {
    padding: 0 16px;
  }
  
  .logo-image {
    height: 50px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0 8px;
  }
  
  .logo-image {
    height: 50px;
  }
}
</style>
