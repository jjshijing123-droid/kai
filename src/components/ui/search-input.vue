<template>
  <div class="search-input-wrapper">
    <div class="search-input-container">
      <LucideIcon name="Search" class="search-icon" />
      <input
        v-model="inputValue"
        :placeholder="placeholder"
        class="search-input-field"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { cn } from "../../lib/utils"
import LucideIcon from './LucideIcon.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入'
  },
  class: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const handleFocus = (event) => {
  emit('focus', event)
}

const handleBlur = (event) => {
  emit('blur', event)
}
</script>

<style scoped>
.search-input-wrapper {
  width: 100%;
  height: 100%;
}

.search-input-container {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #f0f0f0;
  padding: 6px 10px;
  border-radius: 6px;
  box-sizing: border-box;
  height: 32px !important;
  min-height: 32px !important;
  width: 100%;
  overflow: hidden;
}

.search-input-field {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12px;
  color: #626262;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  line-height: 13px;
  letter-spacing: 0;
  padding: 0;
  min-height: 0;
  min-width: 0;
  width: 0;
}

.search-input-field::placeholder {
  color: #626262;
  font-family: "DIN 2014", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", SimHei, Arial, Helvetica, sans-serif;
  font-size: 12px;
  line-height: 13px;
  letter-spacing: 0;
}

.search-input-field:focus {
  outline: none;
}

.search-icon {
  width: 14px;
  height: 14px;
  color: #626262;
  flex-shrink: 0;
}

.search-icon svg {
  width: 14px;
  height: 14px;
}
</style>