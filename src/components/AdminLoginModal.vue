<template>
<Modal
  :open="modalOpen"
  :title="modalTitle"
  width="modal-sm"
  @close="handleCancel"
  :show-footer="false"
>
  <div class="login-form-container">
    <div class="login-header">
    </div>

    <form @submit.prevent="handleLogin" class="login-form">
      <div class="form-item">
        <label class="form-label">{{ t('common_username') }}</label>
        <Input
          v-model="loginForm.username"
          type="text"
          :placeholder="t('common_enterUsername')"
          size="large"
          paddingX="0" 
          :disabled="loading"
          @keypress.enter="handleLogin"
          class="form-input"
        >
          <template #prefix>
            <LucideIcon name="User" size="14" class="input-icon" />
          </template>
        </Input>
      </div>

      <div class="form-item">
        <label class="form-label">{{ t('common_password') }}</label>
        <PasswordInput
          v-model="loginForm.password"
          :placeholder="t('common_enterPassword')"
          :disabled="loading"
          size="large"
          @pressEnter="handleLogin"
          class="form-input"
        >
          <template #prefix>
            <LucideIcon name="Lock" size="14" class="input-icon" />
          </template>
        </PasswordInput>
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

// 简单的消息提示实现
const showMessage = (type, text) => {
  const messageDiv = document.createElement('div')
  messageDiv.className = `message-${type}`
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
    padding: 12px 20px;
    border-radius: 10px;
    color: white;
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    max-width: 400px;
    word-wrap: break-word;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    opacity: 0;
  `
  
  if (type === 'warning') {
    messageDiv.style.backgroundColor = 'var(--orange-8)'
  } else if (type === 'error') {
    messageDiv.style.backgroundColor = 'var(--red-9)'
  } else if (type === 'success') {
    messageDiv.style.backgroundColor = 'var(--green-8)'
  } else {
    messageDiv.style.backgroundColor = 'var(--primary-8)'
  }
  
  messageDiv.textContent = text
  document.body.appendChild(messageDiv)
  
  // 入场动画
  setTimeout(() => {
    messageDiv.style.opacity = '1'
    messageDiv.style.transform = 'translateX(-50%) translateY(0)'
  }, 10)
  
  // 3秒后自动移除
  setTimeout(() => {
    messageDiv.style.opacity = '0'
    messageDiv.style.transform = 'translateX(-50%) translateY(-100%)'
    setTimeout(() => {
      if (messageDiv.parentNode) {
        document.body.removeChild(messageDiv)
      }
    }, 300)
  }, 3000)
}

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
      showMessage('warning', t('common_enterUsername'))
      return
    }
    
    if (!loginForm.value.password.trim()) {
      showMessage('warning', t('common_enterPassword'))
      return
    }
    
    loading.value = true
    const result = await login(loginForm.value.username, loginForm.value.password)
    
    if (result.success) {
      showMessage('success', t('common_adminLoginSuccess'))
      emit('login-success')
      handleCancel()
      resetForm()
    } else {
      showMessage('error', result.error || t('common_loginFailed'))
      emit('login-failed', result.error)
    }
  } catch (error) {
    console.error(`${t('common_loginFailed')}:`, error)
    showMessage('error', t('common_loginFailed'))
    emit('login-failed', error.message)
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
  margin-bottom: 0px;
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
  color: var(--neutral-11);
  line-height: 1.5;
}

.form-input {
  /* 覆盖默认样式 */
}


.input-icon {
  color: var(--neutral-9);
}

.form-actions {
  margin-top: 20px;
}

.login-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--primary-9), var(--green-8));
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px var(--primary-opacity-4);
  width: 100%;
  height: 44px;
}

.login-submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-10), var(--green-9));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--primary-opacity-6);
}

.login-submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-submit-btn:disabled {
  background: var(--neutral-3);
  color: var(--neutral-8);
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