import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
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
  }
})
