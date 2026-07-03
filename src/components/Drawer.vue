<template>
  <div>
    <!-- 简约抽屉实现 -->
    <Transition name="drawer">
      <div v-if="isOpen" class="drawer-container">
        <div class="drawer-overlay" @click="closeDrawer"></div>
        <div class="drawer-panel" @click.stop>
          <div class="drawer-header">
            <h3 class="drawer-title"></h3>
            <Button @click="closeDrawer" variant="no" size="icon40">
              <LucideIcon name="X" size="18" />
            </Button>
          </div>
          <div class="drawer-content">
            <!-- 管理员认证部分 -->
            <div class="admin-section">
              <h3 class="section-title">{{ t('common_admin') }}</h3>
              <div class="admin-content">
                <div v-if="!isAdminLoggedIn" class="admin-login-item" @click="handleOpenLoginModal">
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
    </Transition>
    

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { useRouter } from 'vue-router'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import { showToast } from '../lib/toast.js'
import { useTheme } from '../composables/useTheme.js'
import Button from './ui/button.vue'
import LucideIcon from './ui/LucideIcon.vue'

const { currentLanguage, t, setLanguage } = useI18n()
const router = useRouter()
const { isAdminLoggedIn, sessionReady, logout, checkPermission, openLoginModal } = useAdminAuth()
const { currentTheme, initTheme, toggleTheme } = useTheme()

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

// 监听抽屉打开事件，同步主题状态
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    const htmlElement = document.documentElement
    const currentHtmlTheme = htmlElement.classList.contains('dark') ? 'dark' : (htmlElement.classList.contains('light') ? 'light' : null)
    if (currentHtmlTheme) {
      currentTheme.value = currentHtmlTheme
    }
  }
})

onMounted(() => {
  initTheme()
})



const closeDrawer = () => {
  emit('close')
}

const goToHome = () => {
  router.push('/')
  closeDrawer()
}

const goToI18nManager = () => {
  if (!sessionReady.value) return
  if (!isAdminLoggedIn.value) {
    showToast('warning', t('common_adminPermissionI18n'))
    closeDrawer() // 先关闭抽屉
    openLoginModal()
    return
  }
  router.push('/i18n-manager')
  closeDrawer()
}

const goToProductManager = () => {
  if (!sessionReady.value) return
  if (!isAdminLoggedIn.value) {
    showToast('warning', t('common_adminPermissionProduct'))
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

const handleOpenLoginModal = () => {
  closeDrawer()
  openLoginModal()
}

const handleLogout = () => {
  logout()
  showToast('success', t('common_logoutSuccess'))
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
/* 抽屉容器 */
.drawer-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  overflow: hidden;
}

/* 抽屉遮罩 */
.drawer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
}

/* 抽屉面板 */
.drawer-panel {
  position: relative;
  width: 320px;
  height: 100%;
  background: var(--neutral-1);
  display: flex;
  flex-direction: column;
  transform: translateX(0);
}

/* 抽屉容器过渡动画 */
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

/* 遮罩层动画 */
.drawer-enter-active .drawer-overlay,
.drawer-leave-active .drawer-overlay {
  transition: opacity 0.3s ease;
}

.drawer-enter-from .drawer-overlay,
.drawer-leave-to .drawer-overlay {
  opacity: 0;
}

/* 抽屉面板动画 */
.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.3s ease;
}

.drawer-enter-from .drawer-panel {
  transform: translateX(100%);
}

.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
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
