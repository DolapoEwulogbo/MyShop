import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { signInWithGoogle } from '../services/authService.js'
import { createOrder, OrderError } from '../services/orderService.js'
import { formatNaira } from '../utils/currency.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mirrors server/validate.js so the customer gets instant per-field feedback.
// This is UX only — the server re-validates authoritatively and is never trusted
// to agree with the client.
function validateFields({ fullName, email, phone, deliveryAddress, items }) {
  const errors = {}
  if (!fullName.trim()) errors.fullName = 'Please enter your full name.'
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address.'
  if (!phone.trim()) errors.phone = 'Please enter your phone number.'
  if (!deliveryAddress.trim()) errors.deliveryAddress = 'Please enter a delivery address.'
  if (items.length < 1 || items.length > 50) {
    errors.items = 'Your cart must contain between 1 and 50 items.'
  }
  return errors
}

export default function Checkout() {
  const { user, loading } = useAuth()
  const { items, subtotal, total, clear } = useCart()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState(
    () => user?.user_metadata?.full_name || user?.user_metadata?.name || ''
  )
  // Prefilled from the Google account and still editable.
  const [email, setEmail] = useState(() => user?.email || '')
  const [phone, setPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  // One key per checkout attempt, reused across retries so a double-click or a
  // network retry can never create a second order. Rotated only after success.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  const summary = useMemo(
    () => items.map((item) => ({ ...item, lineTotal: item.price * item.quantity })),
    [items]
  )

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
        <p>Please sign in with Google before completing your order.</p>
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

  if (items.length === 0) {
    return (
      <section className="placeholder">
        <h1>Your cart is empty</h1>
        <p>Add products to your cart before checking out.</p>
      </section>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    setError('')
    setFieldErrors({})

    const nextFieldErrors = validateFields({ fullName, email, phone, deliveryAddress, items })
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setError('Please fix the highlighted fields and try again.')
      return
    }

    setSubmitting(true)
    try {
      const result = await createOrder({
        customer: { fullName, email, phone, deliveryAddress },
        items,
        idempotencyKey
      })

      // Success only: clear the cart, then rotate the key for the next attempt.
      clear()
      setIdempotencyKey(crypto.randomUUID())

      navigate(`/success/${result.orderId}`, {
        state: {
          orderNumber: result.orderNumber,
          total: subtotal,
          emailSent: result.emailSent
        }
      })
    } catch (err) {
      // Failure: keep the cart intact so the customer can retry.
      if (err instanceof OrderError && err.fieldErrors) setFieldErrors(err.fieldErrors)
      setError(err.message || 'We could not place your order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="checkout-page">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <p>Complete your details to place your order.</p>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          <div className="checkout-section">
            <h2>Customer information</h2>

            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}

            <label htmlFor="customer-name">Full name</label>
            <input
              id="customer-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? 'customer-name-error' : undefined}
            />
            {fieldErrors.fullName && (
              <p id="customer-name-error" role="alert" className="field-error">
                {fieldErrors.fullName}
              </p>
            )}

            <label htmlFor="customer-email">Email address</label>
            <input
              id="customer-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'customer-email-error' : undefined}
            />
            {fieldErrors.email && (
              <p id="customer-email-error" role="alert" className="field-error">
                {fieldErrors.email}
              </p>
            )}

            <label htmlFor="customer-phone">Phone number</label>
            <input
              id="customer-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter your phone number"
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'customer-phone-error' : undefined}
            />
            {fieldErrors.phone && (
              <p id="customer-phone-error" role="alert" className="field-error">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          <div className="checkout-section">
            <h2>Delivery address</h2>

            <label htmlFor="delivery-address">Address</label>
            <textarea
              id="delivery-address"
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              placeholder="Enter your delivery address"
              rows="4"
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.deliveryAddress)}
              aria-describedby={fieldErrors.deliveryAddress ? 'delivery-address-error' : undefined}
            />
            {fieldErrors.deliveryAddress && (
              <p id="delivery-address-error" role="alert" className="field-error">
                {fieldErrors.deliveryAddress}
              </p>
            )}
          </div>

          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? 'Processing Order...' : 'Place Order'}
          </button>
        </form>

        <aside className="checkout-summary" aria-labelledby="order-summary-title">
          <h2 id="order-summary-title">Order summary</h2>

          {fieldErrors.items && (
            <p role="alert" className="field-error">
              {fieldErrors.items}
            </p>
          )}

          {summary.map((item) => (
            <div className="checkout-item" key={item.productId}>
              <div>
                <strong>{item.name}</strong>
                <p>
                  {item.quantity} x {formatNaira(item.price)}
                </p>
              </div>
              <strong>{formatNaira(item.lineTotal)}</strong>
            </div>
          ))}

          <div className="checkout-total">
            <span>Subtotal</span>
            <strong>{formatNaira(subtotal)}</strong>
          </div>

          <div className="checkout-total checkout-grand-total">
            <span>Total</span>
            <strong>{formatNaira(total)}</strong>
          </div>
        </aside>
      </div>
    </section>
  )
}