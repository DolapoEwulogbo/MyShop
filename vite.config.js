import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Port 3000 is deliberate: Supabase's Site URL (SETUP.md Part E) and `vercel dev`
// both use 3000, so local dev, the OAuth redirect and Vercel stay in lockstep.
// strictPort makes Vite fail loudly instead of silently moving to 3001 — a
// silent port change would break the OAuth redirect, which must match exactly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true
  },
  preview: {
    port: 3000
  }
})
