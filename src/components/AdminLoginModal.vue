<template>
  <!-- 自定义模态框实现 -->
  <div v-if="isOpen" class="modal-overlay" @click="handleCancel">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">{{ t('common_adminLogin') }}</h2>
        <button class="modal-close" @click="handleCancel">✕</button>
      </div>
      <div class="modal-body">
        <p class="modal-description">{{ t('common_enterCredentials') }}</p>
        <form
          @submit.prevent="handleLogin"
          class="login-form"
        >
          <div class="form-item">
            <label for="username" class="form-label">{{ t('common_username') }}</label>
            <input
              id="username"
              v-model="loginForm.username"
              :placeholder="t('common_enterUsername')"
              class="form-input"
              @keyup.enter="handleLogin"
              required
            />
            <div v-if="errors.username" class="form-error">{{ errors.username }}</div>
          </div>

          <div class="form-item">
            <label for="password" class="form-label">{{ t('common_password') }}</label>
            <input
              id="password"
              type="password"
              v-model="loginForm.password"
              :placeholder="t('common_enterPassword')"
              class="form-input"
              @keyup.enter="handleLogin"
              required
            />
            <div v-if="errors.password" class="form-error">{{ errors.password }}</div>
          </div>

          <div class="form-actions">
            <button
              type="button"
              @click="handleCancel"
              class="cancel-button"
            >
              {{ t('common_cancel') }}
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="login-button"
            >
              {{ loading ? t('common_loggingIn') : t('common_login') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAdminAuth } from '../composables/useAdminAuth'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-change', 'login-success', 'login-failed'])

// 使用管理员认证 composable
const { login } = useAdminAuth()

// 响应式数据
const loginForm = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const errors = ref({ username: '', password: '' })

// 本地响应式变量，用于控制Dialog的显示和隐藏
const isOpen = ref(props.open)

// 监听props.open的变化，更新本地isOpen变量
watch(() => props.open, (newVal) => {
  isOpen.value = newVal
})

// 处理Dialog的open-change事件
const handleOpenChange = (open) => {
  isOpen.value = open
  emit('open-change', open)
  if (!open) {
    resetForm()
  }
}

// 简单的表单验证
const validateForm = () => {
  let isValid = true
  errors.value = { username: '', password: '' }

  if (!loginForm.value.username.trim()) {
    errors.value.username = t('common_enterUsername')
    isValid = false
  }

  if (!loginForm.value.password) {
    errors.value.password = t('common_enterPassword')
    isValid = false
  }

  return isValid
}

// 处理登录
const handleLogin = async () => {
  try {
    if (!validateForm()) {
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
    }
  } catch (error) {
    console.error(`${t('common_loginFailed')}:`, error)
  } finally {
    loading.value = false
  }
}

// 取消登录
const handleCancel = () => {
  emit('open-change', false)
  resetForm()
}

// 重置表单
const resetForm = () => {
  loginForm.value = {
    username: '',
    password: ''
  }
  errors.value = { username: '', password: '' }
}

// 监听props变化，重置表单
watch(() => props.open, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})
</script>

<style scoped>
/* 模态框样式 */
.modal-overlay {
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 400px;
  max-width: 90vw;
  z-index: 10000;
  animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-title::before {
  content: '🔐';
  font-size: 20px;
}

.modal-close {
  cursor: pointer;
  font-size: 20px;
  color: #8c8c8c;
  transition: all 0.2s ease;
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.modal-close:hover {
  color: #1a1a1a;
  background: #f5f5f5;
}

.modal-body {
  padding: 24px;
}

.modal-description {
  color: #8c8c8c;
  font-size: 14px;
  margin-bottom: 20px;
}

/* 登录表单样式 */
.login-form {
  width: 100%;
}

/* 表单样式 */
.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #262626;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  font-size: 14px;
  transition: all 0.3s ease;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.form-error {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

/* 登录按钮样式 */
.login-button {
  flex: 1;
  height: 40px;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  color: white;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
}

.login-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  background: #f0f0f0;
  color: #bfbfbf;
  border: none;
  box-shadow: none;
  cursor: not-allowed;
}

/* 取消按钮样式 */
.cancel-button {
  flex: 1;
  height: 40px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-weight: 500;
  color: #4d4d4d;
  font-size: 14px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.cancel-button:hover {
  background: #e8e8e8;
  border-color: #bfbfbf;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .modal-content {
    width: 90vw;
  }
  
  .modal-header {
    padding: 16px 20px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>