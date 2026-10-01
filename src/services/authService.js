import { supabase } from '../lib/supabase.js'

// Auth is a thin wrapper so pages never touch Supabase directly.
export async function signInWithGoogle(returnPath = '/checkout') {
  const redirectTo = window.location.origin + returnPath
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
