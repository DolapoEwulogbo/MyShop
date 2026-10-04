import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AppState } from 'react-native'
import { supabase } from '../lib/supabase.js'
import { signOut as signOutService } from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return
        if (error) setUser(null)
        else setUser(data.session?.user ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setUser(null)
        setLoading(false)
      })

    // (event, session) — NOT (session) alone. The old single-arg form set user
    // to the event string ('SIGNED_IN'), which broke the web app once.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // The Google flow finishes in the phone's browser and returns through a
    // deep link; re-reading the session whenever the app becomes active makes
    // sure the sign-in is picked up even if the URL event was missed (a known
    // Expo Go quirk).
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
      appStateSub.remove()
    }
  }, [])

  const value = useMemo(() => ({ user, loading, signOut: signOutService }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
