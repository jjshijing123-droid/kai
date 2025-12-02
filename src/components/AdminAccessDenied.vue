<template>
  <!-- 管理员权限拒绝组件 -->
  <div class="admin-access-denied">
    <Card class="access-denied-card">
      <div class="result-content">
        <div class="result-icon">
          <LucideIcon name="ShieldX" size="72" />
        </div>
        <div class="result-text">
          <h1 class="result-title">{{ t('common_needAdminTitle') }}</h1>
          <p class="result-subtitle">{{ t(subtitleKey) }}</p>
        </div>
        <div class="result-actions">
          <Button variant="primary" @click="handleLoginClick" class="login-button">
            <LucideIcon name="User" size="16" class="icon" />
            {{ t('common_adminLogin') }}
          </Button>
          <Button @click="handleBackClick" class="back-button">
            {{ computedBackButtonText }}
          </Button>
        </div>
      </div>
    </Card>

    <!-- 登录模态框 -->
    <AdminLoginModal
      :open="showLoginModal"
      @update:open="showLoginModal = $event"
      @login-success="handleLoginSuccess"
      @login-failed="handleLoginFailed"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import AdminLoginModal from './AdminLoginModal.vue'
import Button from './ui/button.vue'
import Card from './ui/card.vue'
import LucideIcon from './ui/LucideIcon.vue'

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
.admin-access-denied {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px 20px;
}

.access-denied-card {
  max-width: 500px;
  width: 100%;
  text-align: center;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  background: white;
}

.result-content {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.result-icon {
  opacity: 0.7;
  margin-bottom: 8px;
  color: #ff4d4f;
}

.result-text {
  text-align: center;
}

.result-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.result-subtitle {
  font-size: 16px;
  color: #8c8c8c;
  margin: 0;
  line-height: 1.5;
}

.result-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.login-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.login-button:hover {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  background: #f0f2f5;
  color: #4a4a4a;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
}

.icon {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 576px) {
  .admin-access-denied {
    padding: 20px 16px;
    min-height: 300px;
  }
  
  .result-content {
    padding: 30px 16px;
    gap: 20px;
  }
  
  .result-icon {
    font-size: 56px;
  }
  
  .result-title {
    font-size: 20px;
  }
  
  .result-subtitle {
    font-size: 14px;
  }
  
  .result-actions {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
  
  .login-button,
  .back-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .access-denied-card {
    max-width: 100%;
  }
  
  .result-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .login-button,
  .back-button {
    width: 100%;
  }
}
</style>