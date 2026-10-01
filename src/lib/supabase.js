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
// Auth is deliberately PKCE with a SINGLE explicit exchange in AuthCallback.
// Both options below MUST be set explicitly — supabase-js defaults to
// `flowType: "implicit"` and `detectSessionInUrl: true`
// (@supabase/supabase-js DEFAULT_AUTH_OPTIONS):
//  - flowType 'pkce': PKCE is the only flow that makes signInWithOAuth send a
//    code_challenge (GoTrueClient `_getUrlForProvider`), which is what makes
//    Supabase come back with `?code=...` instead of an implicit
//    `#access_token=...` hash. exchangeCodeForSession() is PKCE-only, so under
//    the implicit default there is never a code for AuthCallback to exchange.
//  - detectSessionInUrl false: otherwise the client auto-exchanges the code
//    during construction and deletes the verifier before AuthCallback's effect
//    runs, so the manual exchange fails with AuthPKCECodeVerifierMissingError.
//    Exactly one side may own the exchange, and that side is AuthCallback.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false
    }
  }
)
// supabase-js derives its default auth storage key as `sb-<project-ref>-auth-token`
// where <project-ref> is the first label of the Supabase hostname. The PKCE code
// verifier is stored under suffixed variants of this key, so the callback debug
// panel needs the same value. Exported once here so it never drifts.
export const authStorageKey = (() => {
  try {
    const host = new URL(supabaseUrl || '').hostname.split('.')[0]
    return host ? `sb-${host}-auth-token` : 'sb-unknown-auth-token'
  } catch {
    return 'sb-unknown-auth-token'
  }
})()

// Legacy fixed verifier key (supabase-js dual-writes this for redirects that
// carry no flow id) and the flow-scoped slot used when a flow id is present.
export const pkceLegacyVerifierKey = `${authStorageKey}-code-verifier`
export const pkceFlowSlotKey = (flowId) => `${authStorageKey}-flow-${flowId}-code-verifier`
export const pkceFlowIndexKey = `${authStorageKey}-flows-code-verifier`

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
