<template>
  <button
    :class="buttonVariants({ variant, size, class: props.class })"
    v-bind="props"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        text: "bg-transparent hover:bg-gray-100 text-gray-700",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
        small: "h-8 px-2 text-sm"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const props = defineProps({
  variant: {
    type: String,
    default: "default",
  },
  size: {
    type: String,
    default: "default",
  },
  class: {
    type: String,
    default: "",
  },
})

// 传递所有原生button属性
const buttonProps = computed(() => {
  const { variant, size, class: className, ...rest } = props
  return rest
})
</script>