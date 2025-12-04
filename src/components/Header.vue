<template>
  <div class="header">
    <div class="logo" @click="goToHome">
      <img src="../images/Logo.png" alt="Logo" class="logo-image">
    </div>
    
    <!-- 统一响应式导航 -->
    <div class="header-controls">
      <!-- 桌面端显示的导航按钮 -->
      <div class="nav-buttons desktop-only">
        <Button variant="text" @click="goToI18nManager" class="nav-button" size="small">
          <LucideIcon name="Globe" size="16" />
          {{ t('header_i18nManager') }}
        </Button>
        
        <Button variant="text" @click="goToProductManager" class="nav-button" size="small">
          <LucideIcon name="Package" size="16" />
          {{ t('header_productManager') }}
        </Button>
        
        <Button variant="text" @click="toggleLanguage" class="lang-button" size="small" >
          <LucideIcon name="RefreshCw" size="16" />
          {{ currentLanguage === 'zh-CN' ? t('common_english') : t('common_chinese') }}
        </Button>
        
        <Button variant="text" @click="toggleTheme" class="theme-button" size="small" title="Toggle Theme">
          <LucideIcon :name="currentTheme === 'light' ? 'Moon' : 'Sun'" size="16" />
        </Button>
      </div>
      
      <!-- 通用抽屉菜单按钮（在所有屏幕尺寸下显示） -->
      <Button variant="text" @click="toggleMenu" class="Menu-button" size="small" >
         <LucideIcon name="Menu" size="16" />
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
import { Menu, Sun, Moon } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'
import { useRouter, useRoute } from 'vue-router'
import Drawer from './Drawer.vue'
import Button from './ui/button.vue'
import LucideIcon from './ui/LucideIcon.vue'

const { currentLanguage, toggleLanguage, t } = useI18n()
const router = useRouter()
const route = useRoute()

const menuVisible = ref(false)

// 主题切换相关
const currentTheme = ref('light')

// 初始化主题
const initTheme = () => {
  // 检查 localStorage 中是否有保存的主题
  const savedTheme = localStorage.getItem('theme')
  
  // 检查系统偏好主题
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  
  // 使用保存的主题或系统主题，但只使用light或dark
  const initialTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : systemTheme
  currentTheme.value = initialTheme
  
  // 应用主题
  applyTheme(initialTheme)
}

// 应用主题
const applyTheme = (theme) => {
  const htmlElement = document.documentElement
  
  // 移除现有的主题类
  htmlElement.classList.remove('light', 'dark')
  
  // 应用指定主题
  htmlElement.classList.add(theme)
}

// 切换主题
const toggleTheme = () => {
  const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
  currentTheme.value = newTheme
  localStorage.setItem('theme', newTheme)
  applyTheme(newTheme)
}



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
  // 初始化主题
  initTheme()
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
  border-bottom: 1px solid var(--neutral-6);
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





.nav-button,
.lang-button,
.theme-button,
.Menu-button{
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: var(--neutral-12);
  transition: all 0.3s ease;
}

.nav-button:hover,
.lang-button:hover,
.theme-button:hover,
.Menu-button:hover{
  background: var(--neutral-4);
  color: var(--neutral-12);
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
