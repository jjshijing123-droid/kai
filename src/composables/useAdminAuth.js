import { ref, computed } from 'vue'
import { showToast } from '../lib/toast.js'

// 简单的消息提示实现（替代Ant Design Vue message）
export const showMessage = showToast

// 管理员账号配置
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
}

// 登录状态管理
const isAdminLoggedIn = ref(false)

// 全局登录模态框状态
const showLoginModal = ref(false)

// 本地存储键名
const ADMIN_SESSION_KEY = 'admin_session'

// 初始化时检查本地存储的登录状态
const checkStoredSession = () => {
  const storedSession = localStorage.getItem(ADMIN_SESSION_KEY)
  if (storedSession === 'true') {
    isAdminLoggedIn.value = true
  }
}

// 检查登录状态
const isAuthenticated = computed(() => isAdminLoggedIn.value)

// 登录函数
const login = async (username, password) => {
  try {
    // 模拟异步登录过程
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      isAdminLoggedIn.value = true
      localStorage.setItem(ADMIN_SESSION_KEY, 'true')
      return { success: true }
    } else {
      return { success: false, error: '用户名或密码错误' }
    }
  } catch (error) {
    console.error('登录错误:', error)
    return { success: false, error: '登录失败，请重试' }
  }
}

// 登出函数
const logout = () => {
  isAdminLoggedIn.value = false
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

// 检查是否有权限访问特定功能
const checkPermission = (resource) => {
  if (!isAdminLoggedIn.value) {
    return false
  }
  
  // 这里可以定义更细粒度的权限控制
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
    isAdminLoggedIn, // 返回响应式引用而不是当前值
    isAuthenticated,
    showLoginModal,

    // 方法
    login,
    logout,
    checkPermission,
    openLoginModal,
    closeLoginModal
  }
}

// 也提供一个默认导出版本以兼容不同的导入方式
export default useAdminAuth