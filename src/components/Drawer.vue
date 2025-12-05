<template>
  <div>
    <!-- 简约抽屉实现 -->
    <div v-if="isOpen" class="drawer-overlay" @click="closeDrawer">
      <div class="drawer-panel" @click.stop>
        <div class="drawer-header">
          <h3 class="drawer-title"></h3>
          <Button @click="closeDrawer" variant="no" size="icon32">
            <LucideIcon name="X" size="16" />
          </Button>
        </div>
        <div class="drawer-content">
          <!-- 管理员认证部分 -->
          <div class="admin-section">
            <h3 class="section-title">{{ t('common_admin') }}</h3>
            <div class="admin-content">
              <div v-if="!isAdminLoggedIn" class="admin-login-item" @click="openLoginModal">
                <LucideIcon name="Lock" size="20" class="menu-icon" />
                <span class="menu-text">{{ t('common_adminLogin') }}</span>
              </div>
              <div v-else class="admin-logged-in">
                <div class="admin-info">
                  <LucideIcon name="User" size="20" class="menu-icon" />
                  <span class="menu-text">{{ t('common_loggedIn') }}</span>
                </div>
                <Button variant="line" size="40" @click="handleLogout" class="logout-button">
                  <LucideIcon name="LogOut" size="16" />
                  {{ t('common_logout') }}
                </Button>
              </div>
            </div>
          </div>

          <!-- 导航菜单部分 -->
          <div class="menu-section">
            <h3 class="section-title">{{ t('drawer_navigation') }}</h3>
            <div class="menu-list">
              <div class="menu-item" @click="goToHome">
                <LucideIcon name="Home" size="14" class="menu-icon" />
                <span class="menu-text">{{ t('drawer_home') }}</span>
              </div>
              
              <div
                class="menu-item"
                @click="goToI18nManager"
              >
                <LucideIcon name="Globe" size="14" class="menu-icon" />
                <span class="menu-text">{{ t('header_i18nManager') }}</span>
              </div>
              
              <div
                class="menu-item"
                @click="goToProductManager"
              >
                <LucideIcon name="Package" size="14" class="menu-icon" />
                <span class="menu-text">{{ t('header_productManager') }}</span>
              </div>
            </div>
          </div>
          
          <!-- 语言切换部分 -->
          <div class="language-section">
            <h3 class="section-title">{{ t('header_language') }}</h3>
            <div class="language-options">
              <div
                class="language-option"
                :class="{ active: currentLanguage === 'zh-CN' }"
                @click="switchLanguage('zh-CN')"
              >
                <span class="language-flag">🇨🇳</span>
                <span class="language-text">{{ t('common_chinese') }}</span>
                <div class="language-check" v-if="currentLanguage === 'zh-CN'">
                  <LucideIcon name="Check" size="16" />
                </div>
              </div>
              
              <div
                class="language-option"
                :class="{ active: currentLanguage === 'en' }"
                @click="switchLanguage('en')"
              >
                <span class="language-flag">🇺🇸</span>
                <span class="language-text">{{ t('common_english') }}</span>
                <div class="language-check" v-if="currentLanguage === 'en'">
                  <LucideIcon name="Check" size="16" />
                </div>
              </div>
            </div>
          </div>
          
          <!-- 主题切换部分 -->
          <div class="theme-section">
            <h3 class="section-title">{{ t('common_theme') }}</h3>
            <div class="theme-options">
              <div
                class="theme-option"
                :class="{ active: currentTheme === 'light' }"
                @click="toggleTheme('light')"
              >
                <LucideIcon name="Sun" size="16" class="theme-icon" />
                <span class="theme-text">{{ t('common_lightTheme') }}</span>
                <div class="theme-check" v-if="currentTheme === 'light'">
                  <LucideIcon name="Check" size="16" />
                </div>
              </div>
              
              <div
                class="theme-option"
                :class="{ active: currentTheme === 'dark' }"
                @click="toggleTheme('dark')"
              >
                <LucideIcon name="Moon" size="16" class="theme-icon" />
                <span class="theme-text">{{ t('common_darkTheme') }}</span>
                <div class="theme-check" v-if="currentTheme === 'dark'">
                  <LucideIcon name="Check" size="16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { useRouter } from 'vue-router'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import Button from './ui/button.vue'
import LucideIcon from './ui/LucideIcon.vue'

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

const { currentLanguage, t, setLanguage } = useI18n()
const router = useRouter()
const { isAdminLoggedIn, logout, checkPermission, openLoginModal } = useAdminAuth()

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

// 主题切换函数
const toggleTheme = (theme) => {
  currentTheme.value = theme
  localStorage.setItem('theme', theme)
  applyTheme(theme)
  closeDrawer()
}

// 组件挂载时初始化主题
onMounted(() => {
  initTheme()
})

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const closeDrawer = () => {
  emit('close')
}

const goToHome = () => {
  router.push('/')
  closeDrawer()
}

const goToI18nManager = () => {
  if (!isAdminLoggedIn.value) {
    showMessage('warning', t('common_adminPermissionI18n'))
    closeDrawer() // 先关闭抽屉
    openLoginModal()
    return
  }
  router.push('/i18n-manager')
  closeDrawer()
}

const goToProductManager = () => {
  if (!isAdminLoggedIn.value) {
    showMessage('warning', t('common_adminPermissionProduct'))
    closeDrawer() // 先关闭抽屉
    openLoginModal()
    return
  }
  router.push('/product-management')
  closeDrawer()
}

const handleLoginSuccess = () => {
  // 登录成功消息已在 useAdminAuth.js 中显示，此处不再重复显示
  closeDrawer()
}

const handleLoginFailed = (error) => {
  console.error(`${t('common_loginFailed')}:`, error)
}

const handleLogout = () => {
  logout()
  showMessage('success', t('common_logoutSuccess'))
  // 如果当前在受保护页面，跳转到首页
  const currentPath = router.currentRoute.value.path
  if (currentPath.includes('/i18n-manager') || currentPath.includes('/product-management')) {
    router.push('/')
  }
  closeDrawer()
}

const switchLanguage = (lang) => {
  setLanguage(lang)
  closeDrawer()
}
</script>

<style scoped>
/* 抽屉遮罩 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

/* 抽屉面板 */
.drawer-panel {
  width: 320px;
  height: 100%;
  background: var(--neutral-1);
  display: flex;
  flex-direction: column;
}

/* 抽屉头部 */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 64px;
  border-bottom: 1px solid var(--neutral-4);
}

.drawer-title {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--neutral-12);
}



/* 抽屉内容 */
.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* 管理员部分样式 */
.admin-section {
  padding: 16px;
}

.admin-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.admin-login-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid var(--neutral-4);
  color: var(--neutral-10);
  font-weight: 500;
  background: var(--neutral-1);
}

.admin-login-item:hover {
  background: var(--neutral-2);
}

.admin-logged-in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--neutral-2);
  border: 1px solid var(--neutral-4);
}

.admin-info {
  display: flex;
  align-items: center;
  flex: 1;
}



/* 菜单部分样式 */
.menu-section {
  padding: 16px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-10);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid transparent;
  background: var(--neutral-1);
}

.menu-item:hover {
  background: var(--neutral-2);
}

.menu-item:active {
  background: var(--neutral-4);
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 12px;
  color: var(--neutral-10);
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--neutral-12);
  flex: 1;
}



/* 语言切换部分样式 */
.language-section {
  padding: 16px;
}

.language-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.language-option {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid var(--neutral-4);
  position: relative;
  background: var(--neutral-1);
}

.language-option:hover {
  background: var(--neutral-2);
}

.language-option.active {
  background: var(--neutral-2);
  border-color: var(--neutral-5);
}

.language-flag {
  font-size: 16px;
  margin-right: 12px;
}

.language-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--neutral-12);
  flex: 1;
}

.language-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--neutral-10);
}

/* 主题切换部分样式 */
.theme-section {
  padding: 16px;
}

.theme-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-option {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid var(--neutral-4);
  position: relative;
  background: var(--neutral-1);
}

.theme-option:hover {
  background: var(--neutral-2);
}

.theme-option.active {
  background: var(--neutral-2);
  border-color: var(--neutral-5);
}

.theme-icon {
  font-size: 16px;
  margin-right: 12px;
}

.theme-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--neutral-12);
  flex: 1;
}

.theme-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--neutral-10);
}

/* 响应式调整 */
@media (max-width: 480px) {
  .drawer-panel {
    width: 280px;
  }
  
  .drawer-header {
    padding: 0 16px;
  }
  
  .admin-section,
  .menu-section,
  .language-section {
    padding: 12px;
  }
  
  .menu-item,
  .language-option,
  .admin-login-item {
    padding: 10px 12px;
  }
}
</style>
