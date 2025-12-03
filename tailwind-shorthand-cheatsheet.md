# Tailwind CSS 属性简写速查表

本文档整理了 Tailwind CSS 中常用的属性简写，方便开发时快速查阅。

## 一、布局类简写

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `flex`  | `display: flex` | `flex` | 启用 Flex 布局 |
| `grid`  | `display: grid` | `grid` | 启用 Grid 布局 |
| `block` | `display: block` | `block` | 块级元素 |
| `inline` | `display: inline` | `inline` | 行内元素 |
| `hidden` | `display: none` | `hidden` | 隐藏元素 |
| `relative` | `position: relative` | `relative` | 相对定位 |
| `absolute` | `position: absolute` | `absolute` | 绝对定位 |
| `fixed` | `position: fixed` | `fixed` | 固定定位 |
| `sticky` | `position: sticky` | `sticky` | 粘性定位 |

## 二、盒模型简写

### 2.1 边距（Margin）

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `m-` | `margin` | `m-4` | 四向外边距（1rem） |
| `mx-` | `margin-left + margin-right` | `mx-auto` | 水平外边距（常用作水平居中） |
| `my-` | `margin-top + margin-bottom` | `my-2` | 垂直外边距（0.5rem） |
| `mt-` | `margin-top` | `mt-8` | 上外边距（2rem） |
| `mb-` | `margin-bottom` | `mb-4` | 下外边距（1rem） |
| `ml-` | `margin-left` | `ml-2` | 左外边距（0.5rem） |
| `mr-` | `margin-right` | `mr-6` | 右外边距（1.5rem） |

### 2.2 内边距（Padding）

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `p-` | `padding` | `p-4` | 四向内边距（1rem） |
| `px-` | `padding-left + padding-right` | `px-2` | 水平内边距（0.5rem） |
| `py-` | `padding-top + padding-bottom` | `py-6` | 垂直内边距（1.5rem） |
| `pt-` | `padding-top` | `pt-8` | 上内边距（2rem） |
| `pb-` | `padding-bottom` | `pb-4` | 下内边距（1rem） |
| `pl-` | `padding-left` | `pl-2` | 左内边距（0.5rem） |
| `pr-` | `padding-right` | `pr-6` | 右内边距（1.5rem） |

### 2.3 宽高（Width/Height）

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `w-` | `width` | `w-full` | 宽度（100%） |
| `h-` | `height` | `h-16` | 高度（4rem） |
| `min-w-` | `min-width` | `min-w-0` | 最小宽度（0） |
| `min-h-` | `min-height` | `min-h-screen` | 最小高度（100vh） |
| `max-w-` | `max-width` | `max-w-2xl` | 最大宽度（42rem） |
| `max-h-` | `max-height` | `max-h-96` | 最大高度（24rem） |

## 三、排版类简写

### 3.1 文本颜色

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `text-` | `color` | `text-primary` | 文本色（主色调） |

### 3.2 字体大小

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `text-` | `font-size` | `text-lg` | 字体大小（1.125rem） |

### 3.3 字体粗细

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `font-` | `font-weight` | `font-bold` | 字体粗细（700） |

### 3.4 文本对齐

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `text-` | `text-align` | `text-center` | 文本对齐（居中） |

### 3.5 行高

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `leading-` | `line-height` | `leading-relaxed` | 行高（1.625） |

## 四、背景类简写

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `bg-` | `background-color` | `bg-background` | 背景色（主题背景色） |
| `bg-` | `background-image` | `bg-gradient-to-r` | 背景图片（渐变） |
| `bg-` | `background-size` | `bg-cover` | 背景大小（cover） |
| `bg-` | `background-position` | `bg-center` | 背景位置（居中） |

## 五、边框类简写

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `border-` | `border-width` | `border-2` | 边框宽度（2px） |
| `border-` | `border-color` | `border-border` | 边框颜色（主题边框色） |
| `border-` | `border-style` | `border-dashed` | 边框样式（虚线） |
| `rounded-` | `border-radius` | `rounded-lg` | 边框半径（0.5rem） |

## 六、交互类简写

### 6.1 状态前缀

| 简写前缀 | 对应状态 | 示例 | 说明 |
|---------|---------|------|------|
| `hover:` | 悬停状态 | `hover:bg-primary/90` | 悬停时背景色变深 |
| `focus:` | 焦点状态 | `focus:ring-2` | 焦点时显示环形效果 |
| `active:` | 激活状态 | `active:scale-95` | 点击时缩放 |
| `disabled:` | 禁用状态 | `disabled:opacity-50` | 禁用时半透明 |

### 6.2 交互行为

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `cursor-` | `cursor` | `cursor-pointer` | 鼠标指针（手型） |
| `transition-` | `transition` | `transition-colors` | 过渡效果（颜色） |
| `transform` | `transform` | `transform` | 启用变换 |
| `scale-` | `transform: scale()` | `scale-105` | 缩放（1.05倍） |

## 七、响应式前缀

| 简写前缀 | 对应断点 | 示例 | 说明 |
|---------|---------|------|------|
| `sm:` | 640px+ | `sm:flex` | 小屏以上启用 Flex 布局 |
| `md:` | 768px+ | `md:text-lg` | 中屏以上文本放大 |
| `lg:` | 1024px+ | `lg:w-1/2` | 大屏以上宽度 50% |
| `xl:` | 1280px+ | `xl:grid-cols-4` | 超大屏以上 4 列网格 |
| `2xl:` | 1536px+ | `2xl:max-w-7xl` | 2xl 屏以上最大宽度 |

## 八、复合简写

| 类名 | 对应 CSS 属性 | 说明 |
|------|--------------|------|
| `mx-auto` | `margin-left: auto; margin-right: auto` | 水平居中 |
| `my-auto` | `margin-top: auto; margin-bottom: auto` | 垂直居中 |
| `p-4` | `padding: 1rem` | 四向内边距 1rem |
| `pt-2 pb-4` | `padding-top: 0.5rem; padding-bottom: 1rem` | 上下内边距不同 |
| `border-t border-b` | `border-top: 1px solid; border-bottom: 1px solid` | 仅上下边框 |
| `flex items-center justify-between` | 水平居中对齐 + 两端分布 | 常用 Flex 布局组合 |

## 九、主题色类名

基于项目配置，以下是主题色相关的类名：

| 类名类型 | 示例 | 说明 |
|---------|------|------|
| 背景色 | `bg-background` | 主题背景色 |
| 文本色 | `text-foreground` | 主题文本色 |
| 主色调 | `bg-primary`, `text-primary-foreground` | 主题主色调 |
| 次要色 | `bg-secondary`, `text-secondary-foreground` | 主题次要色 |
| 边框色 | `border-border` | 主题边框色 |
| 输入框色 | `bg-input` | 主题输入框背景色 |
| 焦点环色 | `ring-ring` | 主题焦点环颜色 |

## 十、核心设计理念

这些简写的核心目的是：
1. **快速开发**：无需手写完整 CSS，直接使用类名组合
2. **一致性**：统一的命名规范，避免样式混乱
3. **响应式优先**：内置响应式前缀，轻松实现响应式设计
4. **主题化支持**：与 CSS 变量结合，实现主题切换
5. **可读性**：类名直观反映样式效果，便于维护

## 十一、使用示例

### 11.1 卡片组件

```html
<div class="border border-border rounded-lg overflow-hidden">
  <div class="p-4 bg-card">
    <h3 class="font-medium text-foreground mb-2">卡片标题</h3>
    <p class="text-muted-foreground">卡片内容</p>
  </div>
</div>
```

### 11.2 按钮组件

```html
<button class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
  按钮文本
</button>
```

### 11.3 响应式布局

```html
<div class="flex flex-col md:flex-row gap-4">
  <div class="w-full md:w-1/2 bg-secondary p-4 rounded-md">
    左侧内容
  </div>
  <div class="w-full md:w-1/2 bg-secondary p-4 rounded-md">
    右侧内容
  </div>
</div>
```

## 十二、自定义扩展

你可以在 `tailwind.config.js` 中扩展或修改现有简写：

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // 添加自定义颜色
        custom: {
          DEFAULT: "hsl(var(--custom))",
          foreground: "hsl(var(--custom-foreground))",
        },
      },
      spacing: {
        // 添加自定义间距
        '18': '4.5rem',
      },
    },
  },
}
```

使用自定义扩展：

```html
<div class="p-18 bg-custom text-custom-foreground">
  使用自定义间距和颜色
</div>
```

---

**更新日期**：2025-12-03
**项目**：Kai Project
**版本**：1.0.0