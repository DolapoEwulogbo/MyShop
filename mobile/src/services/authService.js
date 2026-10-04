import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import Constants from 'expo-constants'
import { supabase } from '../lib/supabase.js'

// Google OAuth on a phone: a browser completes Google's consent screen, then
// returns to the app through a redirect URL carrying the sign-in tokens.
//
// In Expo Go on iOS, custom schemes cannot return to the app (Safari and the
// auth session both refuse the exp:// redirect on recent iOS). Instead we
// complete the flow on an https page under expo.dev/expo-go — a universal
// link Expo Go is entitled to — and the auth session hands us that URL with
// the tokens in its #fragment. In a real (dev/prod) build, use the app's own
// scheme from app.json, which iOS can route back into the app.
const IN_EXPO_GO = Constants.appOwnership === 'expo'
const redirectTo = IN_EXPO_GO ? 'https://expo.dev/expo-go/auth/callback' : Linking.createURL('auth/callback')

// skipBrowserRedirect: true makes supabase-js hand us the Google URL instead
// of trying to redirect inside the app; we open it in an in-app auth session.
// With this supabase-js version the OAuth flow is implicit, so the callback
// URL carries access_token/refresh_token in its fragment, and supabase-js
// does not read URLs by itself on native — we parse and setSession manually.
function tokensFromCallbackUrl(url) {
  const hashIndex = url.indexOf('#')
  if (hashIndex === -1) return null
  const params = {}
  url
    .slice(hashIndex + 1)
    .split('&')
    .forEach((pair) => {
      const [key, value] = pair.split('=')
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(value ?? '')
    })
  return params
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true }
  })
  if (error) throw new Error('We could not start Google sign-in. Please try again.')
  if (!data?.url) throw new Error('We could not start Google sign-in. Please try again.')

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    preferUniversalLinks: IN_EXPO_GO
  })
  if (result.type !== 'success') {
    throw new Error('Google sign-in was cancelled. Please try again.')
  }

  const params = tokensFromCallbackUrl(result.url)
  if (!params?.access_token || !params?.refresh_token) {
    throw new Error('Google sign-in could not be completed. Please try again.')
  }
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: params.access_token,
    refresh_token: params.refresh_token
  })
  if (sessionError) throw new Error('Google sign-in could not be completed. Please try again.')
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error('We could not sign you out. Please try again.')
}
