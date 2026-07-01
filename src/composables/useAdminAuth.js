import { ref, computed } from 'vue'
import { showToast } from '../lib/toast.js'

// 简单的消息提示实现（替代Ant Design Vue message）
export const showMessage = showToast

// 登录状态管理
const isAdminLoggedIn = ref(false)
const adminToken = ref(localStorage.getItem('admin_token') || null)

// 全局登录模态框状态
const showLoginModal = ref(false)

// 本地存储键名
const ADMIN_TOKEN_KEY = 'admin_token'
const ADMIN_SESSION_KEY = 'admin_session'

// 初始化时检查登录状态
const checkStoredSession = async () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (token) {
    // 验证 token 是否仍然有效
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        isAdminLoggedIn.value = true
        adminToken.value = token
      } else {
        // token 过期，清除
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        localStorage.removeItem(ADMIN_SESSION_KEY)
        adminToken.value = null
      }
    } catch {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      adminToken.value = null
    }
  }
}

// 检查登录状态
const isAuthenticated = computed(() => isAdminLoggedIn.value)

// 登录函数 — 调用后端认证
const login = async (username, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const data = await response.json()

    if (data.success) {
      isAdminLoggedIn.value = true
      adminToken.value = data.data.token
      localStorage.setItem(ADMIN_TOKEN_KEY, data.data.token)
      localStorage.setItem(ADMIN_SESSION_KEY, 'true')
      return { success: true }
    } else {
      return { success: false, error: data.message || '登录失败' }
    }
  } catch (error) {
    console.error('登录错误:', error)
    return { success: false, error: '网络错误，请重试' }
  }
}

// 登出函数
const logout = () => {
  isAdminLoggedIn.value = false
  adminToken.value = null
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

// 获取认证 header
const getAuthHeader = () => {
  if (adminToken.value) {
    return { 'Authorization': `Bearer ${adminToken.value}` }
  }
  return {}
}

// 检查是否有权限访问特定功能
const checkPermission = (resource) => {
  if (!isAdminLoggedIn.value) {
    return false
  }

  const protectedResources = ['i18n-manager', 'product-management']
  return protectedResources.includes(resource)
}

// 打开登录模态框
const openLoginModal = () => {
  showLoginModal.value = true
}

// 关闭登录模态框
const closeLoginModal = () => {
  showLoginModal.value = false
}

// 初始化检查存储的会话
checkStoredSession()

export function useAdminAuth() {
  return {
    // 状态
    isAdminLoggedIn,
    isAuthenticated,
    showLoginModal,
    adminToken,

    // 方法
    login,
    logout,
    checkPermission,
    openLoginModal,
    closeLoginModal,
    getAuthHeader
  }
}

export default useAdminAuth
