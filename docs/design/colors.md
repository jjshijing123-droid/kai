# ICE 图片查看器 - 设计系统（颜色变量）

## 颜色系统概述

项目使用基于 CSS 变量的主题色彩系统，在 `tailwind.config.js` 中通过 `theme.extend.colors` 引用这些变量。所有组件应使用 CSS 变量或 Tailwind 主题色，禁止硬编码颜色值（如 `#fff`、`#000`）。

## 完整变量定义

```css
:root {
  /* 中性色 */
  --neutral-1: #fdfdfd;
  --neutral-2: #f9f9f9;
  --neutral-3: #f0f0f0;
  --neutral-4: #e8e8e8;
  --neutral-5: #e1e1e1;
  --neutral-6: #d9d9d9;
  --neutral-7: #cecece;
  --neutral-8: #bbbbbb;
  --neutral-9: #8c8c8c;
  --neutral-10: #828282;
  --neutral-11: #626262;
  --neutral-12: #202020;

  /* 主色（蓝色） */
  --primary-1: #fafdff;
  --primary-2: #f3fafe;
  --primary-3: #e0f5ff;
  --primary-4: #cdefff;
  --primary-5: #b9e6ff;
  --primary-6: #a2daf8;
  --primary-7: #84caef;
  --primary-8: #4cb3e5;
  --primary-9: #00a0d9;
  --primary-10: #0193c8;
  --primary-11: #007ab1;

  /* 橙色 */
  --orange-1: #fefdfb;
  --orange-2: #fff9e9;
  --orange-3: #fff0c9;
  --orange-4: #ffe6b3;
  --orange-5: #ffdb97;
  --orange-6: #ffcc74;
  --orange-7: #f5bb66;
  --orange-8: #e4a238;
  --orange-9: #ffad00;
  --orange-10: #e9a73e;
  --orange-11: #a66800;

  /* 绿色 */
  --green-1: #fbfdfa;
  --green-2: #f7fbf4;
  --green-3: #e7f8db;
  --green-4: #d8f3c5;
  --green-5: #c9eaaf;
  --green-6: #b7dd99;
  --green-7: #a1cc7e;
  --green-8: #84b755;
  --green-9: #93da49;
  --green-10: #89cf3c;
  --green-11: #557d2d;

  /* 红色 */
  --red-1: #fffcfc;
  --red-2: #fff8f7;
  --red-3: #feecea;
  --red-4: #ffddd9;
  --red-5: #ffcfcb;
  --red-6: #fbbfba;
  --red-7: #f1aba6;
  --red-8: #e8918c;
  --red-9: #eb5a5a;
  --red-10: #de4c4e;
  --red-11: #c8383d;
}
```

## 色阶使用说明

每种颜色有 12 个等级（1-12），数字越小越浅，数字越大越深：

| 等级 | 用途 |
|------|------|
| 1-3 | 背景色、浅色区域 |
| 4-6 | 边框、分割线、次要背景 |
| 7-9 | 主要文本、按钮背景 |
| 10-12 | 深色文本、强调元素 |

## 在组件中使用

### Tailwind CSS 类名

```vue
<!-- 使用主题色 -->
<div class="bg-primary-9 text-white">主色按钮</div>
<div class="text-neutral-12">深色文字</div>
<div class="border-neutral-6">边框</div>
```

### 内联样式（CSS 变量）

```vue
<!-- 通过 CSS 变量引用 -->
<div :style="{ color: 'var(--primary-9)' }">主色文字</div>
<div :style="{ backgroundColor: 'var(--neutral-1)' }">背景</div>
```

## 语义化映射

| 用途 | 推荐颜色 | 示例 |
|------|----------|------|
| 主色按钮 | `primary-9` | `bg-primary-9` |
| 主色浅背景 | `primary-3` | `bg-primary-3` |
| 页面背景 | `neutral-1` 或 `neutral-2` | `bg-neutral-1` |
| 卡片背景 | `neutral-2` | `bg-neutral-2` |
| 边框 | `neutral-6` 或 `neutral-7` | `border-neutral-6` |
| 主要文字 | `neutral-12` | `text-neutral-12` |
| 次要文字 | `neutral-9` 或 `neutral-10` | `text-neutral-9` |
| 成功状态 | `green-9` | `text-green-9` |
| 警告状态 | `orange-9` | `text-orange-9` |
| 错误状态 | `red-9` | `text-red-9` |
