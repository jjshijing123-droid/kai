<template>
  <!-- 按钮组件的根元素，使用动态类名和属性绑定 -->
  <button
    :class="buttonVariants({ variant, size, class: props.class })"
    v-bind="buttonProps"
  >
    <!-- 插槽：用于插入按钮的文本或图标内容 -->
    <slot />
  </button>
</template>

<script setup>
// 引入Vue的computed函数，用于创建计算属性
import { computed } from 'vue'
// 引入class-variance-authority库，用于管理组件的样式变体
import { cva } from "class-variance-authority"
// 引入工具函数cn，用于合并多个CSS类名
import { cn } from "../../lib/utils"

// 使用cva定义按钮的样式变体
const buttonVariants = cva(
  // 基础样式类：所有变体共有的样式
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    // 定义样式变体
    variants: {
      // 按钮类型变体
      variant: {
        // 默认主要按钮样式
        default: "bg-[var(--primary-9)] text-[#ffffff] hover:bg-[var(--primary-9)]/90 active:bg-[var(--primary-10)]",
        // 危险/删除按钮样式
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80", 
        // 描边按钮样式
        outline: "border-[var(--neutral-9)] border hover:bg-accent hover:bg-[var(--neutral-3)] active:border-[var(--neutral-9)]/80 text-[var(--neutral-12)]", 
        // 次要按钮样式
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70", 
        // 幽灵按钮样式（无背景）
        ghost: "hover:bg-[var(--primary-2)] hover:text-accent-foreground active:bg-accent/80", 
        // 纯文本按钮样式
        text: "bg-transparent hover:bg-gray-100 text-gray-700 active:bg-gray-200", 
        // 链接样式按钮
        link: "underline-offset-4 hover:underline text-primary active:bg-primary/10", 
      },
      // 按钮尺寸变体
      size: {
        default: "h-10 py-2 px-4", // 默认尺寸
        sm: "h-9 px-3 rounded-md", // 小尺寸
        lg: "h-11 px-8 rounded-md", // 大尺寸
        icon: "h-10 w-10", // 图标按钮（40x40px）
        icon32: "h-8 w-8", // 小图标按钮（32x32px）
        small: "h-8 px-2 text-sm" // 自定义小尺寸
      },
    },
    // 默认变体值
    defaultVariants: {
      variant: "default", // 默认使用主要按钮样式
      size: "default", // 默认使用默认尺寸
    },
  }
)

// 定义组件属性
const props = defineProps({
  // 按钮类型变体
  variant: {
    type: String, // 属性类型为字符串
    default: "default", // 默认值为"default"
  },
  // 按钮尺寸变体
  size: {
    type: String, // 属性类型为字符串
    default: "default", // 默认值为"default"
  },
  // 自定义CSS类名
  class: {
    type: String, // 属性类型为字符串
    default: "", // 默认值为空字符串
  },
})

// 计算属性：过滤出所有原生button属性
const buttonProps = computed(() => {
  // 从props中解构出样式相关属性，剩余的作为原生属性
  const { variant, size, class: className, ...rest } = props
  return rest // 返回原生button属性
})
</script>