<template>
  <a-drawer
    :open="isOpen"
    placement="right"
    :closable="false"
    @close="closeDrawer"
    width="320"
    class="custom-drawer"
    :bodyStyle="{
    padding: '0px 24px'
  }" 
  >
    <template #title>
      <div class="custom-drawer-header">
        <div class="drawer-title"></div>
        <div class="drawer-close" @click="closeDrawer">
          <CloseOutlined />
        </div>
      </div>
    </template>
    <div class="drawer-content">
      <!-- 管理员认证部分 -->
      <div class="admin-section">
        <h3 class="section-title">管理员</h3>
        <div class="admin-content">
          <div v-if="!isAdminLoggedIn" class="admin-login-item" @click="openLoginModal">
            <div class="menu-icon">
              <LoginOutlined />
            </div>
            <span class="menu-text">管理员登录</span>
          </div>
          <div v-else class="admin-logged-in">
            <div class="admin-info">
              <div class="menu-icon">
                <UserOutlined />
              </div>
              <span class="menu-text">已登录</span>
            </div>
            <a-button
              type="text"
              size="small"
              @click="handleLogout"
              class="logout-button"
            >
              <template #icon>
                <LogoutOutlined />
              </template>
              登出
            </a-button>
          </div>
        </div>
      </div>

      <!-- 导航菜单部分 -->
      <div class="menu-section">
        <h3 class="section-title">{{ t('drawer_navigation') }}</h3>
        <div class="menu-list">
          <div class="menu-item" @click="goToHome">
            <div class="menu-icon">
              <HomeOutlined />
            </div>
            <span class="menu-text">{{ t('drawer_home') }}</span>
          </div>
          
          <div
            class="menu-item"
            @click="goToI18nManager"
            :class="{ 'disabled': !isAdminLoggedIn }"
            :title="!isAdminLoggedIn ? '需要管理员权限' : ''"
          >
            <div class="menu-icon">
              <GlobalOutlined />
            </div>
            <span class="menu-text">{{ t('header_i18nManager') }}</span>
          </div>
          
          <div
            class="menu-item"
            @click="goToProductManager"
            :class="{ 'disabled': !isAdminLoggedIn }"
            :title="!isAdminLoggedIn ? '需要管理员权限' : ''"
          >
            <div class="menu-icon">
              <AppstoreOutlined />
            </div>
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
            <span class="language-text">中文</span>
            <div class="language-check" v-if="currentLanguage === 'zh-CN'">
              <CheckOutlined />
            </div>
          </div>
          
          <div 
            class="language-option" 
            :class="{ active: currentLanguage === 'en' }"
            @click="switchLanguage('en')"
          >
            <span class="language-flag">🇺🇸</span>
            <span class="language-text">English</span>
            <div class="language-check" v-if="currentLanguage === 'en'">
              <CheckOutlined />
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
  </a-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { useRouter } from 'vue-router'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import AdminLoginModal from './AdminLoginModal.vue'
import {
  HomeOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  CheckOutlined,
  CloseOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

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
  if (!isAdminLoggedIn) {
    message.warning('需要管理员权限才能访问翻译管理器')
    showLoginModal.value = true
    return
  }
  router.push('/i18n-manager')
  closeDrawer()
}

const goToProductManager = () => {
  if (!isAdminLoggedIn) {
    message.warning('需要管理员权限才能访问产品管理')
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
  message.success('管理员登录成功！')
  showLoginModal.value = false
}

const handleLoginFailed = (error) => {
  console.error('登录失败:', error)
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
.custom-drawer :deep(.ant-drawer-header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.custom-drawer :deep(.ant-drawer-title) {
  flex: 1;
  margin: 0;
}

.custom-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.drawer-title {
  flex: 1;
}

.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #8c8c8c;
  font-size: 16px;
}

.drawer-close:hover {
  background: #f5f5f5;
  color: #262626;
}

.drawer-close:active {
  background: #e6f7ff;
  color: #1890ff;
}

.custom-drawer :deep(.ant-drawer-body) {
  padding: 0;
}


.drawer-content {
  padding: 0;
}

/* 管理员部分样式 */
.admin-section {
  padding: 20px 0px;
  border-bottom: 1px solid #f0f0f0;
}

.admin-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-login-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #f0f0f0;
  color: #1890ff;
  font-weight: 500;
}

.admin-login-item:hover {
  background: #f0f9ff;
  border-color: #91d5ff;
}

.admin-logged-in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.admin-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.logout-button {
  color: #8c8c8c;
  font-size: 12px;
  height: 24px;
  padding: 0 8px;
}

.logout-button:hover {
  color: #ff4d4f;
  background: #fff2f0;
}

/* 菜单部分样式 */
.menu-section {
  padding: 20px 0px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 500;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #f0f0f0 !important;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.menu-item:hover {
  background: #f5f5f5;
  border-color: #e0e0e0;
}

.menu-item:active {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 12px;
  color: #595959;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  flex: 1;
}

.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item.disabled:hover {
  background: transparent;
  border-color: #f0f0f0;
}

/* 语言切换部分样式 */
.language-section {
  padding: 20px 0px;
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
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #f0f0f0;
  position: relative;
}

.language-option:hover {
  background: #f5f5f5;
  border-color: #e0e0e0;
}

.language-option.active {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.language-flag {
  font-size: 16px;
  margin-right: 12px;
}

.language-text {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  flex: 1;
}

.language-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: #1890ff;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .custom-drawer :deep(.ant-drawer-header) {
    padding: 16px 20px;
  }
  
  .menu-section,
  .language-section {
    padding: 20px 0px;
  }
  
  .menu-item,
  .language-option {
    padding: 10px 14px;
  }
}
</style>
