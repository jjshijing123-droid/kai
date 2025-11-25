<template>
  <!-- 管理员权限拒绝组件 -->
  <a-result
    status="403"
    :title="t('common_needAdminTitle')"
    :sub-title="t(subtitleKey)"
  >
    <template #extra>
      <a-space>
        <a-button type="primary" @click="handleLoginClick">
          <template #icon>
            <UserOutlined />
          </template>
          {{ t('common_adminLogin') }}
        </a-button>
        <a-button @click="handleBackClick">
          {{ computedBackButtonText }}
        </a-button>
      </a-space>
    </template>
  </a-result>

  <!-- 登录模态框 -->
  <AdminLoginModal
    v-model:open="showLoginModal"
    @login-success="handleLoginSuccess"
    @login-failed="handleLoginFailed"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import AdminLoginModal from './AdminLoginModal.vue'
import { UserOutlined } from '@ant-design/icons-vue'

const { t } = useI18n()
const router = useRouter()
const { isAdminLoggedIn } = useAdminAuth()

// Props定义
const props = defineProps({
  // 副标题的国际化键
  subtitleKey: {
    type: String,
    default: 'common_needAdminSubtitleProduct'
  },
  // 返回按钮的目标路径
  redirectPath: {
    type: String,
    default: '/'
  },
  // 返回按钮的文本（可选，默认使用国际化文本）
  backButtonText: {
    type: String,
    default: ''
  },
  // 登录成功后的回调函数
  onLoginSuccess: {
    type: Function,
    default: null
  }
})

// 响应式数据
const showLoginModal = ref(false)

// 处理登录按钮点击
const handleLoginClick = () => {
  showLoginModal.value = true
}

// 处理返回按钮点击
const handleBackClick = () => {
  router.push(props.redirectPath)
}

// 处理登录成功
const handleLoginSuccess = () => {
  showLoginModal.value = false
  
  // 如果有自定义登录成功回调，则执行
  if (props.onLoginSuccess) {
    props.onLoginSuccess()
  }
  
  // 登录成功后可以触发页面刷新或其他操作
  console.log('Admin login successful, access granted')
}

// 处理登录失败
const handleLoginFailed = (error) => {
  console.error('Admin login failed:', error)
}

// 计算返回按钮文本
const computedBackButtonText = computed(() => {
  if (props.backButtonText) {
    return props.backButtonText
  }
  
  // 根据重定向路径决定默认文本
  if (props.redirectPath === '/') {
    return t('common_backToHome')
  }
  
  return t('common_back')
})
</script>

<style scoped>
/* 可以添加一些自定义样式 */
.admin-access-denied {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px 20px;
}
</style>