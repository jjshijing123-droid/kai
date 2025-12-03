<template>
  <div>
    <!-- 简约抽屉实现 -->
    <div v-if="isOpen" class="drawer-overlay" @click="closeDrawer">
      <div class="drawer-panel" @click.stop>
        <div class="drawer-header">
          <h3 class="drawer-title"></h3>
          <button class="drawer-close-btn" @click="closeDrawer">
            <LucideIcon name="X" size="20" />
          </button>
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
                <Button variant="text" size="small" @click="handleLogout" class="logout-button">
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
                <LucideIcon name="Home" size="20" class="menu-icon" />
                <span class="menu-text">{{ t('drawer_home') }}</span>
              </div>
              
              <div
                class="menu-item"
                @click="goToI18nManager"
                :class="{ 'disabled': !isAdminLoggedIn }"
                :title="!isAdminLoggedIn ? t('common_needAdminPermission') : ''"
              >
                <LucideIcon name="Globe" size="20" class="menu-icon" />
                <span class="menu-text">{{ t('header_i18nManager') }}</span>
              </div>
              
              <div
                class="menu-item"
                @click="goToProductManager"
                :class="{ 'disabled': !isAdminLoggedIn }"
                :title="!isAdminLoggedIn ? t('common_needAdminPermission') : ''"
              >
                <LucideIcon name="Package" size="20" class="menu-icon" />
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
                  <LucideIcon name="Check" size="14" />
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
                  <LucideIcon name="Check" size="14" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 登录模态框 -->
    <AdminLoginModal
      v-model:open="showLoginModal"
      @login-success="handleLoginSuccess"
      @login-failed="handleLoginFailed"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { useRouter } from 'vue-router'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import AdminLoginModal from './AdminLoginModal.vue'
import Button from './ui/button.vue'
import LucideIcon from './ui/LucideIcon.vue'

// 原生消息提示实现（替代Ant Design Vue message）
const showMessage = (type, text) => {
  const messageDiv = document.createElement('div')
  messageDiv.className = `message-${type}`
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    max-width: 300px;
    word-wrap: break-word;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
  `
  
  if (type === 'warning') {
    messageDiv.style.backgroundColor = '#f59e0b'
  } else if (type === 'error') {
    messageDiv.style.backgroundColor = '#ef4444'
  } else if (type === 'success') {
    messageDiv.style.backgroundColor = '#22c55e'
  } else {
    messageDiv.style.backgroundColor = '#0ea5e9'
  }
  
  messageDiv.textContent = text
  document.body.appendChild(messageDiv)
  
  // 3秒后自动移除
  setTimeout(() => {
    messageDiv.style.opacity = '0'
    messageDiv.style.transform = 'translateX(100%)'
    setTimeout(() => {
      if (messageDiv.parentNode) {
        document.body.removeChild(messageDiv)
      }
    }, 300)
  }, 3000)
}

const { currentLanguage, t, setLanguage } = useI18n()
const router = useRouter()
const { isAdminLoggedIn, logout, checkPermission } = useAdminAuth()

const showLoginModal = ref(false)

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
    showLoginModal.value = true
    return
  }
  router.push('/i18n-manager')
  closeDrawer()
}

const goToProductManager = () => {
  if (!isAdminLoggedIn.value) {
    showMessage('warning', t('common_adminPermissionProduct'))
    showLoginModal.value = true
    return
  }
  router.push('/product-management')
  closeDrawer()
}

// 管理员相关函数
const openLoginModal = () => {
  showLoginModal.value = true
}

const handleLoginSuccess = () => {
  // 登录成功消息已在 useAdminAuth.js 中显示，此处不再重复显示
  showLoginModal.value = false
}

const handleLoginFailed = (error) => {
  console.error(`${t('common_loginFailed')}:`, error)
}

const handleLogout = () => {
  logout()
  // 如果当前在受保护页面，跳转到首页
  const currentPath = router.currentRoute.value.path
  if (currentPath.includes('/i18n-manager') || currentPath.includes('/product-management')) {
    router.push('/')
  }
}

const switchLanguage = async (lang) => {
  const result = setLanguage(lang)
  if (result) {
    // 等待语言切换完成
    await nextTick()
    // 关闭抽屉
    closeDrawer()
  } else {
    closeDrawer()
  }
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
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

/* 抽屉头部 */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
}

.drawer-title {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #212529;
}

.drawer-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: #6c757d;
  font-size: 16px;
}

.drawer-close-btn:hover {
  background: #f8f9fa;
  color: #495057;
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
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid #e9ecef;
  color: #495057;
  font-weight: 500;
  background: #ffffff;
}

.admin-login-item:hover {
  background: #f8f9fa;
}

.admin-logged-in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 4px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.admin-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.logout-button {
  color: #6c757d;
  font-size: 12px;
  height: 24px;
  padding: 0 8px;
}

.logout-button:hover {
  color: #dc3545;
  background: #fff5f5;
}

/* 菜单部分样式 */
.menu-section {
  padding: 16px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #6c757d;
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
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid transparent;
  background: #ffffff;
}

.menu-item:hover {
  background: #f8f9fa;
}

.menu-item:active {
  background: #e9ecef;
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 12px;
  color: #495057;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
  flex: 1;
}

.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item.disabled:hover {
  background: transparent;
  border-color: #e9ecef;
}

/* 语言切换部分样式 */
.language-section {
  padding: 16px;
}

.language-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.language-option {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid #e9ecef;
  position: relative;
  background: #ffffff;
}

.language-option:hover {
  background: #f8f9fa;
}

.language-option.active {
  background: #f8f9fa;
  border-color: #dee2e6;
}

.language-flag {
  font-size: 16px;
  margin-right: 12px;
}

.language-text {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
  flex: 1;
}

.language-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: #6c757d;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .drawer-panel {
    width: 280px;
  }
  
  .drawer-header {
    padding: 12px 16px;
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
