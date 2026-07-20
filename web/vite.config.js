import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // IMPORTANT: more-specific paths must come BEFORE the general /api catch-all
      '/api/ai': {
        target: 'http://localhost:4002',
        changeOrigin: true,
      },
      '/api/auth': {
        target: 'http://localhost:4000',  // SOS service handles all auth
        changeOrigin: true,
      },
      '/api/sos': {
        target: 'http://localhost:4000',  // SOS service handles SOS routes
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:4001',  // Cybercrime service — catch-all for /api/police, /api/cyber, /api/evidence
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
