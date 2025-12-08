<template>
  <!-- 密码输入组件容器，包含输入框和错误信息 -->
  <div class="password-input-wrapper">
    <!-- 密码输入框主容器，根据聚焦状态添加样式 -->
    <div class="password-input-container" :class="{ 'password-focused': focused, 'input-large': props.size === 'large', 'input-small': props.size === 'small', 'input-default': props.size === 'default' }">
      <!-- 前缀插槽，用于放置图标或其他元素 -->
      <div class="input-prefix" v-if="$slots.prefix">
        <slot name="prefix"></slot>
      </div>
      <!-- 密码输入框，根据showPassword状态切换明文/密文显示 -->
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
      <!-- 后缀区域，包含密码显示/隐藏切换按钮和自定义后缀插槽 -->
      <div class="input-suffix">
        <!-- 密码显示/隐藏切换按钮，根据showToggle prop控制是否显示 -->
        <button
          v-if="showToggle"
          type="button"
          class="password-toggle"
          @click="togglePassword"
          :title="showPassword ? '隐藏密码' : '显示密码'"
        >
          <!-- 根据showPassword状态显示不同图标 -->
          <LucideIcon v-if="showPassword" name="Eye" size="14" class="icon" />
          <LucideIcon v-else name="EyeOff" size="14" class="icon" />
        </button>
        <!-- 后缀插槽，用于放置额外元素 -->
        <slot name="suffix"></slot>
      </div>
    </div>
    <!-- 错误信息显示，根据error prop控制是否显示 -->
    <div v-if="errorMessage" class="input-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
// 引入Vue的响应式API和计算属性
import { ref, computed } from 'vue'
// 引入Lucide图标组件
import LucideIcon from './LucideIcon.vue'

// 组件属性定义
const props = defineProps({
  // 密码值，支持双向绑定
  modelValue: {
    type: String,
    default: ''
  },
  // 占位符文本
  placeholder: {
    type: String,
    default: ''
  },
  // 是否禁用输入框
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否只读
  readonly: {
    type: Boolean,
    default: false
  },
  // 最大输入长度
  maxlength: {
    type: [Number, String],
    default: undefined
  },
  // 输入框尺寸，支持small、default、large三种尺寸
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['small', 'default', 'large'].includes(value)
  },
  // 是否显示错误状态
  error: {
    type: Boolean,
    default: false
  },
  // 是否显示密码显示/隐藏切换按钮
  showToggle: {
    type: Boolean,
    default: true
  }
})

// 组件事件定义
const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'keypress', 'pressEnter'])

// 响应式数据
const inputRef = ref(null) // 输入框DOM引用
const focused = ref(false) // 输入框聚焦状态
const showPassword = ref(false) // 密码显示状态（true: 明文, false: 密文）

// 计算属性
const inputClasses = computed(() => {
  return [
    'password-input',
    {
      'input-small': props.size === 'small', // 小尺寸样式
      'input-large': props.size === 'large', // 大尺寸样式
      'input-error': props.error, // 错误状态样式
      'input-disabled': props.disabled // 禁用状态样式
    }
  ]
})

const errorMessage = computed(() => {
  return props.error ? '输入错误' : '' // 根据error prop返回错误信息
})

// 事件处理方法
const handleInput = (event) => {
  emit('update:modelValue', event.target.value) // 触发值更新事件，实现双向绑定
}

const handleFocus = (event) => {
  focused.value = true // 更新聚焦状态
  emit('focus', event) // 触发聚焦事件
}

const handleBlur = (event) => {
  focused.value = false // 更新聚焦状态
  emit('blur', event) // 触发失焦事件
}

const handleKeypress = (event) => {
  emit('keypress', event) // 触发按键事件
  if (event.key === 'Enter') {
    emit('pressEnter', event) // 当按下Enter键时，触发pressEnter事件
  }
}

// 密码显示/隐藏切换方法
const togglePassword = () => {
  showPassword.value = !showPassword.value // 切换密码显示状态
}

// 暴露方法给父组件
const focus = () => {
  inputRef.value?.focus() // 让输入框获得焦点
}

const blur = () => {
  inputRef.value?.blur() // 让输入框失去焦点
}

// 暴露方法
defineExpose({
  focus,
  blur
})
</script>

<style scoped>
/* 密码输入组件外层容器 */
.password-input-wrapper {
  width: 100%;
}

/* 密码输入框主容器 */
.password-input-container {
  height: 40px;
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--neutral-6); /* 边框颜色 */
  border-radius: 6px; /* 圆角 */
  background: var(--neutral-1); /* 背景色 */
  transition: all 0.3s ease; /* 过渡动画 */
  overflow: hidden;
}

/* 输入框容器悬停效果 */
.password-input-container:hover {
  border-color: var(--primary-9); /* 悬停时边框颜色 */
}

/* 输入框聚焦状态 */
.password-focused {
  border-color: var(--primary-9); /* 聚焦时边框颜色 */
  box-shadow: 0 0 0 2px var(--primary-opacity-3); /* 聚焦时阴影效果 */
}

/* 前缀区域样式 */
.input-prefix,
.input-suffix {
  width: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  color: var(--neutral-9);
  font-size: 14px;
}

/* 后缀区域额外样式 */
.input-suffix {
  gap: 8px; /* 后缀元素间距 */
}

/* 密码输入框样式 */
.password-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding:  0 var(--input-padding-default) ;
  font-size: 14px;
  color: var(--neutral-12);
  line-height: 1.5;
  font-family: inherit;
}

/* 密码输入框占位符样式 */
.password-input::placeholder {
  color: var(--neutral-8);
}

/* 密码输入框禁用状态 */
.password-input:disabled {
  color: var(--neutral-9);
  background: var(--neutral-3);
  cursor: not-allowed;
}

/* 小尺寸样式 */
.input-small {
  min-height: 32px;
}

.input-small .password-input {
  font-size: 13px;
  padding: 0 var(--input-padding-small);
}

.input-small .input-prefix,
.input-small .input-suffix {
  padding: 0 8px;
  font-size: 13px;
}

/* 大尺寸样式 */
.input-large {
}

.input-large .password-input {
  font-size: 15px;
  padding: 0 var(--input-padding-large);
}

.input-large .input-prefix,
.input-large .input-suffix {
  padding: 0 16px;
  font-size: 15px;
}

/* 默认尺寸样式 */
.input-default {
  min-height: 36px;
}

/* 错误状态样式 */
.input-error {
  border-color: var(--red-9);
}

.input-error:hover {
  border-color: var(--red-9);
}

/* 密码显示/隐藏切换按钮样式 */
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

/* 密码切换按钮悬停效果 */
.password-toggle:hover {
  background: var(--neutral-opacity-2);
  color: var(--neutral-11);
}

/* 密码切换按钮点击效果 */
.password-toggle:active {
  background: var(--neutral-opacity-4);
}

/* 密码切换按钮图标样式 */
.password-toggle .icon {
  font-size: 14px;
}

/* 错误状态下的输入框容器样式 */
.input-error .password-input-container {
  border-color: var(--red-9);
}

.input-error .password-input-container:hover {
  border-color: var(--red-9);
}

/* 错误状态下输入框聚焦效果 */
.input-error .password-input-container:focus-within {
  border-color: var(--red-9);
  box-shadow: 0 0 0 2px var(--red-opacity-3);
}

/* 错误信息文本样式 */
.input-error .input-error-text {
  color: var(--red-9);
  font-size: 12px;
  margin-top: 4px;
}

/* 禁用状态样式 */
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

/* 响应式设计，适配小屏幕 */
@media (max-width: 768px) {
  .password-input {
    font-size: 13px;
  }
  
  .input-large .password-input {
    font-size: 14px;
  }
}
</style>