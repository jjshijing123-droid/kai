<template>
  <div :class="cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)">
    <slot name="header" />
    <slot />
  </div>
</template>

<script setup>
import { cn } from "../../lib/utils"

const props = defineProps({
  className: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "medium",
  },
  bordered: {
    type: Boolean,
    default: true,
  },
})
</script>