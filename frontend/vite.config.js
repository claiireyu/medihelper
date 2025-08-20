import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html',
        'add-medication': 'add-medication.html',
        'manage-medications': 'manage-medications.html',
        'refill-dashboard': 'refill-dashboard.html',
        'schedule': 'schedule.html',
        'history': 'history.html',
        'verify': 'verify.html'
      }
    }
  }
})
