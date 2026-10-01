import { supabase } from '../lib/supabase.js'

// Auth is a thin wrapper so pages never touch Supabase directly.
// Redirect target is /auth/callback?next=<path> so sign-in works from any
// domain (localhost, preview, Vercel) — Supabase only needs to whitelist
// the /auth/callback URLs, not every page.
// NOTE: the auth flow options (flowType 'pkce', detectSessionInUrl false) are
// set once on the client in ../lib/supabase.js. flowType must be 'pkce' for
// Supabase to issue a ?code= at all, and the exchange is owned solely by
// AuthCallback. Nothing auth-flow-related belongs here, so the two sides
// cannot disagree.
export async function signInWithGoogle(returnPath = '/checkout') {
  const safePath =
    typeof returnPath === 'string' && returnPath.startsWith('/') && !returnPath.startsWith('//')
      ? returnPath
      : '/checkout'
  const redirectTo = window.location.origin + '/auth/callback?next=' + encodeURIComponent(safePath)
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  })
  if (error) throw new Error('We could not start Google sign-in. Please try again.')
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error('We could not sign you out. Please try again.')
}
