import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'

// 管理员账号配置
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
}

// 登录状态管理
const isAdminLoggedIn = ref(false)

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
      message.success('管理员登录成功！')
      return { success: true }
    } else {
      message.error('用户名或密码错误')
      return { success: false, error: '用户名或密码错误' }
    }
  } catch (error) {
    console.error('登录错误:', error)
    message.error('登录失败，请重试')
    return { success: false, error: '登录失败' }
  }
}

// 登出函数
const logout = () => {
  isAdminLoggedIn.value = false
  localStorage.removeItem(ADMIN_SESSION_KEY)
  message.success('已成功登出')
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

// 初始化检查存储的会话
checkStoredSession()

export function useAdminAuth() {
  return {
    // 状态
    isAdminLoggedIn, // 返回响应式引用而不是当前值
    isAuthenticated,
    
    // 方法
    login,
    logout,
    checkPermission
  }
}

// 也提供一个默认导出版本以兼容不同的导入方式
export default useAdminAuth