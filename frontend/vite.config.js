import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
        allowedHosts: ['www.proker.xyz', 'proker.xyz', 'localhost', '127.0.0.1', '[::1]'],
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    cssCodeSplit: false,
  },
})
