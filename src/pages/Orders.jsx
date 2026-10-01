import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Phase 8 stub — real order history needs a signed-in user; the list itself
// arrives with the orders service. This unblocks navigation without faking data.
export default function Orders() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <section className="placeholder" aria-live="polite">
        <h1>Orders</h1>
        <p>Checking your sign-in status...</p>
      </section>
    )
  }

  return (
    <section className="placeholder">
      <h1>Orders</h1>
      {user ? (
        <>
          <p>Signed in as {user.email}. Your order history will appear here.</p>
          <p>
            <Link className="button-primary" to="/">
              Start shopping
            </Link>
          </p>
          <p>
            <button type="button" className="link-button" onClick={signOut}>
              Sign out
            </button>
          </p>
        </>
      ) : (
        <p>You haven&apos;t placed any orders yet.</p>
      )}
    </section>
  )
}

