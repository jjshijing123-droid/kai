import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 工具提示 Hook
 */
export function useTooltip() {
  const tooltip = ref({
    visible: false,
    content: '',
    position: 'top',
    target: null,
    offset: 8
  })
  
  let tooltipElement = null
  
  /**
   * 创建工具提示元素
   */
  const createTooltipElement = () => {
    if (tooltipElement) return tooltipElement
    
    tooltipElement = document.createElement('div')
    tooltipElement.className = 'tooltip'
    tooltipElement.style.cssText = `
      position: absolute;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      max-width: 200px;
      word-wrap: break-word;
    `
    document.body.appendChild(tooltipElement)
    
    return tooltipElement
  }
  
  /**
   * 显示工具提示
   */
  const show = (target, content, position = 'top', offset = 8) => {
    tooltip.value = {
      visible: true,
      content,
      position,
      target,
      offset
    }
    
    const element = createTooltipElement()
    element.textContent = content
    element.style.opacity = '1'
    
    positionTooltip(target, position, offset)
  }
  
  /**
   * 隐藏工具提示
   */
  const hide = () => {
    tooltip.value.visible = false
    
    if (tooltipElement) {
      tooltipElement.style.opacity = '0'
    }
  }
  
  /**
   * 定位工具提示
   */
  const positionTooltip = (target, position, offset) => {
    if (!target || !tooltipElement) return
    
    const rect = target.getBoundingClientRect()
    const tooltipRect = tooltipElement.getBoundingClientRect()
    
    let top = 0
    let left = 0
    
    switch (position) {
      case 'top':
        top = rect.top - tooltipRect.height - offset + window.scrollY
        left = rect.left + rect.width / 2 - tooltipRect.width / 2 + window.scrollX
        break
      case 'bottom':
        top = rect.bottom + offset + window.scrollY
        left = rect.left + rect.width / 2 - tooltipRect.width / 2 + window.scrollX
        break
      case 'left':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2 + window.scrollY
        left = rect.left - tooltipRect.width - offset + window.scrollX
        break
      case 'right':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2 + window.scrollY
        left = rect.right + offset + window.scrollX
        break
    }
    
    // 边界检查
    if (left < 0) left = 10 + window.scrollX
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 10 + window.scrollX
    }
    
    if (top < 0) top = rect.bottom + offset + window.scrollY
    if (top + tooltipRect.height > window.innerHeight) {
      top = rect.top - tooltipRect.height - offset + window.scrollY
    }
    
    tooltipElement.style.top = `${top}px`
    tooltipElement.style.left = `${left}px`
  }
  
  /**
   * 清理资源
   */
  const cleanup = () => {
    if (tooltipElement) {
      document.body.removeChild(tooltipElement)
      tooltipElement = null
    }
  }
  
  onBeforeUnmount(cleanup)
  
  return {
    tooltip,
    show,
    hide
  }
}

/**
 * 提示工具组件
 */
export const TooltipDirective = {
  mounted(el, binding) {
    const { show, hide } = useTooltip()
    
    el.addEventListener('mouseenter', () => {
      show(el, binding.value)
    })
    
    el.addEventListener('mouseleave', () => {
      hide()
    })
    
    el.addEventListener('focus', () => {
      show(el, binding.value)
    })
    
    el.addEventListener('blur', () => {
      hide()
    })
  },
  
  unmounted(el, binding) {
    el.removeEventListener('mouseenter', () => {})
    el.removeEventListener('mouseleave', () => {})
    el.removeEventListener('focus', () => {})
    el.removeEventListener('blur', () => {})
  }
}

/**
 * 工具提示组件
 */
export const Tooltip = {
  props: {
    content: {
      type: String,
      required: true
    },
    position: {
      type: String,
      default: 'top',
      validator: (value) => ['top', 'bottom', 'left', 'right'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  
  setup(props, { emit }) {
    const { tooltip, show, hide } = useTooltip()
    
    const handleMouseEnter = (event) => {
      if (props.disabled) return
      show(event.currentTarget, props.content, props.position)
      emit('mouseenter', event)
    }
    
    const handleMouseLeave = (event) => {
      hide()
      emit('mouseleave', event)
    }
    
    const handleFocus = (event) => {
      if (props.disabled) return
      show(event.currentTarget, props.content, props.position)
      emit('focus', event)
    }
    
    const handleBlur = (event) => {
      hide()
      emit('blur', event)
    }
    
    return {
      tooltip,
      handleMouseEnter,
      handleMouseLeave,
      handleFocus,
      handleBlur
    }
  },
  
  template: `
    <div
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <slot></slot>
    </div>
  `
}