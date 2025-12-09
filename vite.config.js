import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    host: true, // 监听所有地址，允许局域网访问
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
      },
      '/Product': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        // 自定义 chunk 命名规则，使用函数式配置
        manualChunks(id) {
          // 根据模块路径自动分割chunk
          if (id.includes('node_modules')) {
            // 将不同的第三方库打包到不同的chunk
            if (id.includes('vue') || id.includes('vue-router')) {
              return 'vendor-vue';
            } else if (id.includes('jszip')) {
              return 'vendor-jszip';
            } else if (id.includes('file-saver')) {
              return 'vendor-file-saver';
            } else if (id.includes('lucide-vue-next')) {
              return 'vendor-icons';
            } else if (id.includes('axios')) {
              return 'vendor-axios';
            } else if (id.includes('archiver') || id.includes('unzipper')) {
              return 'vendor-archive';
            } else {
              // 其他第三方库打包到一个通用chunk
              return 'vendor-common';
            }
          }
          // 将大型组件单独打包
          if (id.includes('components/I18nManagementPanel.vue')) {
            return 'components-i18n';
          } else if (id.includes('components/Product3DViewer.vue') || id.includes('components/Product_Viewimages.vue')) {
            return 'components-viewer';
          } else if (id.includes('components/Product_list.vue') || id.includes('components/Product_nav.vue')) {
            return 'components-product';
          }
        }
      }
    },
    // 调整 chunk 大小警告限制，gzip后200KB左右是可接受的
    chunkSizeWarningLimit: 1500
  }
})
