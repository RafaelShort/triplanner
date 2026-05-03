import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // ← ERA ESSE QUE ESTAVA FALTANDO

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // ← restaura o CSS
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // redireciona para o backend
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
