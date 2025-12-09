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
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000, // 调整警告阈值到1000KB
    rollupOptions: {
      external: [
        'archiver',
        'unzipper',
        'node-fetch',
        'fs',
        'path',
        'stream',
        'http',
        'https',
        'url',
        'zlib',
        'util',
        'assert',
        'constants',
        'punycode'
      ],
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'icons-vendor': ['lucide-vue-next'],
          'util-vendor': ['axios', 'file-saver', 'jszip']
        }
      }
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
  }
})
