import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Phase 8 stub — shows real session data; editable profile fields come later.
export default function Account() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <section className="placeholder" aria-live="polite">
        <h1>Account</h1>
        <p>Checking your sign-in status...</p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="auth-card" aria-label="Account">
        <h1>Account</h1>
        <p>You are not signed in.</p>
        <Link className="button-primary" to="/login?returnTo=%2Faccount">
          Sign in
        </Link>
      </section>
    )
  }

  return (
    <section className="auth-card" aria-label="Account">
      <h1>Account</h1>
      <p>
        Name: <strong>{user.user_metadata?.full_name || user.user_metadata?.name || '—'}</strong>
      </p>
      <p>
        Email: <strong>{user.email}</strong>
      </p>
      <p>
        <Link className="button-secondary" to="/orders">
          View orders
        </Link>
      </p>
      <p>
        <button type="button" className="button-primary" onClick={signOut}>
          Sign out
        </button>
      </p>
    </section>
  )
}

