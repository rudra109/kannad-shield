import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/ai': {
        target: 'http://localhost:4002',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
      '/api/sos': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/api/auth': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
