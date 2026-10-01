import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { signInWithGoogle } from '../services/authService.js'

function safeReturnTo(value) {
  // Only allow same-origin paths so a crafted ?returnTo= cannot send users elsewhere.
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) return value
  return '/checkout'
}

export default function Login() {
  const [params] = useSearchParams()
  const { user, loading } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(() => params.get('error_description') || params.get('error') || '')
  const returnTo = safeReturnTo(params.get('returnTo'))

  // Already signed in (e.g. "authenticated before") -> don't show the button again,
  // go back to where the user was trying to go. This is why a second click can
  // look like "nothing happens": Google immediately bounces back with an existing session.
  if (!loading && user) {
    return <Navigate to={returnTo} replace />
  }

  async function handleGoogle() {
    setBusy(true)
    setError('')
    try {
      await signInWithGoogle(returnTo)
      // On success the browser leaves for Google, so we stay in "busy" state.
    } catch (err) {
      setError(err.message || 'We could not start Google sign-in. Please try again.')
      setBusy(false)
    }
  }

  return (
    <section className="auth-card" aria-label="Sign in">
      <h1>Sign in to continue</h1>
      <p>Please sign in to check out and see your orders. We use Google sign-in only — no passwords to remember.</p>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button type="button" className="button-primary" onClick={handleGoogle} disabled={busy || loading}>
        {busy ? 'Redirecting to Google...' : 'Continue with Google'}
      </button>
      {user && <p className="hint">You are already signed in as {user.email}.</p>}
    </section>
  )
}
