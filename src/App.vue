<template>
  <div class="app">
    <header v-if="!is3DViewerPage" class="layout-header">
      <Header />
    </header>
    
    <main :class="['main-content', { 'full-screen': is3DViewerPage }]">
      <div class="container">
        <router-view />
      </div>
    </main>
    
    <!-- 全局登录模态框 -->
    <AdminLoginModal
      v-model:open="showLoginModal"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Header from './components/Header.vue'
import AdminLoginModal from './components/AdminLoginModal.vue'
import { useAdminAuth } from './composables/useAdminAuth.js'
import { createShortcutRegistry } from './composables/useKeyboardShortcuts.js'
import { useThemeStore } from './stores/themeStore'

const route = useRoute()
const router = useRouter()
const { showLoginModal, closeLoginModal } = useAdminAuth()
const themeStore = useThemeStore()

// sessionStorage 中保存的重定向路径键名（与路由守卫一致）
const REDIRECT_AFTER_LOGIN_KEY = 'redirect_after_login'

// 检测是否为3D查看器页面或图片展示页面（这些页面使用自己的header）
const is3DViewerPage = computed(() => {
  return route.path.startsWith('/product-3d/') || route.path.startsWith('/product-images/')
})

// 登录成功处理 — 跳转到之前保存的目标路径
const handleLoginSuccess = () => {
  // 先关闭登录弹窗
  closeLoginModal()
  // 检查是否有保存的重定向路径
  const redirectPath = sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)
  if (redirectPath) {
    sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY)
    // 延迟一帧执行，确保 isAdminLoggedIn 的响应式更新先完成，
    // 这样路由守卫重新检查权限时能读到最新的登录状态
    setTimeout(() => {
      router.push(redirectPath)
    }, 0)
  }
}

// 获取快捷键注册器实例并挂载事件监听器
const { mount, unmount } = createShortcutRegistry()
onMounted(() => {
  mount()
  themeStore.initTheme()
})

onBeforeUnmount(() => {
  unmount()
})
</script>


<style scoped>
.app {
  min-height: 100vh;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.layout-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0;
  height: 64px;
}

.main-content {
  margin-top: 64px; /* 为固定头部留出空间 */
  padding: 0px 0;
  flex: 1; /* 使用 flex 布局占据剩余空间 */
  height: calc(100vh - 64px); 
  overflow-y: auto;
}

/* 3D查看器页面全屏样式 */
.main-content.full-screen {
  margin-top: 0;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden; /* 防止滚动条影响3D体验 */
}



/* 3D查看器页面容器全屏样式 */
.main-content.full-screen .container {
  max-width: none;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  height: 100vh;
}
</style>
