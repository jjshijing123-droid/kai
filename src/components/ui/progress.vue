<template>
  <div class="w-full">
    <div v-if="showInfo" class="flex justify-between text-sm text-gray-600 mb-1">
      <span v-if="status !== 'active'">{{ percent }}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div
        class="h-2 rounded-full transition-all duration-300"
        :class="{
          'bg-blue-600': status === 'active',
          'bg-green-600': status === 'success',
          'bg-red-600': status === 'exception',
          'bg-gray-600': status === 'normal'
        }"
        :style="{ width: `${Math.min(percent, 100)}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  percent: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: 'active' // normal, active, success, exception
  },
  showInfo: {
    type: Boolean,
    default: false
  }
})
</script>