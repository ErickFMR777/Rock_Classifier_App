import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In production the frontend talks to the backend through VITE_API_URL.
// In development the proxy below lets the app use the same `/api` paths
// against a locally running uvicorn instance without any env var.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.BACKEND_ORIGIN || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
