import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/vue-test/',
  build: {
    outDir: '../vue-test',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://qianxian.site',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'https://qianxian.site',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
