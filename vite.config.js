import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
//
// Local development is TWO processes (AGENTS.md Sec 11):
//   Terminal A: vercel dev --listen 3001  -> serves the /api function only
//   Terminal B: npm run dev              -> THIS server, the app on port 3000
// The proxy below forwards /api to 3001, so the browser only ever talks to
// http://localhost:3000 — one origin, matching production. The vercel.json
// rewrite stays in place for production only.
//
// Port 3000 is deliberate: it matches the localhost origin in Supabase's
// Redirect URLs. This is NOT the production Site URL: that is the deployed
// Vercel URL (SETUP.md Part E). Localhost origins belong in Redirect URLs,
// never in the Site URL. strictPort makes Vite fail loudly instead of silently
// moving to another port — a silent port change would break the OAuth redirect,
// which must match exactly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    // Local dev is TWO processes: this Vite server (3000) serves the app, and
    // `vercel dev --listen 3001` serves the /api function. Proxy /api to 3001 so
    // the browser only ever talks to http://localhost:3000 — the single-origin
    // model production has. We do NOT let `vercel dev` serve the app locally: its
    // rewrite handling breaks Vite's own dev assets.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 3000
  }
})
