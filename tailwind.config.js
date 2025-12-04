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
          border: "var(--border)", // 边框颜色
          input: "var(--input)", // 输入框颜色
          ring: "var(--ring)", // 环形颜色（用于焦点状态等）
          background: "var(--background)", // 背景颜色
          foreground: "var(--foreground)", // 前景色（文本等）
          primary: {
            DEFAULT: "var(--primary)", // 主色调
            foreground: "var(--primary-foreground)", // 主色调前景色
            // Figma 主色（蓝色）
            1: "var(--primary-1)",
            2: "var(--primary-2)",
            3: "var(--primary-3)",
            4: "var(--primary-4)",
            5: "var(--primary-5)",
            6: "var(--primary-6)",
            7: "var(--primary-7)",
            8: "var(--primary-8)",
            9: "var(--primary-9)",
            10: "var(--primary-10)",
            11: "var(--primary-11)",
            // 主色透明度
            opacity1: "var(--primary-opacity-1)",
            opacity2: "var(--primary-opacity-2)",
            opacity3: "var(--primary-opacity-3)",
            opacity4: "var(--primary-opacity-4)",
            opacity5: "var(--primary-opacity-5)",
            opacity6: "var(--primary-opacity-6)",
            opacity7: "var(--primary-opacity-7)",
            opacity8: "var(--primary-opacity-8)",
            opacity9: "var(--primary-opacity-9)",
            opacity10: "var(--primary-opacity-10)",
            opacity11: "var(--primary-opacity-11)",
            opacity12: "var(--primary-opacity-12)",
          },
          secondary: {
            DEFAULT: "var(--secondary)", // 次要色调
            foreground: "var(--secondary-foreground)", // 次要色调前景色
          },
          destructive: {
            DEFAULT: "var(--destructive)", // 破坏性颜色（错误等）
            foreground: "var(--destructive-foreground)", // 破坏性颜色前景色
          },
          muted: {
            DEFAULT: "var(--muted)", //  muted 颜色（辅助文本等）
            foreground: "var(--muted-foreground)", // muted 颜色前景色
          },
          accent: {
            DEFAULT: "var(--accent)", // 强调色
            foreground: "var(--accent-foreground)", // 强调色前景色
          },
          popover: {
            DEFAULT: "var(--popover)", // 弹出框背景色
            foreground: "var(--popover-foreground)", // 弹出框前景色
          },
          card: {
            DEFAULT: "var(--card)", // 卡片背景色
            foreground: "var(--card-foreground)", // 卡片前景色
          },
          custom: {
            DEFAULT: "var(--custom)", // 自定义颜色
            foreground: "var(--custom-foreground)", // 自定义颜色前景色
          },
          // Figma 中性色
          neutral: {
            1: "var(--neutral-1)",
            2: "var(--neutral-2)",
            3: "var(--neutral-3)",
            4: "var(--neutral-4)",
            5: "var(--neutral-5)",
            6: "var(--neutral-6)",
            7: "var(--neutral-7)",
            8: "var(--neutral-8)",
            9: "var(--neutral-9)",
            10: "var(--neutral-10)",
            11: "var(--neutral-11)",
            12: "var(--neutral-12)",
            // 中性色透明度
            opacity1: "var(--neutral-opacity-1)",
            opacity2: "var(--neutral-opacity-2)",
            opacity3: "var(--neutral-opacity-3)",
            opacity4: "var(--neutral-opacity-4)",
            opacity5: "var(--neutral-opacity-5)",
            opacity6: "var(--neutral-opacity-6)",
            opacity7: "var(--neutral-opacity-7)",
            opacity8: "var(--neutral-opacity-8)",
            opacity9: "var(--neutral-opacity-9)",
            opacity10: "var(--neutral-opacity-10)",
            opacity11: "var(--neutral-opacity-11)",
            opacity12: "var(--neutral-opacity-12)",
          },
          // Figma 橙色
          orange: {
            1: "var(--orange-1)",
            2: "var(--orange-2)",
            3: "var(--orange-3)",
            4: "var(--orange-4)",
            5: "var(--orange-5)",
            6: "var(--orange-6)",
            7: "var(--orange-7)",
            8: "var(--orange-8)",
            9: "var(--orange-9)",
            10: "var(--orange-10)",
            11: "var(--orange-11)",
            12: "var(--orange-12)",
            // 橙色透明度
            opacity1: "var(--orange-opacity-1)",
            opacity2: "var(--orange-opacity-2)",
            opacity3: "var(--orange-opacity-3)",
            opacity4: "var(--orange-opacity-4)",
            opacity5: "var(--orange-opacity-5)",
            opacity6: "var(--orange-opacity-6)",
            opacity7: "var(--orange-opacity-7)",
            opacity8: "var(--orange-opacity-8)",
            opacity9: "var(--orange-opacity-9)",
            opacity10: "var(--orange-opacity-10)",
            opacity11: "var(--orange-opacity-11)",
            opacity12: "var(--orange-opacity-12)",
          },
          // Figma 绿色
          green: {
            1: "var(--green-1)",
            2: "var(--green-2)",
            3: "var(--green-3)",
            4: "var(--green-4)",
            5: "var(--green-5)",
            6: "var(--green-6)",
            7: "var(--green-7)",
            8: "var(--green-8)",
            9: "var(--green-9)",
            10: "var(--green-10)",
            11: "var(--green-11)",
            12: "var(--green-12)",
            // 绿色透明度
            opacity1: "var(--green-opacity-1)",
            opacity2: "var(--green-opacity-2)",
            opacity3: "var(--green-opacity-3)",
            opacity4: "var(--green-opacity-4)",
            opacity5: "var(--green-opacity-5)",
            opacity6: "var(--green-opacity-6)",
            opacity7: "var(--green-opacity-7)",
            opacity8: "var(--green-opacity-8)",
            opacity9: "var(--green-opacity-9)",
            opacity10: "var(--green-opacity-10)",
            opacity11: "var(--green-opacity-11)",
            opacity12: "var(--green-opacity-12)",
          },
          // Figma 红色
          red: {
            1: "var(--red-1)",
            2: "var(--red-2)",
            3: "var(--red-3)",
            4: "var(--red-4)",
            5: "var(--red-5)",
            6: "var(--red-6)",
            7: "var(--red-7)",
            8: "var(--red-8)",
            9: "var(--red-9)",
            10: "var(--red-10)",
            11: "var(--red-11)",
            12: "var(--red-12)",
            // 红色透明度
            opacity1: "var(--red-opacity-1)",
            opacity2: "var(--red-opacity-2)",
            opacity3: "var(--red-opacity-3)",
            opacity4: "var(--red-opacity-4)",
            opacity5: "var(--red-opacity-5)",
            opacity6: "var(--red-opacity-6)",
            opacity7: "var(--red-opacity-7)",
            opacity8: "var(--red-opacity-8)",
            opacity9: "var(--red-opacity-9)",
            opacity10: "var(--red-opacity-10)",
            opacity11: "var(--red-opacity-11)",
            opacity12: "var(--red-opacity-12)",
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