import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. Tambahkan ini
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. Tambahkan ini
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})