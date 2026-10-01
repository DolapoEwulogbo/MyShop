import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import { supabase } from '../lib/supabase.js'

function safeNext(value) {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) return value
  return '/checkout'
}

// Supabase sends users back here after Google (PKCE ?code= or legacy #access_token=).
// Purpose: wait for the session to persist, then forward to ?next= (e.g. /checkout).
// The supabase-js client (detectSessionInUrl: true) exchanges ?code= automatically.
export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    async function run() {
      const params = new URLSearchParams(window.location.search)
      const next = safeNext(params.get('next'))
      try {
        // Give detectSessionInUrl a moment to exchange ?code= for a session.
        let tries = 0
        let session = null
        while (tries < 20) {
          const result = await supabase.auth.getSession()
          session = result.data.session
          if (session) break
          await new Promise((r) => setTimeout(r, 150))
          tries += 1
        }
        if (!session) throw new Error('Sign-in did not complete. Please try again.')
      } catch (err) {
        if (!active) return
        navigate('/login?error=' + encodeURIComponent(err.message || 'Sign-in failed. Please try again.'), {
          replace: true
        })
        return
      }
      if (!active) return
      // Clean tokens out of the address bar, then go to the destination.
      window.history.replaceState(null, '', '/auth/callback')
      navigate(next, { replace: true })
    }
    run()
    return () => {
      active = false
    }
  }, [navigate])

  return <Loading message="Finishing Google sign-in..." />
}
