import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import { supabase } from '../lib/supabase.js'

// Accept ?next= only when it is a same-origin absolute path: a single leading
// '/', never '//' (protocol-relative) and never a full URL. Anything else falls
// back to '/'. This closes the open-redirect hole an unchecked next would open.
function safeNext(value) {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) return value
  return '/'
}

// How long to wait for the Supabase client to detect and exchange the ?code=
// before we stop spinning and show a message. The client does the exchange
// itself (detectSessionInUrl), so this page only waits for the session.
const SESSION_WAIT_MS = 8000

// Development-only diagnostic. Renders URL/state facts (never tokens or codes).
function DebugPanel({ debug }) {
  return (
    <details className="debug-panel">
      <summary>Sign-in debug info (safe to share — no tokens)</summary>
      <dl>
        <dt>Current origin</dt>
        <dd>{debug.currentOrigin}</dd>
        <dt>Landing path</dt>
        <dd>{debug.landingPath}</dd>
        <dt>hasCode</dt>
        <dd>{String(debug.hasCode)}</dd>
        <dt>Query parameter names</dt>
        <dd>{debug.queryParamNames.length ? debug.queryParamNames.join(', ') : '(none)'}</dd>
        <dt>next</dt>
        <dd>{debug.next}</dd>
        <dt>Session found</dt>
        <dd>{String(debug.sessionFound)}</dd>
      </dl>
    </details>
  )
}

// Supabase sends users back here after Google. With PKCE + detectSessionInUrl
// the Supabase client exchanges the ?code= itself and emits SIGNED_IN; this
// page never calls exchangeCodeForSession. It simply waits for a session and
// then forwards to ?next=. Any failure is shown (with a retry), never a
// forever-spinning loader.
export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('waiting') // 'waiting' | 'error'
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState(null)
  // StrictMode mounts effects twice in dev (and a remount re-runs them), so act
  // on whichever happens first and ignore the rest.
  const settledRef = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error') || params.get('error_code')
    const errorDescription = params.get('error_description')
    const next = safeNext(params.get('next'))

    setDebug({
      currentOrigin: window.location.origin,
      landingPath: window.location.pathname,
      hasCode: params.has('code'),
      queryParamNames: Array.from(params.keys()),
      next,
      sessionFound: false
    })

    function fail(msg) {
      if (settledRef.current) return
      settledRef.current = true
      setMessage(msg)
      setStatus('error')
    }

    function succeed() {
      if (settledRef.current) return
      settledRef.current = true
      setDebug((d) => (d ? { ...d, sessionFound: true } : d))
      // Strip ?code=/?error= from the address bar before leaving.
      window.history.replaceState(null, '', '/auth/callback')
      navigate(next, { replace: true })
    }

    // 1. Supabase may have redirected back with an error instead of a code.
    if (errorParam) {
      fail(errorDescription || 'Sign-in failed. Please try again.')
      return undefined
    }

    // 2. The client may already have exchanged the code on load — check once.
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) succeed()
    })

    // 3. Otherwise wait for the client to finish and emit the session.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) succeed()
    })

    // 4. Never spin forever.
    const timer = window.setTimeout(() => {
      fail('We could not finish signing you in. Please try again.')
    }, SESSION_WAIT_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      listener.subscription.unsubscribe()
    }
  }, [navigate])

  if (status === 'error') {
    return (
      <section className="auth-card" aria-label="Sign-in problem">
        <h1>Sign-in did not finish</h1>
        <p role="alert" className="form-error">
          {message}
        </p>
        <p>
          <Link className="button-primary" to="/login">
            Try again
          </Link>
        </p>
        {import.meta.env.DEV && debug && <DebugPanel debug={debug} />}
      </section>
    )
  }

  return (
    <section className="callback-page">
      <Loading message="Finishing Google sign-in..." />
      {import.meta.env.DEV && debug && <DebugPanel debug={debug} />}
    </section>
  )
}