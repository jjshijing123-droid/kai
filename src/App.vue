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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header.vue'
import AdminLoginModal from './components/AdminLoginModal.vue'
import { useAdminAuth } from './composables/useAdminAuth.js'

const route = useRoute()
const { showLoginModal, closeLoginModal } = useAdminAuth()

// 检测是否为3D查看器页面或图片展示页面（这些页面使用自己的header）
const is3DViewerPage = computed(() => {
  return route.path.startsWith('/product-3d/') || route.path.startsWith('/product-images/')
})

// 登录成功处理
const handleLoginSuccess = () => {
  closeLoginModal()
}
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
  min-height: calc(100vh - 64px); /* 仍然保留 min-height 作为 fallback */
  /* 移除固定高度和overflow属性，让浏览器处理滚动 */
}

/* 3D查看器页面全屏样式 */
.main-content.full-screen {
  margin-top: 0;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden; /* 防止滚动条影响3D体验 */
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  min-height: 100%; /* 确保容器填满内容区域 */
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
