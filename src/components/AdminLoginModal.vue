<template>
<Modal
  :open="modalOpen"
  :title="modalTitle"
  width="400px"
  @close="handleCancel"
  :show-footer="false"
>
  <div class="login-form-container">
    <div class="login-header">
      <div class="login-icon">
        <LucideIcon name="Lock" size="48" />
      </div>
      <p class="login-description">{{ t('common_enterCredentials') }}</p>
    </div>

    <form @submit.prevent="handleLogin" class="login-form">
      <div class="form-item">
        <label class="form-label">{{ t('common_username') }}</label>
        <div class="input-with-icon">
          <Input
            v-model="loginForm.username"
            type="text"
            :placeholder="t('common_enterUsername')"
            size="large"
            :disabled="loading"
            @keypress.enter="handleLogin"
            class="form-input"
          />
          <LucideIcon name="User" size="14" class="input-icon" />
        </div>
      </div>

      <div class="form-item">
        <label class="form-label">{{ t('common_password') }}</label>
        <div class="input-with-icon">
          <PasswordInput
            v-model="loginForm.password"
            :placeholder="t('common_enterPassword')"
            :disabled="loading"
            size="large"
            @pressEnter="handleLogin"
            class="form-input"
          />
          <LucideIcon name="Lock" size="14" class="input-icon" />
        </div>
      </div>

      <div class="form-actions">
        <Button
          type="submit"
          variant="primary"
          size="large"
          :loading="loading"
          block
          class="login-submit-btn"
        >
          <LucideIcon :name="loading ? 'Loader' : 'Unlock'" size="16" class="icon" />
          {{ loading ? t('common_loggingIn') : t('common_login') }}
        </Button>
      </div>
    </form>
  </div>
</Modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useAdminAuth } from '../composables/useAdminAuth'
import { useI18n } from '../composables/useI18n.js'
import Modal from './ui/modal.vue'
import Input from './ui/input.vue'
import PasswordInput from './ui/password-input.vue'
import Button from './ui/button.vue'
import LucideIcon from './ui/LucideIcon.vue'

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

const loading = ref(false)

// 响应式数据
const modalOpen = ref(props.open)

const modalTitle = computed(() => t('common_adminLogin'))

// 监听props变化并更新本地状态
watch(() => props.open, (newVal) => {
  modalOpen.value = newVal
  if (!newVal) {
    resetForm()
  }
})

// 处理登录
const handleLogin = async () => {
  try {
    // 简单验证
    if (!loginForm.value.username.trim()) {
      alert(t('common_enterUsername'))
      return
    }
    
    if (!loginForm.value.password.trim()) {
      alert(t('common_enterPassword'))
      return
    }
    
    loading.value = true
    const result = await login(loginForm.value.username, loginForm.value.password)
    
    if (result.success) {
      emit('login-success')
      handleCancel()
      resetForm()
    } else {
      emit('login-failed', result.error)
      alert(result.error || t('common_loginFailed'))
    }
  } catch (error) {
    console.error(`${t('common_loginFailed')}:`, error)
    emit('login-failed', error.message)
    alert(t('common_loginFailed'))
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
}
</script>

<style scoped>
.admin-login-modal {
  /* 自定义模态框样式 */
}

.login-form-container {
  padding: 24px;
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-icon {
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

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  line-height: 1.5;
}

.form-input {
  /* 覆盖默认样式 */
}

.input-with-icon {
  position: relative;
  width: 100%;
}

.input-with-icon .input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8c8c8c;
  z-index: 2;
  pointer-events: none;
}

.input-with-icon .form-input {
  width: 100%;
  padding-left: 36px !important;
}

.input-icon {
  color: #8c8c8c;
}

.form-actions {
  margin-top: 8px;
}

.login-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  width: 100%;
  height: 40px;
}

.login-submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.login-submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-submit-btn:disabled {
  background: #f0f0f0;
  color: #bfbfbf;
  border: none;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.login-submit-btn .icon {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-form-container {
    padding: 20px;
  }
  
  .login-submit-btn {
    font-size: 13px;
    height: 38px;
  }
  
  .login-submit-btn .icon {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .admin-login-modal .modal-content {
    max-width: 100%;
    margin: 0 16px;
  }
}
</style>