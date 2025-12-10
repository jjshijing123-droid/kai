# 在当前页面控制input的padding详细步骤

## 1. 分析当前input组件

### 1.1 组件结构
当前input组件位于 `/Users/user/Desktop/kai/src/components/ui/input.vue`，主要由以下部分组成：
- 外层容器 `input-wrapper`
- 中间容器 `password-input-container`
- 内部input元素，带有 `password-input` 类名
- 前缀和后缀插槽

### 1.2 当前padding设置
在CSS样式中，padding是固定设置的：
```css
.password-input {
  /* 其他样式 */
  padding: 0 4px; /* 固定的padding */
}

/* 小尺寸 */
.password-input-container.input-small .password-input {
  /* 其他样式 */
  padding: 0 4px; /* 固定的padding */
}

/* 大尺寸 */
.password-input-container.input-large .password-input {
  /* 其他样式 */
  padding: 0 4px; /* 固定的padding */
}
```

## 2. 修改input组件支持动态padding

### 2.1 添加padding相关props
在 `script setup` 部分添加padding相关的props：

```vue
const props = defineProps({
  // 其他props
  
  // 统一设置padding
  padding: {
    type: String,
    default: undefined
  },
  // 水平方向padding
  paddingX: {
    type: String,
    default: undefined
  },
  // 垂直方向padding
  paddingY: {
    type: String,
    default: undefined
  },
  // 左padding
  paddingLeft: {
    type: String,
    default: undefined
  },
  // 右padding
  paddingRight: {
    type: String,
    default: undefined
  },
  // 上padding
  paddingTop: {
    type: String,
    default: undefined
  },
  // 下padding
  paddingBottom: {
    type: String,
    default: undefined
  }
})
```

### 2.2 添加CSS变量和计算属性

添加一个计算属性来生成CSS变量：

```vue
// 计算CSS变量
const inputStyles = computed(() => {
  const styles = {}
  
  // 设置padding相关的CSS变量
  if (props.padding) {
    styles['--padding'] = props.padding
  }
  if (props.paddingX) {
    styles['--padding-x'] = props.paddingX
  }
  if (props.paddingY) {
    styles['--padding-y'] = props.paddingY
  }
  if (props.paddingLeft) {
    styles['--padding-left'] = props.paddingLeft
  }
  if (props.paddingRight) {
    styles['--padding-right'] = props.paddingRight
  }
  if (props.paddingTop) {
    styles['--padding-top'] = props.paddingTop
  }
  if (props.paddingBottom) {
    styles['--padding-bottom'] = props.paddingBottom
  }
  
  return styles
})
```

### 2.3 修改CSS样式使用CSS变量

将固定的padding值替换为CSS变量：

```css
.password-input {
  /* 其他样式 */
  padding: 
    var(--padding-top, var(--padding-y, 0)) 
    var(--padding-right, var(--padding-x, 4px)) 
    var(--padding-bottom, var(--padding-y, 0)) 
    var(--padding-left, var(--padding-x, 4px));
  /* 优先级：单个方向 > 水平/垂直 > 默认值 */
}

/* 小尺寸 */
.password-input-container.input-small {
  /* 其他样式 */
  --padding-y: 0;
  --padding-x: 4px;
}

/* 大尺寸 */
.password-input-container.input-large {
  /* 其他样式 */
  --padding-y: 0;
  --padding-x: 4px;
}

/* 默认尺寸 */
.password-input-container.input-default {
  /* 其他样式 */
  --padding-y: 0;
  --padding-x: 4px;
}
```

### 2.4 更新模板应用CSS变量

将计算出的CSS变量应用到input容器上：

```vue
<div 
  class="password-input-container" 
  :class="inputClasses"
  :style="inputStyles"
>
  <!-- 内部内容 -->
</div>
```

## 3. 在当前页面使用动态padding

### 3.1 基本使用

在使用input组件的页面，可以通过props直接设置padding：

```vue
<!-- 统一设置padding -->
<Input padding="10px 20px" placeholder="搜索翻译..." />

<!-- 分别设置水平和垂直padding -->
<Input paddingX="20px" paddingY="8px" placeholder="搜索翻译..." />

<!-- 单独设置某个方向的padding -->
<Input paddingLeft="15px" paddingRight="15px" placeholder="搜索翻译..." />
```

### 3.2 结合size使用

可以与size属性结合使用，自定义不同尺寸的padding：

```vue
<!-- 小尺寸，自定义padding -->
<Input size="small" padding="5px 10px" placeholder="搜索翻译..." />

<!-- 大尺寸，自定义padding -->
<Input size="large" padding="12px 24px" placeholder="搜索翻译..." />
```

## 4. 高级用法：直接修改CSS变量

如果需要在当前页面的样式中直接控制input的padding，可以使用CSS选择器和CSS变量：

```vue
<template>
  <div class="custom-input-container">
    <Input placeholder="搜索翻译..." />
  </div>
</template>

<style scoped>
.custom-input-container :deep(.password-input-container) {
  --padding-x: 20px;
  --padding-y: 10px;
}
</style>
```

## 5. 完整修改后的input组件

```vue
<template>
  <div class="input-wrapper">
    <div 
      class="password-input-container" 
      :class="inputClasses"
      :style="inputStyles"
    >
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
  },
  // 新增：padding相关props
  padding: {
    type: String,
    default: undefined
  },
  paddingX: {
    type: String,
    default: undefined
  },
  paddingY: {
    type: String,
    default: undefined
  },
  paddingLeft: {
    type: String,
    default: undefined
  },
  paddingRight: {
    type: String,
    default: undefined
  },
  paddingTop: {
    type: String,
    default: undefined
  },
  paddingBottom: {
    type: String,
    default: undefined
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
    'password-focused': focused.value,
    'input-small': props.size === 'small',
    'input-large': props.size === 'large',
    'input-default': props.size === 'default'
  }
})

// 新增：计算CSS变量
const inputStyles = computed(() => {
  const styles = {}
  
  if (props.padding) styles['--padding'] = props.padding
  if (props.paddingX) styles['--padding-x'] = props.paddingX
  if (props.paddingY) styles['--padding-y'] = props.paddingY
  if (props.paddingLeft) styles['--padding-left'] = props.paddingLeft
  if (props.paddingRight) styles['--padding-right'] = props.paddingRight
  if (props.paddingTop) styles['--padding-top'] = props.paddingTop
  if (props.paddingBottom) styles['--padding-bottom'] = props.paddingBottom
  
  return styles
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
  const { 
    class: _, 
    size: __, 
    modelValue: ___, 
    // 过滤掉padding相关属性，不传递给原生input
    padding, paddingX, paddingY, 
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    ...rest 
  } = props
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
  width: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
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
  /* 使用CSS变量设置padding */
  padding: 
    var(--padding-top, var(--padding-y, var(--padding, 0))) 
    var(--padding-right, var(--padding-x, var(--padding, 4px))) 
    var(--padding-bottom, var(--padding-y, var(--padding, 0))) 
    var(--padding-left, var(--padding-x, var(--padding, 4px)));
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

.password-input-container.input-small {
  min-height: 32px;
  --padding-y: 0;
  --padding-x: 4px;
}

.password-input-container.input-small .password-input {
  font-size: 13px;
}

.password-input-container.input-small .input-prefix,
.password-input-container.input-small .input-suffix {
  padding: 0 8px;
  font-size: 13px;
}

.password-input-container.input-large {
  min-height: 40px;
  --padding-y: 0;
  --padding-x: 4px;
}

.password-input-container.input-large .password-input {
  font-size: 15px;
}

.password-input-container.input-large .input-prefix,
.password-input-container.input-large .input-suffix {
  padding: 0 8px;
  font-size: 15px;
}

.password-input-container.input-default {
  min-height: 36px;
  --padding-y: 0;
  --padding-x: 4px;
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
```

## 5. 总结

通过以上步骤，我们实现了在当前页面控制input组件padding的功能，主要包括：

1. 为input组件添加了padding相关的props，支持灵活设置内边距
2. 使用CSS变量实现了动态样式控制
3. 支持多种padding设置方式：统一设置、水平/垂直设置、单独方向设置
4. 可以与size属性结合使用
5. 支持在当前页面直接通过CSS变量修改样式

这样，用户就可以在当前页面根据需要自定义input的padding，而不需要修改组件的源代码。