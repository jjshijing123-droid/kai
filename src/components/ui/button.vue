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
    "  transition-all duration-300 ease inline-flex items-center justify-center rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",

  {
    // 定义样式变体
    variants: {
      // 按钮类型变体
      variant: {
        // 填充32
        fill: "bg-primary-9 text-white hover:bg-primary-8 active:bg-primary-7 active:text-white/90" ,
        // 描边32
        line: "border-neutral-6 text-neutral-12 border hover:bg-neutral-2 hover:border-neutral-7 active:border-neutral-5 active:text-neutral-11",
        // 幽灵
        no: "text-neutral-12 hover:bg-neutral-2 active:bg-neutral-1 active:text-neutral-11",


        // 默认主要按钮样式
        default: "bg-primary-9 text-white hover:bg-primary-9/90 active:bg-primary-10",

        // 危险/删除按钮样式
        destructive: "bg-red-9 text-white hover:bg-red-9/90 active:bg-red-10", 
        // 描边按钮样式
        outline: "border-neutral-9 border hover:bg-neutral-3 active:border-neutral-9/80 text-neutral-12", 
        // 次要按钮样式
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70", 
        // 幽灵按钮样式（无背景）
         ghost: "hover:bg-primary-2 hover:text-accent-foreground active:bg-accent/80", 
        // 纯文本按钮样式
        text: "bg-transparent hover:bg-neutral-2 text-neutral-12 active:bg-neutral-3", 
        // 链接样式按钮
        link: "underline-offset-4 hover:underline text-primary active:bg-primary/10", 
      },
      // 按钮尺寸变体
      size: {
        default: "h-10 py-2 px-4", // 默认尺寸
        sm: "h-9 px-3 rounded-md", // 小尺寸
        lg: "h-11 px-8 rounded-md", // 大尺寸
        icon: "h-10 w-10", // 图标按钮（40x40px）
        small: "h-8 px-2 text-sm", // 自定义小尺寸
        icon32: "h-8 w-8", // 小图标按钮（32x32px）
        icon40: "h-10 w-10", // 小图标按钮（32x32px）
        32: "h-8 px-2.5 text-[12px] leading-[16px] font-[400] gap-1.5", // 自定义小尺寸
        40: "h-10 px-3.5 text-[15px] leading-[18px] font-[400] gap-2"
      },
    },
    // 默认变体值
    defaultVariants: {
      variant: "fill", // 默认使用主要按钮样式
      size: "32", // 默认使用默认尺寸
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