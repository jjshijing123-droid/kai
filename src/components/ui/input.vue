<template>
  <input
    :class="cn(
      'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      sizeClass,
      props.class
    )"
    v-bind="filteredProps"
  >
</template>

<script setup>
import { computed } from 'vue'
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
  }
})

const emit = defineEmits(['update:modelValue'])

// 根据size属性添加样式类
const sizeClass = computed(() => {
  switch (props.size) {
    case 'large':
      return 'h-12 text-base'
    case 'small':
      return 'h-8 text-xs'
    default:
      return 'h-10 text-sm'
  }
})

// 处理输入事件
const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

// 过滤不需要传递给原生input的属性
const filteredProps = computed(() => {
  const { class: _, size: __, modelValue: ___, ...rest } = props
  return {
    ...rest,
    value: props.modelValue,
    onInput: handleInput
  }
})
</script>