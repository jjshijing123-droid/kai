<template>
  <div class="header">
    <div class="logo" @click="goToHome">
      <img src="../images/Logo.png" alt="Logo" class="logo-image">
    </div>
    
    <!-- 统一响应式导航 -->
    <div class="header-controls">
      <!-- 桌面端显示的导航按钮 -->
      <div class="nav-buttons desktop-only">
        <Button  @click="goToI18nManager" class="nav-button" variant="no" size="32" :title="!isAdminLoggedIn ? t('common_needAdminPermission') : ''">
          <LucideIcon name="Globe" size="16" />
          {{ t('header_i18nManager') }}
        </Button>
        
        <Button @click="goToProductManager" class="nav-button"  variant="no" size="32" :title="!isAdminLoggedIn ? t('common_needAdminPermission') : ''">
          <LucideIcon name="Package" size="16" />
          {{ t('header_productManager') }}
        </Button>
        
        <Button @click="toggleLanguage" class="lang-button"  variant="no" size="32">
          <LucideIcon name="RefreshCw" size="16" />
          {{ currentLanguage === 'zh-CN' ? t('common_english') : t('common_chinese') }}
        </Button>
        
        <Button  @click="() => themeStore.toggleTheme()" class="theme-button"  variant="no" size="icon32" title="Toggle Theme">
          <LucideIcon :name="themeStore.currentTheme === 'light' ? 'Moon' : 'Sun'" size="16"/>
        </Button>
      </div>
      
      <!-- 通用抽屉菜单按钮（在所有屏幕尺寸下显示） -->
      <Button @click="toggleMenu" class="Menu-button" variant="no" size="icon40" >
         <LucideIcon name="Menu" size="18" />
      </Button>
    </div>
    
    <!-- 通用抽屉菜单 -->
      <Drawer
        :isOpen="menuVisible"
        @close="closeMenu"
      />
      

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { useRouter, useRoute } from 'vue-router'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import { showToast } from '../lib/toast.js'
import { useThemeStore } from '../stores/themeStore'
import Drawer from './Drawer.vue'
import Button from './ui/button.vue'
import LucideIcon from './ui/LucideIcon.vue'

const { currentLanguage, toggleLanguage, t } = useI18n()
const router = useRouter()
const route = useRoute()
const { isAdminLoggedIn, sessionReady, openLoginModal } = useAdminAuth()
const themeStore = useThemeStore()

const menuVisible = ref(false)

// 全局消息提示
const showMessage = showToast

const goToHome = () => {
  router.push('/')
}

const goToI18nManager = () => {
  if (!sessionReady.value) return
  if (!isAdminLoggedIn.value) {
    showMessage('warning', t('common_adminPermissionI18n'))
    // 保存目标路径，登录成功后自动跳转
    sessionStorage.setItem('redirect_after_login', '/i18n-manager')
    openLoginModal()
    return
  }
  router.push('/i18n-manager')
  menuVisible.value = false
}

const goToProductManager = () => {
  if (!sessionReady.value) return
  if (!isAdminLoggedIn.value) {
    showMessage('warning', t('common_adminPermissionProduct'))
    // 保存目标路径，登录成功后自动跳转
    sessionStorage.setItem('redirect_after_login', '/product-management')
    openLoginModal()
    return
  }
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
  padding: 0 16px;
  height: 64px;
  background-color: var(--background);
  border-bottom: 1px solid var(--neutral-3);
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
  gap: 6px;
}



/* 响应式设计 */
@media (max-width: 768px) {

  
/* 导航按钮组 */
.nav-buttons {
  display: none;

}


}

@media (max-width: 576px) {


}

@media (max-width: 480px) {

}
</style>
