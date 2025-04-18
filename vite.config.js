import { defineConfig } from 'vite'
import { resolve } from 'path'
   
export default defineConfig({
  root: './', // 專案根目錄
  publicDir: 'public', // 靜態資源目錄
  server: {
    host: true,
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'https://api.x.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})