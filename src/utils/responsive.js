/**
 * 响应式工具函数
 * 提供移动端适配和响应式设计的工具函数
 */

import { ref, onMounted, onUnmounted } from 'vue'

// 响应式断点配置
export const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
}

// 设备类型检测
export const deviceTypes = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
}

/**
 * 获取当前屏幕宽度
 */
export function useScreenWidth() {
  const width = ref(window.innerWidth)
  
  const updateWidth = () => {
    width.value = window.innerWidth
  }
  
  onMounted(() => {
    window.addEventListener('resize', updateWidth)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth)
  })
  
  return width
}

/**
 * 检测当前设备类型
 */
export function useDeviceType() {
  const screenWidth = useScreenWidth()
  const deviceType = ref('')
  
  const updateDeviceType = () => {
    if (screenWidth.value < breakpoints.md) {
      deviceType.value = deviceTypes.MOBILE
    } else if (screenWidth.value < breakpoints.lg) {
      deviceType.value = deviceTypes.TABLET
    } else {
      deviceType.value = deviceTypes.DESKTOP
    }
  }
  
  onMounted(() => {
    updateDeviceType()
  })
  
  return {
    deviceType,
    isMobile: () => deviceType.value === deviceTypes.MOBILE,
    isTablet: () => deviceType.value === deviceTypes.TABLET,
    isDesktop: () => deviceType.value === deviceTypes.DESKTOP,
  }
}

/**
 * 响应式断点检测
 */
export function useBreakpoint() {
  const screenWidth = useScreenWidth()
  
  return {
    isXs: () => screenWidth.value < breakpoints.xs,
    isSm: () => screenWidth.value >= breakpoints.xs && screenWidth.value < breakpoints.sm,
    isMd: () => screenWidth.value >= breakpoints.sm && screenWidth.value < breakpoints.md,
    isLg: () => screenWidth.value >= breakpoints.md && screenWidth.value < breakpoints.lg,
    isXl: () => screenWidth.value >= breakpoints.lg && screenWidth.value < breakpoints.xl,
    isXxl: () => screenWidth.value >= breakpoints.xl,
  }
}

/**
 * 移动端触摸事件支持
 */
export function useTouchSupport() {
  const isTouchDevice = ref(false)
  
  onMounted(() => {
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })
  
  return isTouchDevice
}

/**
 * 响应式列数计算
 * @param {number} baseCols - 基础列数
 * @param {Object} breakpointCols - 断点对应的列数 { xs: 1, sm: 2, md: 3, lg: 4 }
 */
export function useResponsiveCols(baseCols = 1, breakpointCols = {}) {
  const screenWidth = useScreenWidth()
  const cols = ref(baseCols)
  
  const updateCols = () => {
    const width = screenWidth.value
    
    if (width < breakpoints.xs && breakpointCols.xs !== undefined) {
      cols.value = breakpointCols.xs
    } else if (width < breakpoints.sm && breakpointCols.sm !== undefined) {
      cols.value = breakpointCols.sm
    } else if (width < breakpoints.md && breakpointCols.md !== undefined) {
      cols.value = breakpointCols.md
    } else if (width < breakpoints.lg && breakpointCols.lg !== undefined) {
      cols.value = breakpointCols.lg
    } else if (width < breakpoints.xl && breakpointCols.xl !== undefined) {
      cols.value = breakpointCols.xl
    } else if (breakpointCols.xxl !== undefined) {
      cols.value = breakpointCols.xxl
    } else {
      cols.value = baseCols
    }
  }
  
  onMounted(() => {
    updateCols()
  })
  
  return cols
}

/**
 * 移动端手势支持
 */
export function useSwipeGesture(elementRef, options = {}) {
  const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown } = options
  
  let startX = 0
  let startY = 0
  let isSwiping = false
  
  const handleTouchStart = (event) => {
    const touch = event.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    isSwiping = true
  }
  
  const handleTouchMove = (event) => {
    if (!isSwiping) return
    
    const touch = event.touches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    
    // 确定主要滑动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      if (deltaX > 50) {
        onSwipeRight?.()
        isSwiping = false
      } else if (deltaX < -50) {
        onSwipeLeft?.()
        isSwiping = false
      }
    } else {
      // 垂直滑动
      if (deltaY > 50) {
        onSwipeDown?.()
        isSwiping = false
      } else if (deltaY < -50) {
        onSwipeUp?.()
        isSwiping = false
      }
    }
  }
  
  const handleTouchEnd = () => {
    isSwiping = false
  }
  
  onMounted(() => {
    const element = elementRef.value
    if (element) {
      element.addEventListener('touchstart', handleTouchStart)
      element.addEventListener('touchmove', handleTouchMove)
      element.addEventListener('touchend', handleTouchEnd)
    }
  })
  
  onUnmounted(() => {
    const element = elementRef.value
    if (element) {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  })
}

/**
 * 响应式字体大小计算
 * @param {number} baseSize - 基础字体大小
 * @param {Object} breakpointSizes - 断点对应的字体大小
 */
export function useResponsiveFontSize(baseSize = 16, breakpointSizes = {}) {
  const screenWidth = useScreenWidth()
  const fontSize = ref(baseSize)
  
  const updateFontSize = () => {
    const width = screenWidth.value
    
    if (width < breakpoints.xs && breakpointSizes.xs !== undefined) {
      fontSize.value = breakpointSizes.xs
    } else if (width < breakpoints.sm && breakpointSizes.sm !== undefined) {
      fontSize.value = breakpointSizes.sm
    } else if (width < breakpoints.md && breakpointSizes.md !== undefined) {
      fontSize.value = breakpointSizes.md
    } else if (width < breakpoints.lg && breakpointSizes.lg !== undefined) {
      fontSize.value = breakpointSizes.lg
    } else if (width < breakpoints.xl && breakpointSizes.xl !== undefined) {
      fontSize.value = breakpointSizes.xl
    } else if (breakpointSizes.xxl !== undefined) {
      fontSize.value = breakpointSizes.xxl
    } else {
      fontSize.value = baseSize
    }
  }
  
  onMounted(() => {
    updateFontSize()
  })
  
  return fontSize
}

/**
 * 防抖函数 - 用于优化性能
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数 - 用于优化性能
 */
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export default {
  breakpoints,
  deviceTypes,
  useScreenWidth,
  useDeviceType,
  useBreakpoint,
  useTouchSupport,
  useResponsiveCols,
  useSwipeGesture,
  useResponsiveFontSize,
  debounce,
  throttle,
}