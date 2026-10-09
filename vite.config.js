import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // "@/lib/api" en vez de "../../lib/api". shadcn/ui lo necesita antes de init.
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
