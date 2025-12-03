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