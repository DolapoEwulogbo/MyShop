import { createClient } from '@supabase/supabase-js'

// Phase 4: browser Supabase client (anon key only — safe to expose).
// Values come from .env.local locally and Vercel env vars in production.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to .env.local (see .env.example).')
}

// Create the client with placeholder values if env is missing so the app
// renders an error state instead of crashing to a blank page.
//
// Auth is PKCE, with the Supabase client performing the single code exchange
// itself. Both options are pinned explicitly so we never depend on SDK defaults
// again (those defaults are what caused the earlier redirect mess):
//  - flowType 'pkce': the only flow that makes signInWithOAuth send a
//    code_challenge, so Supabase returns with `?code=...` instead of an
//    implicit `#access_token=...` hash.
//  - detectSessionInUrl true: on load the client detects that `?code=` and
//    exchanges it, then emits SIGNED_IN — wherever Supabase lands us (our
//    /auth/callback, or the Site URL if the redirect URL isn't allow-listed).
//    AuthCallback therefore only WAITS for the session; it never exchanges.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true
    }
  }
)
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
