import { useAuth } from '../context/AuthContext.jsx'
import { signInWithGoogle } from '../services/authService.js'

export default function Checkout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <section className="placeholder" aria-live="polite">
        <h1>Checkout</h1>
        <p>Checking your sign-in status...</p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="auth-card" aria-labelledby="checkout-login-title">
        <h1 id="checkout-login-title">Sign in to checkout</h1>
        <p>
          Please sign in with Google before completing your order.
        </p>

        <button
          type="button"
          className="button-primary"
          onClick={() => signInWithGoogle('/checkout')}
        >
          Continue with Google
        </button>
      </section>
    )
  }

  return (
    <section className="placeholder">
      <h1>Checkout</h1>
      <p>Signed in as {user.email}</p>
      <p>Checkout form will be added in the next step.</p>
    </section>
  )
}