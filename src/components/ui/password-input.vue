<template>
  <div class="password-input-wrapper">
    <div class="password-input-container" :class="{ 'password-focused': focused }">
      <div class="input-prefix" v-if="$slots.prefix">
        <slot name="prefix"></slot>
      </div>
      <input
        :type="showPassword ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :class="inputClasses"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keypress="handleKeypress"
        ref="inputRef"
      />
      <div class="input-suffix">
        <button
          v-if="showToggle"
          type="button"
          class="password-toggle"
          @click="togglePassword"
          :title="showPassword ? '隐藏密码' : '显示密码'"
        >
          <LucideIcon v-if="showPassword" name="Eye" size="14" class="icon" />
          <LucideIcon v-else name="EyeOff" size="14" class="icon" />
        </button>
        <slot name="suffix"></slot>
      </div>
    </div>
    <div v-if="errorMessage" class="input-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import LucideIcon from './LucideIcon.vue'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  maxlength: {
    type: [Number, String],
    default: undefined
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['small', 'default', 'large'].includes(value)
  },
  error: {
    type: Boolean,
    default: false
  },
  showToggle: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'keypress', 'pressEnter'])

// 响应式数据
const inputRef = ref(null)
const focused = ref(false)
const showPassword = ref(false)

// 计算属性
const inputClasses = computed(() => {
  return [
    'password-input',
    {
      'input-small': props.size === 'small',
      'input-large': props.size === 'large',
      'input-error': props.error,
      'input-disabled': props.disabled
    }
  ]
})

const errorMessage = computed(() => {
  return props.error ? '输入错误' : ''
})

// 方法
const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const handleFocus = (event) => {
  focused.value = true
  emit('focus', event)
}

const handleBlur = (event) => {
  focused.value = false
  emit('blur', event)
}

const handleKeypress = (event) => {
  emit('keypress', event)
  if (event.key === 'Enter') {
    emit('pressEnter', event)
  }
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// 暴露方法
const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

defineExpose({
  focus,
  blur
})
</script>

<style scoped>
.password-input-wrapper {
  width: 100%;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--neutral-6);
  border-radius: 6px;
  background: var(--neutral-1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.password-input-container:hover {
  border-color: var(--primary-9);
}

.password-focused {
  border-color: var(--primary-9);
  box-shadow: 0 0 0 2px var(--primary-opacity-3);
}

.input-prefix,
.input-suffix {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  color: var(--neutral-9);
  font-size: 14px;
}

.input-suffix {
  gap: 8px;
}

.password-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 12px;
  font-size: 14px;
  color: var(--neutral-12);
  line-height: 1.5;
  font-family: inherit;
}

.password-input::placeholder {
  color: var(--neutral-8);
}

.password-input:disabled {
  color: var(--neutral-9);
  background: var(--neutral-3);
  cursor: not-allowed;
}

.input-small {
  min-height: 32px;
}

.input-small .password-input {
  font-size: 13px;
  padding: 0 8px;
}

.input-small .input-prefix,
.input-small .input-suffix {
  padding: 0 8px;
  font-size: 13px;
}

.input-large {
  min-height: 40px;
}

.input-large .password-input {
  font-size: 15px;
  padding: 0 16px;
}

.input-large .input-prefix,
.input-large .input-suffix {
  padding: 0 16px;
  font-size: 15px;
}

.input-default {
  min-height: 36px;
}

.input-error {
  border-color: var(--red-9);
}

.input-error:hover {
  border-color: var(--red-9);
}

.password-toggle {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
  border-radius: 2px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--neutral-9);
}

.password-toggle:hover {
  background: var(--neutral-opacity-2);
  color: var(--neutral-11);
}

.password-toggle:active {
  background: var(--neutral-opacity-4);
}

.password-toggle .icon {
  font-size: 14px;
}

.input-error .password-input-container {
  border-color: var(--red-9);
}

.input-error .password-input-container:hover {
  border-color: var(--red-9);
}

.input-error .password-input-container:focus-within {
  border-color: var(--red-9);
  box-shadow: 0 0 0 2px var(--red-opacity-3);
}

.input-error .input-error-text {
  color: var(--red-9);
  font-size: 12px;
  margin-top: 4px;
}

/* 禁用状态 */
.input-disabled {
  cursor: not-allowed;
}

.input-disabled .password-input-container {
  background: var(--neutral-3);
  border-color: var(--neutral-6);
}

.input-disabled .password-input {
  color: var(--neutral-9);
  background: transparent;
}

.input-disabled .input-prefix,
.input-disabled .input-suffix {
  color: var(--neutral-8);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .password-input {
    font-size: 13px;
  }
  
  .input-large .password-input {
    font-size: 14px;
  }
}
</style>