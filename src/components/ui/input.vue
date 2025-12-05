<template>
  <div class="input-wrapper">
    <div class="password-input-container" :class="inputClasses">
      <div class="input-prefix" v-if="slots.prefix">
        <slot name="prefix"></slot>
      </div>
      <input
        :class="cn(
          'password-input',
          {
            'input-small': props.size === 'small',
            'input-large': props.size === 'large'
          }
        )"
        v-bind="filteredProps"
      >
      <div class="input-suffix" v-if="slots.suffix">
        <slot name="suffix"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, useSlots } from 'vue'
import { cn } from "../../lib/utils"

const props = defineProps({
  type: {
    type: String,
    default: "text",
  },
  class: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "default",
  },
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])
const slots = useSlots()

// 响应式数据
const inputRef = ref(null)
const focused = ref(false)

// 计算属性
const hasPrefix = computed(() => {
  return !!slots.prefix
})

const hasSuffix = computed(() => {
  return !!slots.suffix
})

const inputClasses = computed(() => {
  return {
    'password-focused': focused.value
  }
})

// 处理输入事件
const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

// 处理焦点事件
const handleFocus = (event) => {
  focused.value = true
}

const handleBlur = (event) => {
  focused.value = false
}

// 过滤不需要传递给原生input的属性
const filteredProps = computed(() => {
  const { class: _, size: __, modelValue: ___, ...rest } = props
  return {
    ...rest,
    value: props.modelValue,
    onInput: handleInput,
    onFocus: handleFocus,
    onBlur: handleBlur
  }
})
</script>

<style scoped>
.input-wrapper {
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

.password-input-container.password-focused {
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