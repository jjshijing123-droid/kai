<template>
  <a-modal
    v-model:open="isOpen"
    :title="t('common_adminLogin')"
    width="400px"
    @cancel="handleCancel"
    :footer="null"
    :maskClosable="false"
    class="admin-login-modal"
  >
    <a-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      layout="vertical"
      @finish="handleLogin"
    >
      <div class="login-header">
        <div class="login-icon">
          <UserOutlined />
        </div>
        <p class="login-description">{{ t('common_enterCredentials') }}</p>
      </div>

      <a-form-item
        :label="t('common_username')"
        name="username"
      >
        <a-input
          v-model:value="loginForm.username"
          :placeholder="t('common_enterUsername')"
          size="large"
          :prefix="h(UserOutlined)"
          @pressEnter="handleLogin"
        />
      </a-form-item>

      <a-form-item
        :label="t('common_password')"
        name="password"
      >
        <a-input-password
          v-model:value="loginForm.password"
          :placeholder="t('common_enterPassword')"
          size="large"
          :prefix="h(LockOutlined)"
          @pressEnter="handleLogin"
        />
      </a-form-item>

      <a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          size="large"
          :loading="loading"
          block
        >
          {{ loading ? t('common_loggingIn') : t('common_login') }}
        </a-button>
      </a-form-item>
    </a-form>

  </a-modal>
</template>

<script setup>
import { ref, h, watch, computed } from 'vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useAdminAuth } from '../composables/useAdminAuth'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'login-success', 'login-failed'])

// 使用管理员认证 composable
const { login } = useAdminAuth()

// 响应式数据
const loginForm = ref({
  username: '',
  password: ''
})

const loginFormRef = ref()
const loading = ref(false)

// 计算属性
const isOpen = computed(() => props.open)

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: t('common_enterUsername'), trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('common_enterPassword'), trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  try {
    await loginFormRef.value.validateFields()
    
    loading.value = true
    const result = await login(loginForm.value.username, loginForm.value.password)
    
    if (result.success) {
      emit('login-success')
      handleCancel()
      resetForm()
    } else {
      emit('login-failed', result.error)
    }
  } catch (error) {
    console.error(`${t('common_loginFailed')}:`, error)
  } finally {
    loading.value = false
  }
}

// 取消登录
const handleCancel = () => {
  emit('update:open', false)
  resetForm()
}

// 重置表单
const resetForm = () => {
  loginForm.value = {
    username: '',
    password: ''
  }
  loginFormRef.value?.clearValidate()
}

// 监听模态框关闭，重置表单
watch(isOpen, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})
</script>

<style scoped>
.admin-login-modal :deep(.ant-modal-header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 24px;
}

.admin-login-modal :deep(.ant-modal-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-login-modal :deep(.ant-modal-title)::before {
  content: '🔐';
  font-size: 20px;
}

.admin-login-modal :deep(.ant-modal-body) {
  padding: 24px;
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-icon {
  font-size: 48px;
  color: #1890ff;
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.login-description {
  color: #8c8c8c;
  font-size: 14px;
  margin: 0;
}

.admin-login-modal :deep(.ant-form-item) {
  margin-bottom: 20px;
}

.admin-login-modal :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #262626;
}

.admin-login-modal :deep(.ant-input) {
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  transition: all 0.3s ease;
}

.admin-login-modal :deep(.ant-input:focus) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.admin-login-modal :deep(.ant-input-affix-wrapper) {
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  transition: all 0.3s ease;
}

.admin-login-modal :deep(.ant-input-affix-wrapper:focus) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.admin-login-modal :deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  height: 40px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  transition: all 0.3s ease;
}

.admin-login-modal :deep(.ant-btn-primary:hover) {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.admin-login-modal :deep(.ant-btn-primary:active) {
  transform: translateY(0);
}

.admin-login-modal :deep(.ant-btn-primary[disabled]) {
  background: #f0f0f0;
  color: #bfbfbf;
  border: none;
  box-shadow: none;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .admin-login-modal :deep(.ant-modal) {
    top: 20px;
    max-width: 100%;
    margin: 0 16px;
  }
  
  .admin-login-modal :deep(.ant-modal-header) {
    padding: 16px 20px;
  }
  
  .admin-login-modal :deep(.ant-modal-body) {
    padding: 20px;
  }
  
  .login-icon {
    font-size: 40px;
  }
}
</style>