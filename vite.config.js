import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  // Pastikan ada garis miring di awal dan di akhir nama repository Anda
  base: '/myquranplan/', 
})