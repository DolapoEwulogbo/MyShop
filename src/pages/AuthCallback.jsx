import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import { supabase } from '../lib/supabase.js'

function safeNext(value) {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) return value
  return '/checkout'
}

// Supabase sends users back here after Google with ?code= (PKCE).
// Purpose: exchange the code ONCE for a session, then forward to ?next=.
// Do NOT use detectSessionInUrl auto-exchange + manual exchange together —
// the auto-exchange consumes the code/verifier first, so a manual second
// exchange fails and the page goes blank or bounces to /login.
let exchangedCode = null

export default function AuthCallback() {
  const navigate = useNavigate()
  const [debug, setDebug] = useState(null)

  useEffect(() => {
    let active = true

    async function run() {
      // React StrictMode mounts effects twice in dev — never exchange the same
      // one-time code twice (second exchange fails with "code verifier" errors).
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const errorParam = params.get('error')
      const errorDescription = params.get('error_description')
      const next = safeNext(params.get('next'))

      if (errorParam) {
        if (!active) return
        navigate(
          '/login?error=' +
            encodeURIComponent(errorDescription || errorParam || 'Sign-in failed. Please try again.'),
          { replace: true }
        )
        return
      }

      if (!code) {
        setDebug({
          hasCode: false,
          hasNext: Boolean(params.get('next')),
          queryKeys: Array.from(params.keys()),
          hashPresent: window.location.hash.length > 0,
          hint: 'No ?code= arrived. Supabase redirected without a PKCE code — check Supabase Redirect URLs include this exact /auth/callback URL.'
        })
        if (!active) return
        navigate('/login?error=' + encodeURIComponent('No sign-in code was provided. Please try again.'), {
          replace: true
        })
        return
      }

      if (exchangedCode === code) return
      exchangedCode = code

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error

        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (!session) throw new Error('Sign-in did not complete. Please try again.')

        if (!active) return
        window.history.replaceState(null, '', '/auth/callback')
        navigate(next, { replace: true })
      } catch (err) {
        const message = err.message || 'Sign-in failed. Please try again.'
        setDebug({ hasCode: true, exchangeError: message })
        if (!active) return
        navigate('/login?error=' + encodeURIComponent(message), { replace: true })
      }
    }

    run()

    return () => {
      active = false
    }
  }, [navigate])

  return (
    <>
      <Loading message="Finishing Google sign-in..." />
      {debug && (
        <details style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
          <summary>Sign-in debug info (safe to share — no tokens)</summary>
          <pre>{JSON.stringify(debug, null, 2)}</pre>
        </details>
      )}
    </>
  )
}
