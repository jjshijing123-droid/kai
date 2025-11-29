<template>
  <div class="header" :class="{ 'header-3d-view': is3DViewerPage }">
    <div class="logo" @click="goToHome">
      <img src="../images/Logo.png" alt="Logo" class="logo-image">
    </div>
    
    <!-- 统一响应式导航 -->
    <div class="header-controls">
      <!-- 桌面端显示的导航按钮 -->
      <div class="nav-buttons">
        <button @click="goToI18nManager" class="nav-button">
          <span class="button-icon">🌐</span>
          {{ t('header_i18nManager') }}
        </button>
        
        <button @click="goToProductManager" class="nav-button">
          <span class="button-icon">📦</span>
          {{ t('header_productManager') }}
        </button>
        
        <button @click="toggleLanguage" class="lang-button">
          <span class="button-icon">🌍</span>
          {{ currentLanguage === 'zh-CN' ? t('common_english') : t('common_chinese') }}
        </button>
        
        <!-- 抽屉按钮 -->
        <button @click="toggleMenu" class="drawer-button">
          <span class="button-icon">📋</span>
        </button>
      </div>
      
      <!-- 移动端菜单按钮 -->
      <button @click="toggleMenu" class="menu-button">
        <span class="button-icon">☰</span>
      </button>
    </div>
    
    <!-- 统一抽屉菜单 -->
    <Drawer
      :isOpen="menuVisible"
      @close="closeMenu"
    />
    
    <!-- 登录模态框 -->
    <AdminLoginModal
      :open="showLoginModal"
      @open-change="handleLoginModalChange"
      @login-success="handleLoginSuccess"
      @login-failed="handleLoginFailed"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { useRouter, useRoute } from 'vue-router'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import Drawer from './Drawer.vue'
import AdminLoginModal from './AdminLoginModal.vue'

const { currentLanguage, toggleLanguage, t } = useI18n()
const router = useRouter()
const route = useRoute()
const { isAdminLoggedIn } = useAdminAuth()

const menuVisible = ref(false)
const showLoginModal = ref(false)

// 检测是否为3D查看器页面
const is3DViewerPage = computed(() => {
  return route.path.startsWith('/product-3d/')
})

const goToHome = () => {
  router.push('/')
}

const goToI18nManager = () => {
  if (!isAdminLoggedIn.value) {
    showLoginModal.value = true
  } else {
    router.push('/i18n-manager')
    menuVisible.value = false
  }
}

const goToProductManager = () => {
  if (!isAdminLoggedIn.value) {
    showLoginModal.value = true
  } else {
    router.push('/product-management')
    menuVisible.value = false
  }
}

// 处理登录模态框打开/关闭事件
const handleLoginModalChange = (open) => {
  showLoginModal.value = open
}

// 处理登录成功
const handleLoginSuccess = () => {
  showLoginModal.value = false
  // 登录成功后可以选择跳转到之前请求的页面
}

// 处理登录失败
const handleLoginFailed = (error) => {
  console.error(`${t('common_loginFailed')}:`, error)
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
  gap: 0px;
}

.nav-button,
.lang-button {
  display: flex;
  align-items: center;
  gap: 0px;
  font-weight: 500;
  color: #4d4d4d;
  background: none;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.button-icon {
  margin-right: 8px;
  font-size: 16px;
}

.nav-button:hover,
.lang-button:hover {
  color: #4d4d4d;
}

/* 菜单按钮 */
.menu-button,
.drawer-button {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #4d4d4d;
}

.menu-button:hover,
.drawer-button:hover {
  background: #f5f5f5;
}

/* 抽屉按钮 - 桌面端显示 */
.drawer-button {
  display: flex;
  margin-left: 8px;
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
  
  /* 在移动端隐藏导航按钮，显示菜单按钮 */
  .nav-buttons {
    display: none !important;
  }
  
  .menu-button {
    display: flex !important;
  }
  
  /* 在移动端隐藏抽屉按钮 */
  .drawer-button {
    display: none !important;
  }
}

/* 桌面端样式 */
@media (min-width: 769px) {
  .menu-button {
    display: none !important;
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
