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
        
        <Button  @click="toggleTheme" class="theme-button"  variant="no" size="icon32" title="Toggle Theme">
          <LucideIcon :name="currentTheme === 'light' ? 'Moon' : 'Sun'" size="16"/>
        </Button>
      </div>
      
      <!-- 通用抽屉菜单按钮（在所有屏幕尺寸下显示） -->
      <Button @click="toggleMenu" class="Menu-button" variant="no" size="icon32" >
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Menu, Sun, Moon } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'
import { useRouter, useRoute } from 'vue-router'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import Drawer from './Drawer.vue'
import Button from './ui/button.vue'
import LucideIcon from './ui/LucideIcon.vue'

const { currentLanguage, toggleLanguage, t } = useI18n()
const router = useRouter()
const route = useRoute()
const { isAdminLoggedIn, openLoginModal } = useAdminAuth()

const menuVisible = ref(false)

// 全局消息提示
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

// 主题切换相关
const currentTheme = ref('light')

// 初始化主题
const initTheme = () => {
  // 首先检查当前html元素上已经应用的主题类
  const htmlElement = document.documentElement
  const currentHtmlTheme = htmlElement.classList.contains('dark') ? 'dark' : (htmlElement.classList.contains('light') ? 'light' : null)
  
  // 如果html元素上已经有主题类，直接使用
  if (currentHtmlTheme) {
    currentTheme.value = currentHtmlTheme
    return // 不需要重新应用主题，因为已经存在
  }
  
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
  
  // 更新当前组件的主题状态
  currentTheme.value = theme
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
  if (!isAdminLoggedIn.value) {
    showMessage('warning', t('common_adminPermissionI18n'))
    openLoginModal()
    return
  }
  router.push('/i18n-manager')
  menuVisible.value = false
}

const goToProductManager = () => {
  if (!isAdminLoggedIn.value) {
    showMessage('warning', t('common_adminPermissionProduct'))
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

// 监听html元素class变化，确保主题状态同步
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') {
      const htmlElement = document.documentElement
      const currentHtmlTheme = htmlElement.classList.contains('dark') ? 'dark' : (htmlElement.classList.contains('light') ? 'light' : null)
      if (currentHtmlTheme) {
        currentTheme.value = currentHtmlTheme
      }
    }
  })
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 初始化主题
  initTheme()
  
  // 开始观察html元素的class变化
  observer.observe(document.documentElement, {
    attributes: true
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  // 停止观察
  observer.disconnect()
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
