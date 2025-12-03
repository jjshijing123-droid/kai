# Tailwind CSS 主题开发指南

## 一、配置文件详解

### 1.1 tailwind.config.js 注释

```javascript
/** @type {import('tailwindcss').Config} */
// Tailwind CSS 配置文件
export default {
  // 配置 Tailwind 扫描的文件路径，用于生成必要的 CSS 类
  content: [
    "./index.html", // 根 HTML 文件
    "./src/**/*.{vue,js,ts,jsx,tsx}", //  src 目录下的所有 Vue、JS、TS、JSX、TSX 文件
  ],
  
  // 主题配置
  theme: {
    // 容器配置
    container: {
      center: true, // 容器居中
      padding: "2rem", // 容器内边距
      screens: {
        "2xl": "1400px", // 2xl 屏幕尺寸下的容器最大宽度
      },
    },
    
    // 扩展默认主题
    extend: {
      // 颜色配置，使用 CSS 变量实现主题切换
      colors: {
        border: "hsl(var(--border))", // 边框颜色
        input: "hsl(var(--input))", // 输入框颜色
        ring: "hsl(var(--ring))", // 环形颜色（用于焦点状态等）
        background: "hsl(var(--background))", // 背景颜色
        foreground: "hsl(var(--foreground))", // 前景色（文本等）
        primary: {
          DEFAULT: "hsl(var(--primary))", // 主色调
          foreground: "hsl(var(--primary-foreground))", // 主色调前景色
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))", // 次要色调
          foreground: "hsl(var(--secondary-foreground))", // 次要色调前景色
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))", // 破坏性颜色（错误等）
          foreground: "hsl(var(--destructive-foreground))", // 破坏性颜色前景色
        },
        muted: {
          DEFAULT: "hsl(var(--muted))", //  muted 颜色（辅助文本等）
          foreground: "hsl(var(--muted-foreground))", // muted 颜色前景色
        },
        accent: {
          DEFAULT: "hsl(var(--accent))", // 强调色
          foreground: "hsl(var(--accent-foreground))", // 强调色前景色
        },
        popover: {
          DEFAULT: "hsl(var(--popover))", // 弹出框背景色
          foreground: "hsl(var(--popover-foreground))", // 弹出框前景色
        },
        card: {
          DEFAULT: "hsl(var(--card))", // 卡片背景色
          foreground: "hsl(var(--card-foreground))", // 卡片前景色
        },
        custom: {
          DEFAULT: "hsl(var(--custom))", // 自定义颜色
          foreground: "hsl(var(--custom-foreground))", // 自定义颜色前景色
        },
      },
      
      // 边框半径配置
      borderRadius: {
        lg: "var(--radius)", // 大边框半径
        md: "calc(var(--radius) - 2px)", // 中等边框半径
        sm: "calc(var(--radius) - 4px)", // 小边框半径
      },
      
      // 自定义动画关键帧
      keyframes: {
        // 手风琴展开动画
        "accordion-down": {
          from: { height: "0" }, // 初始状态：高度为 0
          to: { height: "var(--radix-accordion-content-height)" }, // 结束状态：高度为内容高度
        },
        // 手风琴收起动画
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" }, // 初始状态：高度为内容高度
          to: { height: "0" }, // 结束状态：高度为 0
        },
      },
      
      // 动画配置
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out", // 手风琴展开动画，0.2秒，ease-out 缓动
        "accordion-up": "accordion-up 0.2s ease-out", // 手风琴收起动画，0.2秒，ease-out 缓动
      },
    },
  },
  
  // 插件配置
  plugins: [
    require("tailwindcss-animate"), // 引入 tailwindcss-animate 插件，用于添加动画效果
  ],
}
```

### 1.2 src/styles/globals.css 注释

```css
/* 导入 Tailwind CSS 基础样式 */
@tailwind base;
/* 导入 Tailwind CSS 组件样式 */
@tailwind components;
/* 导入 Tailwind CSS 工具样式 */
@tailwind utilities;

/* 定义基础层样式 */
@layer base {
  /* 根元素样式变量（浅色主题） */
  :root {
    --background: 0 0% 100%; /* 背景色：白色 */
    --foreground: 222.2 84% 4.9%; /* 前景色：深灰蓝色 */
    --card: 0 0% 100%; /* 卡片背景色：白色 */
    --card-foreground: 222.2 84% 4.9%; /* 卡片前景色：深灰蓝色 */
    --popover: 0 0% 100%; /* 弹出框背景色：白色 */
    --popover-foreground: 222.2 84% 4.9%; /* 弹出框前景色：深灰蓝色 */
    --primary: 222.2 47.4% 11.2%; /* 主色调：深蓝黑色 */
    --primary-foreground: 210 40% 98%; /* 主色调前景色：浅灰色 */
    --secondary: 210 40% 96%; /* 次要色调：浅灰色 */
    --secondary-foreground: 222.2 84% 4.9%; /* 次要色调前景色：深灰蓝色 */
    --muted: 210 40% 96%; /* 辅助色调：浅灰色 */
    --muted-foreground: 215.4 16.3% 46.9%; /* 辅助色调前景色：中灰色 */
    --accent: 210 40% 96%; /* 强调色：浅灰色 */
    --accent-foreground: 222.2 84% 4.9%; /* 强调色前景色：深灰蓝色 */
    --destructive: 0 84.2% 60.2%; /* 破坏性颜色：红色 */
    --destructive-foreground: 210 40% 98%; /* 破坏性颜色前景色：浅灰色 */
    --border: 214.3 31.8% 91.4%; /* 边框颜色：浅灰色 */
    --input: 214.3 31.8% 91.4%; /* 输入框颜色：浅灰色 */
    --ring: 222.2 84% 4.9%; /* 环形颜色：深灰蓝色 */
    --radius: 0.5rem; /* 边框半径：0.5rem */
    --custom: 142.1 76.2% 36.3%; /* 自定义颜色：绿色 */
    --custom-foreground: 355.7 100% 97.3%; /* 自定义颜色前景色：白色 */
  }

  /* 深色主题样式变量 */
  .dark {
    --background: 222.2 84% 4.9%; /* 背景色：深蓝黑色 */
    --foreground: 210 40% 98%; /* 前景色：浅灰色 */
    --card: 222.2 84% 4.9%; /* 卡片背景色：深蓝黑色 */
    --card-foreground: 210 40% 98%; /* 卡片前景色：浅灰色 */
    --popover: 222.2 84% 4.9%; /* 弹出框背景色：深蓝黑色 */
    --popover-foreground: 210 40% 98%; /* 弹出框前景色：浅灰色 */
    --primary: 210 40% 98%; /* 主色调：浅灰色 */
    --primary-foreground: 222.2 47.4% 11.2%; /* 主色调前景色：深蓝黑色 */
    --secondary: 217.2 32.6% 17.5%; /* 次要色调：深灰色 */
    --secondary-foreground: 210 40% 98%; /* 次要色调前景色：浅灰色 */
    --muted: 217.2 32.6% 17.5%; /* 辅助色调：深灰色 */
    --muted-foreground: 215 20.2% 65.1%; /* 辅助色调前景色：中灰色 */
    --accent: 217.2 32.6% 17.5%; /* 强调色：深灰色 */
    --accent-foreground: 210 40% 98%; /* 强调色前景色：浅灰色 */
    --destructive: 0 62.8% 30.6%; /* 破坏性颜色：深红色 */
    --destructive-foreground: 210 40% 98%; /* 破坏性颜色前景色：浅灰色 */
    --border: 217.2 32.6% 17.5%; /* 边框颜色：深灰色 */
    --input: 217.2 32.6% 17.5%; /* 输入框颜色：深灰色 */
    --ring: 212.7 26.8% 83.9%; /* 环形颜色：浅蓝灰色 */
    --custom: 142.1 70.6% 45.3%; /* 深色主题自定义颜色：浅绿色 */
    --custom-foreground: 144.9 80.4% 10%; /* 深色主题自定义颜色前景色：深绿色 */
  }
}

/* 定义基础元素样式 */
@layer base {
  /* 全局样式：为所有元素添加边框颜色 */
  * {
    @apply border-border;
  }
  /* 车身样式：设置背景色和文本颜色 */
  body {
    @apply bg-background text-foreground;
  }
}
```

## 二、主题边框颜色使用

### 2.1 基础用法

```html
<!-- 基本边框 -->
<div class="border border-border p-4 rounded-md">
  这是一个带有主题边框颜色的div
</div>

<!-- 不同边框宽度 -->
<div class="border-2 border-border p-4 rounded-md">
  这是一个带有2px宽主题边框的div
</div>

<!-- 仅底部边框 -->
<div class="border-b border-border p-4">
  这是一个仅底部带有主题边框的div
</div>
```

### 2.2 边框颜色的定义

主题边框颜色在 `globals.css` 中定义为 CSS 变量：

```css
/* 浅色主题 */
:root {
  --border: 214.3 31.8% 91.4%; /* 浅灰色 */
}

/* 深色主题 */
.dark {
  --border: 217.2 32.6% 17.5%; /* 深灰色 */
}
```

在 `tailwind.config.js` 中映射为 Tailwind 颜色类：

```javascript
colors: {
  border: "hsl(var(--border))", // 将 CSS 变量映射为 Tailwind 颜色
}
```

## 三、Tailwind 属性简写速查表

### 3.1 布局类简写

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

### 3.2 盒模型简写

| 简写前缀 | 对应 CSS 属性 | 示例 | 说明 |
|---------|--------------|------|------|
| `m-` | `margin` | `m-4` | 四向外边距（1rem） |
| `mx-` | `margin-left + margin-right` | `mx-auto` | 水平外边距（水平居中） |
| `p-` | `padding` | `p-4` | 四向内边距（1rem） |
| `px-` | `padding-left + padding-right` | `px-2` | 水平内边距（0.5rem） |
| `w-` | `width` | `w-full` | 宽度（100%） |
| `h-` | `height` | `h-16` | 高度（4rem） |

### 3.3 主题色类名

| 类名类型 | 示例 | 说明 |
|---------|------|------|
| 背景色 | `bg-background` | 主题背景色 |
| 文本色 | `text-foreground` | 主题文本色 |
| 主色调 | `bg-primary`, `text-primary-foreground` | 主题主色调 |
| 边框色 | `border-border` | 主题边框色 |
| 输入框色 | `bg-input` | 主题输入框背景色 |

## 四、添加自定义颜色

### 4.1 步骤1：添加 CSS 变量

在 `globals.css` 中添加自定义颜色的 CSS 变量：

```css
/* 浅色主题 */
:root {
  --custom: 142.1 76.2% 36.3%; /* 自定义颜色：绿色 */
  --custom-foreground: 355.7 100% 97.3%; /* 自定义颜色前景色：白色 */
}

/* 深色主题 */
.dark {
  --custom: 142.1 70.6% 45.3%; /* 深色主题自定义颜色：浅绿色 */
  --custom-foreground: 144.9 80.4% 10%; /* 深色主题自定义颜色前景色：深绿色 */
}
```

### 4.2 步骤2：在 Tailwind 配置中映射

在 `tailwind.config.js` 的 `colors` 对象中添加自定义颜色：

```javascript
colors: {
  // 其他颜色...
  custom: {
    DEFAULT: "hsl(var(--custom))",
    foreground: "hsl(var(--custom-foreground))",
  },
}
```

### 4.3 步骤3：使用自定义颜色

```html
<!-- 背景色 -->
<div class="bg-custom text-custom-foreground p-4">自定义颜色背景</div>

<!-- 按钮 -->
<button class="bg-custom text-custom-foreground px-4 py-2 rounded-md hover:bg-custom/90 transition-colors">
  自定义颜色按钮
</button>

<!-- 边框颜色 -->
<div class="border-2 border-custom p-4 rounded-md">
  边框使用自定义颜色
</div>
```

### 4.4 支持的颜色格式

Tailwind 支持多种颜色格式：

1. **HSL** (当前项目使用)
   ```css
   --custom: 142.1 76.2% 36.3%;
   ```

2. **RGB / RGBA**
   ```css
   --custom: 0 255 0;
   --custom-alpha: 0 255 0 / 0.5;
   ```

3. **Hex**
   ```css
   --custom: #00ff00;
   --custom-alpha: #00ff0080;
   ```

4. **颜色名称**
   ```css
   --custom: red;
   ```

## 五、响应式设计详解

### 5.1 响应式断点

Tailwind 内置了 5 个响应式断点：

| 断点前缀 | 最小值 | CSS | 说明 |
|---------|-------|-----|------|
| `sm:` | 640px | `@media (min-width: 640px) { ... }` | 小屏幕设备 |
| `md:` | 768px | `@media (min-width: 768px) { ... }` | 中等屏幕设备 |
| `lg:` | 1024px | `@media (min-width: 1024px) { ... }` | 大屏幕设备 |
| `xl:` | 1280px | `@media (min-width: 1280px) { ... }` | 超大屏幕设备 |
| `2xl:` | 1536px | `@media (min-width: 1536px) { ... }` | 2xl 屏幕设备 |

### 5.2 响应式类使用方法

```html
<!-- 移动端1列，平板2列，桌面4列 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div class="bg-background p-4 border border-border rounded-md">项1</div>
  <div class="bg-background p-4 border border-border rounded-md">项2</div>
  <div class="bg-background p-4 border border-border rounded-md">项3</div>
  <div class="bg-background p-4 border border-border rounded-md">项4</div>
</div>

<!-- 响应式文本大小 -->
<h1 class="text-2xl sm:text-3xl md:text-4xl font-bold">
  响应式标题
</h1>

<!-- 响应式边距 -->
<div class="m-4 sm:m-6 md:m-8">
  响应式边距
</div>
```

### 5.3 响应式布局模式

#### 5.3.1 移动优先设计

Tailwind 采用移动优先的设计理念，默认样式适用于移动端，通过断点前缀逐步增强到更大屏幕：

```html
<!-- 默认移动端垂直堆叠 -->
<div class="flex flex-col gap-4">
  <!-- 平板以上水平排列 -->
  <div class="md:flex md:gap-4">
    <div class="md:w-1/2 bg-background p-4 border border-border rounded-md">左侧</div>
    <div class="md:w-1/2 bg-background p-4 border border-border rounded-md">右侧</div>
  </div>
</div>
```

#### 5.3.2 隐藏和显示元素

```html
<!-- 仅在移动端显示 -->
<div class="block sm:hidden bg-background p-4 border border-border rounded-md">
  移动端专属内容
</div>

<!-- 仅在平板及以上显示 -->
<div class="hidden sm:block bg-background p-4 border border-border rounded-md">
  平板及以上专属内容
</div>
```

## 六、Flex 布局详解

### 6.1 核心 Flex 类

#### 6.1.1 Flex 容器类

| 类名 | 说明 |
|------|------|
| `flex` | 启用 Flex 布局 |
| `inline-flex` | 启用内联 Flex 布局 |
| `flex-row` | 水平排列（默认） |
| `flex-col` | 垂直排列 |
| `flex-wrap` | 允许换行 |
| `flex-nowrap` | 不允许换行（默认） |
| `justify-start` | 主轴起始对齐 |
| `justify-center` | 主轴居中对齐 |
| `justify-end` | 主轴结束对齐 |
| `justify-between` | 主轴两端对齐，项目之间有间距 |
| `justify-around` | 主轴均匀分布，项目两侧有间距 |
| `justify-evenly` | 主轴均匀分布，项目之间间距相等 |
| `items-start` | 交叉轴起始对齐 |
| `items-center` | 交叉轴居中对齐 |
| `items-end` | 交叉轴结束对齐 |
| `items-baseline` | 交叉轴基线对齐 |
| `items-stretch` | 交叉轴拉伸对齐（默认） |

#### 6.1.2 Flex 项类

| 类名 | 说明 |
|------|------|
| `flex-1` | 项目占据剩余空间 |
| `flex-auto` | 项目根据内容自动伸缩 |
| `flex-none` | 项目不伸缩 |
| `order-0` 到 `order-12` | 项目顺序 |
| `self-start` | 单个项目交叉轴起始对齐 |
| `self-center` | 单个项目交叉轴居中对齐 |
| `self-end` | 单个项目交叉轴结束对齐 |
| `self-baseline` | 单个项目交叉轴基线对齐 |
| `self-stretch` | 单个项目交叉轴拉伸对齐 |

### 6.2 常见 Flex 布局示例

#### 6.2.1 水平居中

```html
<div class="flex justify-center items-center h-32 bg-background border border-border rounded-md">
  <div class="text-center">水平居中内容</div>
</div>
```

#### 6.2.2 垂直居中

```html
<div class="flex flex-col justify-center items-center h-32 bg-background border border-border rounded-md">
  <div>垂直居中内容</div>
</div>
```

#### 6.2.3 两端对齐

```html
<div class="flex justify-between items-center bg-background p-4 border border-border rounded-md">
  <div>左侧内容</div>
  <div>右侧内容</div>
</div>
```

#### 6.2.4 等宽项目

```html
<div class="flex gap-4 bg-background p-4 border border-border rounded-md">
  <div class="flex-1 bg-secondary p-2 rounded-md">等宽项目1</div>
  <div class="flex-1 bg-secondary p-2 rounded-md">等宽项目2</div>
  <div class="flex-1 bg-secondary p-2 rounded-md">等宽项目3</div>
</div>
```

#### 6.2.5 响应式 Flex

```html
<div class="flex flex-col sm:flex-row gap-4 bg-background p-4 border border-border rounded-md">
  <div class="sm:w-1/2 bg-secondary p-2 rounded-md">左侧</div>
  <div class="sm:w-1/2 bg-secondary p-2 rounded-md">右侧</div>
</div>
```

## 七、表单样式

### 7.1 基本表单元素

#### 7.1.1 文本输入框

```html
<div class="mb-4">
  <label for="name" class="block text-sm font-medium text-foreground mb-1">
    姓名
  </label>
  <input
    type="text"
    id="name"
    placeholder="请输入您的姓名"
    class="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
  />
</div>
```

#### 7.1.2 密码输入框

```html
<div class="mb-4">
  <label for="password" class="block text-sm font-medium text-foreground mb-1">
    密码
  </label>
  <input
    type="password"
    id="password"
    placeholder="请输入您的密码"
    class="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
  />
</div>
```

#### 7.1.3 文本域

```html
<div class="mb-4">
  <label for="message" class="block text-sm font-medium text-foreground mb-1">
    留言
  </label>
  <textarea
    id="message"
    rows="4"
    placeholder="请输入您的留言"
    class="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
  ></textarea>
</div>
```

#### 7.1.4 选择框

```html
<div class="mb-4">
  <label for="category" class="block text-sm font-medium text-foreground mb-1">
    分类
  </label>
  <select
    id="category"
    class="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
  >
    <option value="">请选择分类</option>
    <option value="general">一般咨询</option>
    <option value="support">技术支持</option>
    <option value="feedback">反馈建议</option>
  </select>
</div>
```

#### 7.1.5 复选框

```html
<div class="mb-4">
  <label class="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      class="w-4 h-4 rounded border border-border text-primary focus:ring-0 focus:ring-offset-0 focus:ring-ring transition-all"
    />
    <span class="text-sm text-foreground">同意隐私政策</span>
  </label>
</div>
```

#### 7.1.6 单选按钮

```html
<div class="mb-4">
  <p class="block text-sm font-medium text-foreground mb-2">
    性别
  </p>
  <div class="flex gap-4">
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="gender"
        value="male"
        class="w-4 h-4 border border-border text-primary focus:ring-0 focus:ring-offset-0 focus:ring-ring transition-all"
      />
      <span class="text-sm text-foreground">男</span>
    </label>
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="gender"
        value="female"
        class="w-4 h-4 border border-border text-primary focus:ring-0 focus:ring-offset-0 focus:ring-ring transition-all"
      />
      <span class="text-sm text-foreground">女</span>
    </label>
  </div>
</div>
```

### 7.2 表单验证状态

```html
<!-- 错误状态 -->
<div class="mb-4">
  <label for="email" class="block text-sm font-medium text-foreground mb-1">
    邮箱
  </label>
  <input
    type="email"
    id="email"
    placeholder="请输入您的邮箱"
    class="w-full px-3 py-2 border border-destructive rounded-md bg-input text-foreground focus:ring-2 focus:ring-destructive focus:border-transparent transition-all"
  />
  <p class="text-sm text-destructive mt-1">请输入有效的邮箱地址</p>
</div>

<!-- 成功状态 -->
<div class="mb-4">
  <label for="username" class="block text-sm font-medium text-foreground mb-1">
    用户名
  </label>
  <input
    type="text"
    id="username"
    placeholder="请输入您的用户名"
    class="w-full px-3 py-2 border border-green-500 rounded-md bg-input text-foreground focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
  />
  <p class="text-sm text-green-500 mt-1">用户名可用</p>
</div>
```

## 八、Hover 效果

### 8.1 基本语法

```html
<!-- 背景色 hover 效果 -->
<div class="bg-primary hover:bg-primary/90 p-4 rounded-md transition-colors">
  悬停时背景色变深
</div>

<!-- 文本色 hover 效果 -->
<a href="#" class="text-primary hover:text-primary/80 transition-colors">
  悬停时文本色变浅
</a>

<!-- 边框色 hover 效果 -->
<div class="border border-border hover:border-primary p-4 rounded-md transition-colors">
  悬停时边框色变为主题主色
</div>
```

### 8.2 常用 hover 颜色组合

#### 按钮 hover 效果
```html
<!-- 主按钮 -->
<button class="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-md">
  主按钮
</button>

<!-- 次要按钮 -->
<button class="bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors px-4 py-2 rounded-md">
  次要按钮
</button>
```

#### 链接 hover 效果
```html
<a href="#" class="text-primary hover:text-primary/80 hover:underline transition-all">
  悬停时变色并下划线
</a>
```

#### 卡片 hover 效果
```html
<div class="border border-border rounded-lg overflow-hidden hover:shadow-md transition-all">
  <div class="p-4 bg-card">
    <h3 class="font-medium text-foreground">卡片标题</h3>
    <p class="text-muted-foreground">卡片内容</p>
  </div>
</div>
```

### 8.3 透明度调整

```html
<!-- 悬停时背景色透明度变为 90% -->
<div class="bg-primary hover:bg-primary/90 p-4 rounded-md">
  悬停时背景色变深
</div>

<!-- 悬停时背景色透明度变为 80% -->
<div class="bg-primary hover:bg-primary/80 p-4 rounded-md">
  悬停时背景色更浅
</div>

<!-- 悬停时背景色透明度变为 70% -->
<div class="bg-primary hover:bg-primary/70 p-4 rounded-md">
  悬停时背景色透明度 70%
</div>
```

### 8.4 过渡效果

```html
<!-- 颜色过渡（200ms） -->
<div class="bg-primary hover:bg-primary/90 transition-colors duration-200 p-4 rounded-md">
  200ms 颜色过渡
</div>

<!-- 全属性过渡（300ms） -->
<div class="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300 p-4 rounded-md">
  300ms 全属性过渡（包括颜色和缩放）
</div>
```

### 8.5 项目主题下的 hover 示例

```html
<!-- 使用主题主色调 -->
<div class="bg-background hover:bg-primary/10 p-4 rounded-md transition-colors">
  悬停时背景色变为主题主色的 10% 透明度
</div>

<!-- 使用主题边框色 -->
<div class="border border-border hover:border-primary p-4 rounded-md transition-colors">
  悬停时边框色变为主题主色
</div>

<!-- 使用自定义颜色 -->
<div class="bg-background hover:bg-custom p-4 rounded-md transition-colors">
  悬停时背景色变为自定义颜色
</div>
```

### 8.6 组件级 hover 效果

在 `src/styles/globals.css` 中使用 `@layer components` 定义组件的 hover 效果：

```css
@layer components {
  .btn-primary {
    @apply bg-primary text-primary-foreground px-4 py-2 rounded-md transition-colors hover:bg-primary/90;
  }
  
  .btn-secondary {
    @apply bg-secondary text-secondary-foreground px-4 py-2 rounded-md transition-colors hover:bg-secondary/90;
  }
}
```

在项目中使用预定义的组件类：

```html
<button class="btn-primary">
  预定义 hover 效果的主按钮
</button>

<button class="btn-secondary">
  预定义 hover 效果的次要按钮
</button>
```

## 九、Tailwind 网格布局

### 9.1 核心网格类

| 类名 | 说明 |
|------|------|
| `grid` | 定义网格容器 |
| `grid-cols-N` | 定义 N 列网格 |
| `grid-rows-N` | 定义 N 行网格 |
| `gap-N` | 定义网格间距 |
| `col-span-N` | 网格项跨 N 列 |
| `row-span-N` | 网格项跨 N 行 |

### 9.2 基本网格示例

```html
<!-- 2列网格，间距为1rem -->
<div class="grid grid-cols-2 gap-4">
  <div class="bg-background p-4 border border-border rounded-md">网格项1</div>
  <div class="bg-background p-4 border border-border rounded-md">网格项2</div>
  <div class="bg-background p-4 border border-border rounded-md">网格项3</div>
  <div class="bg-background p-4 border border-border rounded-md">网格项4</div>
</div>
```

### 9.3 响应式网格

```html
<!-- 响应式网格：移动端1列，平板2列，桌面4列 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- 网格项将在不同断点下显示不同列数 -->
</div>
```

### 9.4 复杂网格布局

```html
<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <!-- 左侧边栏 -->
  <div class="lg:col-span-1 bg-background p-4 border border-border rounded-md">
    左侧边栏
  </div>
  
  <!-- 主内容 -->
  <div class="lg:col-span-2 bg-background p-4 border border-border rounded-md">
    主内容
  </div>
  
  <!-- 全宽内容 -->
  <div class="col-span-1 lg:col-span-3 bg-background p-4 border border-border rounded-md">
    全宽内容
  </div>
</div>
```

### 9.5 网格对齐

```html
<!-- 垂直居中对齐 -->
<div class="grid grid-cols-3 gap-4 items-center">
  <div class="h-16 bg-background p-4 border border-border rounded-md">项1</div>
  <div class="h-24 bg-background p-4 border border-border rounded-md">项2</div>
  <div class="h-32 bg-background p-4 border border-border rounded-md">项3</div>
</div>

<!-- 水平居中对齐 -->
<div class="grid grid-cols-3 gap-4 justify-center">
  <div class="bg-background p-4 border border-border rounded-md">项1</div>
  <div class="bg-background p-4 border border-border rounded-md">项2</div>
</div>
```

## 十、自定义工具类

### 10.1 使用 `@layer utilities` 定义工具类

在 `globals.css` 中添加自定义工具类：

```css
@layer utilities {
  /* 自定义工具类：文本截断 */
  .truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* 自定义工具类：文本截断3行 */
  .truncate-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* 自定义工具类：滚动条隐藏 */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* 自定义工具类：阴影 */
  .shadow-soft {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }
  
  .dark .shadow-soft {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
  
  /* 自定义工具类：透明背景 */
  .bg-transparent-50 {
    background-color: rgba(255, 255, 255, 0.5);
  }
  
  .dark .bg-transparent-50 {
    background-color: rgba(0, 0, 0, 0.5);
  }
}
```

### 10.2 使用自定义工具类

```html
<!-- 使用自定义文本截断工具类 -->
<div class="p-4 bg-background border border-border rounded-md">
  <h3 class="font-medium text-foreground mb-2">文章标题</h3>
  <p class="text-muted-foreground truncate-2">
    这是一篇很长的文章内容，使用自定义的 truncate-2 工具类可以将文本截断为 2 行，超出部分显示省略号。
  </p>
</div>

<!-- 使用自定义滚动条隐藏工具类 -->
<div class="h-24 overflow-y-auto scrollbar-hide bg-background border border-border rounded-md p-4">
  <p>这是一个很长的内容区域，使用 scrollbar-hide 工具类可以隐藏滚动条，但仍然可以滚动查看内容。</p>
  <p>滚动条隐藏工具类适用于需要美观但又需要滚动功能的场景。</p>
  <p>这是一个很长的内容区域，使用 scrollbar-hide 工具类可以隐藏滚动条，但仍然可以滚动查看内容。</p>
  <p>滚动条隐藏工具类适用于需要美观但又需要滚动功能的场景。</p>
  <p>这是一个很长的内容区域，使用 scrollbar-hide 工具类可以隐藏滚动条，但仍然可以滚动查看内容。</p>
  <p>滚动条隐藏工具类适用于需要美观但又需要滚动功能的场景。</p>
</div>
```

## 十一、动画效果

### 11.1 内置动画类

Tailwind 内置了一些常用的动画类：

| 类名 | 说明 |
|------|------|
| `animate-spin` | 旋转动画 |
| `animate-pulse` | 脉冲动画 |
| `animate-bounce` | 弹跳动画 |
| `animate-ping` |  Ping 动画 |

### 11.2 使用内置动画

```html
<!-- 旋转动画 -->
<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>

<!-- 脉冲动画 -->
<div class="w-32 h-32 bg-primary rounded-full animate-pulse"></div>

<!-- 弹跳动画 -->
<div class="w-12 h-12 bg-primary rounded-full animate-bounce"></div>

<!-- Ping 动画 -->
<div class="relative">
  <div class="w-4 h-4 bg-primary rounded-full animate-ping"></div>
  <div class="absolute inset-0 w-4 h-4 bg-primary rounded-full"></div>
</div>
```

### 11.3 自定义动画

在 `tailwind.config.js` 中定义自定义动画：

```javascript
export default {
  theme: {
    extend: {
      // 自定义动画关键帧
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      // 自定义动画
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
      },
    },
  },
}
```

### 11.4 使用自定义动画

```html
<!-- 淡入动画 -->
<div class="animate-fade-in bg-background p-4 border border-border rounded-md">
  淡入动画效果
</div>

<!-- 滑入动画 -->
<div class="animate-slide-up bg-background p-4 border border-border rounded-md">
  滑入动画效果
</div>
```

### 11.5 动画延迟和持续时间

```html
<!-- 延迟 300ms 执行的淡入动画 -->
<div class="animate-fade-in delay-300 bg-background p-4 border border-border rounded-md">
  延迟 300ms 淡入
</div>

<!-- 持续时间 1s 的淡入动画 -->
<div class="animate-fade-in duration-1000 bg-background p-4 border border-border rounded-md">
  持续 1s 淡入
</div>

<!-- 缓动效果 -->
<div class="animate-fade-in ease-in-out bg-background p-4 border border-border rounded-md">
  缓入缓出淡入
</div>
```

## 十二、主题切换

### 12.1 实现主题切换

```javascript
// 主题切换功能
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
}
```

### 12.2 完整主题切换功能

```javascript
// 主题切换功能
function toggleTheme() {
  // 获取当前主题
  const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  
  // 切换主题
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.classList.toggle('dark');
  
  // 保存主题到 localStorage
  localStorage.setItem('theme', newTheme);
  
  // 更新主题切换按钮状态
  updateThemeToggleButton(newTheme);
}

// 更新主题切换按钮状态
function updateThemeToggleButton(theme) {
  const toggleButton = document.getElementById('theme-toggle');
  if (toggleButton) {
    toggleButton.innerHTML = theme === 'dark' ? '🌞 切换到浅色主题' : '🌙 切换到深色主题';
  }
}

// 初始化主题
function initTheme() {
  // 检查 localStorage 中是否有保存的主题
  const savedTheme = localStorage.getItem('theme');
  
  // 检查系统偏好主题
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  
  // 使用保存的主题或系统主题
  const initialTheme = savedTheme || systemTheme;
  
  // 应用主题
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  }
  
  // 更新主题切换按钮
  updateThemeToggleButton(initialTheme);
}

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  // 只有当用户没有手动设置主题时，才跟随系统主题变化
  if (!localStorage.getItem('theme')) {
    const newTheme = e.matches ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', e.matches);
    updateThemeToggleButton(newTheme);
  }
});

// 页面加载完成后初始化主题
document.addEventListener('DOMContentLoaded', initTheme);
```

### 12.3 主题切换按钮

```html
<button 
  id="theme-toggle"
  onclick="toggleTheme()"
  class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
>
  🌙 切换到深色主题
</button>
```

### 12.4 平滑主题过渡

在 `globals.css` 中添加主题过渡效果：

```css
/* 添加主题过渡效果 */
html {
  transition: color-scheme 0.3s ease;
}

/* 为所有需要过渡的元素添加过渡效果 */
body, .bg-background, .text-foreground, .border-border, .bg-primary, .text-primary-foreground {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

### 12.5 主题切换效果

当切换主题时，所有使用主题颜色的元素会自动更新，包括：
- 背景色
- 文本色
- 边框色
- 按钮颜色
- 卡片颜色
- 自定义颜色

## 十三、深色模式优化

### 13.1 图片优化

```html
<!-- 使用 CSS 滤镜调整图片亮度 -->
<img 
  src="image.jpg" 
  alt="示例图片" 
  class="w-full rounded-md transition-all dark:brightness-90 dark:contrast-110"
/>

<!-- 使用深色模式专属图片 -->
<picture>
  <!-- 深色模式图片 -->
  <source 
    srcset="image-dark.jpg" 
    media="(prefers-color-scheme: dark)"
  />
  <!-- 浅色模式图片 -->
  <img 
    src="image-light.jpg" 
    alt="示例图片" 
    class="w-full rounded-md"
  />
</picture>
```

### 13.2 阴影优化

```html
<!-- 响应式阴影 -->
<div class="bg-background p-4 border border-border rounded-md shadow-sm dark:shadow-lg transition-all">
  响应式阴影
</div>
```

### 13.3 边框优化

```html
<!-- 响应式边框 -->
<div class="bg-background p-4 border border-border rounded-md transition-all">
  响应式边框
</div>
```

## 十四、性能优化

### 14.1 减少生成的 CSS 大小

1. **使用 JIT 模式**（默认启用）
   - 只生成使用到的 CSS 类
   - 支持任意值语法

2. **优化 content 配置**
   ```javascript
   content: [
     "./index.html",
     "./src/**/*.{vue,js,ts,jsx,tsx}",
     // 不要包含不必要的文件
     // "./node_modules/**/*", // 错误：会扫描所有依赖
   ],
   ```

3. **使用 purgeCSS**（JIT 模式已包含）
   - 移除未使用的 CSS 类

### 14.2 优化渲染性能

1. **避免过度使用动画**
   - 只在必要时使用动画
   - 避免在滚动时触发动画

2. **使用 CSS 变量**
   - 减少 CSS 大小
   - 提高主题切换性能

3. **优化响应式设计**
   - 避免不必要的响应式类
   - 使用移动优先设计

### 14.3 监控性能

1. **使用浏览器开发者工具**
   - 检查生成的 CSS 大小
   - 分析 CSS 加载时间

2. **使用 Lighthouse**
   - 分析页面性能
   - 获取优化建议

3. **使用 Tailwind CSS Analyzer**
   - 分析 Tailwind CSS 使用情况
   - 获取优化建议

## 十五、最佳实践

### 15.1 主题一致性

- 使用主题颜色类（如 `bg-background`、`text-foreground`）而非硬编码颜色
- 为所有组件使用一致的间距和圆角
- 利用响应式类确保在所有设备上的良好显示

### 15.2 性能优化

- 仅在 `content` 配置中包含必要的文件路径
- 避免过度使用自定义工具类
- 利用 Tailwind 的 JIT 模式只生成使用到的类

### 15.3 代码组织

- 将全局样式放在 `globals.css` 中
- 在 `tailwind.config.js` 中集中管理主题配置
- 为复杂组件创建独立的 CSS 类（使用 `@layer components`）

## 十六、组件设计模式

### 16.1 原子设计

使用原子设计原则构建组件：

1. **原子**：最基本的 UI 元素（按钮、输入框等）
2. **分子**：由原子组成的简单组件（表单控件、导航项等）
3. **有机体**：由分子组成的复杂组件（导航栏、卡片等）
4. **模板**：页面布局模板
5. **页面**：完整的页面

### 16.2 组件示例

```html
<!-- 原子：按钮 -->
<button class="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-md">
  按钮
</button>

<!-- 分子：表单控件 -->
<div class="mb-4">
  <label for="email" class="block text-sm font-medium text-foreground mb-1">
    邮箱
  </label>
  <input
    type="email"
    id="email"
    placeholder="请输入您的邮箱"
    class="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
  />
</div>

<!-- 有机体：卡片 -->
<div class="border border-border rounded-lg overflow-hidden hover:shadow-md transition-all">
  <div class="p-4 bg-card">
    <h3 class="font-medium text-foreground mb-2">卡片标题</h3>
    <p class="text-muted-foreground mb-4">卡片内容</p>
    <button class="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-md">
      查看详情
    </button>
  </div>
</div>
```

## 十七、调试技巧

### 17.1 检查生成的 CSS

1. **使用浏览器开发者工具**
   - 检查元素应用的 CSS 类
   - 查看生成的 CSS 代码

2. **使用 Tailwind CSS IntelliSense**
   - VS Code 扩展，提供智能提示
   - 显示 CSS 类的详细信息
   - 快速跳转到定义

3. **使用 `npx tailwindcss -o output.css --minify`**
   - 生成完整的 CSS 文件
   - 检查生成的 CSS 内容

### 17.2 调试主题切换

1. **检查 CSS 变量**
   ```javascript
   // 在浏览器控制台检查 CSS 变量
   getComputedStyle(document.documentElement).getPropertyValue('--background');
   ```

2. **检查主题类**
   ```javascript
   // 检查是否添加了 dark 类
   document.documentElement.classList.contains('dark');
   ```

3. **检查 localStorage**
   ```javascript
   // 检查 localStorage 中的主题
   localStorage.getItem('theme');
   ```

### 17.3 常见问题

1. **CSS 类不生效**
   - 检查 `content` 配置是否包含了使用该类的文件
   - 检查类名是否拼写正确
   - 检查是否使用了正确的前缀

2. **主题切换不生效**
   - 检查是否正确添加了 `dark` 类
   - 检查 CSS 变量是否正确定义
   - 检查是否有其他 CSS 覆盖了主题样式

3. **响应式类不生效**
   - 检查断点前缀是否正确
   - 检查设备宽度是否符合断点要求
   - 检查是否有其他 CSS 覆盖了响应式样式

## 十八、与其他框架集成

### 18.1 与 Vue 集成

```vue
<!-- Button.vue -->
<template>
  <button 
    :class="[
      'px-4 py-2 rounded-md font-medium transition-colors duration-200',
      variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : '',
      variant === 'secondary' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : '',
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    ]"
    :disabled="disabled"
  >
    <slot></slot>
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  }
});
</script>
```

### 18.2 与 React 集成

```jsx
// Button.jsx
function Button({ variant = 'primary', disabled = false, children }) {
  return (
    <button 
      className={[
        'px-4 py-2 rounded-md font-medium transition-colors duration-200',
        variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : '',
        variant === 'secondary' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ].join(' ')}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

## 十九、示例文件

### 19.1 自定义颜色示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>自定义颜色示例</title>
    <link rel="stylesheet" href="/src/styles/globals.css">
</head>
<body class="p-8">
    <h1 class="text-2xl font-bold mb-6">自定义颜色示例</h1>
    
    <!-- 主题切换按钮 -->
    <button onclick="toggleTheme()" 
            class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mb-8">
        切换主题
    </button>
    
    <!-- 示例：自定义颜色按钮 -->
    <button class="px-4 py-2 bg-custom text-custom-foreground rounded-md hover:bg-custom/90 transition-colors mb-4">
        自定义颜色按钮
    </button>
    
    <script>
        function toggleTheme() {
            document.documentElement.classList.toggle('dark');
        }
    </script>
</body>
</html>
```

## 二十、更新日志

| 日期 | 更新内容 |
|------|----------|
| 2025-12-03 | 初始版本，包含配置文件注释、主题边框颜色、属性简写、自定义颜色和网格布局 |
| 2025-12-03 | 添加 Hover 效果章节，更新文档编号 |
| 2025-12-03 | 添加响应式设计、Flex 布局、表单样式、自定义工具类、动画效果、主题切换实现、深色模式优化、性能优化、组件设计模式、调试技巧、与其他框架集成等章节 |

---

**项目**：Kai Project
**版本**：1.0.1