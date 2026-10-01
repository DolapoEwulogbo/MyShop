import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Local dev runs on port 3000 to match `vercel dev` (used from Phase 6), so the
// origin stays stable across local dev and preview. This is NOT the production
// Site URL: that is the deployed Vercel URL (SETUP.md Part E). Localhost origins
// belong in Supabase's Redirect URLs, never in the Site URL.
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
