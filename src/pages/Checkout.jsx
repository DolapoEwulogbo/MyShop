import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { signInWithGoogle } from '../services/authService.js'
import { supabase } from '../lib/supabase.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Checkout() {
  const { user, loading } = useAuth()
  const { items, subtotal, total, clear } = useCart()
  const navigate = useNavigate()

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState(() => user?.email || '')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  // Keep one key per checkout attempt; reuse it on retry so double-click /
  // network retry can never create a second order. New key only after success.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  const summary = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        lineTotal: item.price * item.quantity
      })),
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
    setError('')
    setFieldErrors({})

    if (submitting) return

    // Client-side validation mirrors server/AGENTS.md Sec 9 so users get
    // instant per-field messages; the server re-validates authoritatively.
    const nextFieldErrors = {}
    if (!customerName.trim()) nextFieldErrors.customerName = 'Please enter your full name.'
    if (!EMAIL_RE.test(customerEmail.trim()))
      nextFieldErrors.customerEmail = 'Please enter a valid email address.'
    if (!phone.trim()) nextFieldErrors.customerPhone = 'Please enter your phone number.'
    if (!address.trim()) nextFieldErrors.deliveryAddress = 'Please enter your delivery address.'
    if (items.length === 0 || items.length > 50)
      nextFieldErrors.items = 'Your cart must contain between 1 and 50 items.'
    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      setError('Please fix the highlighted fields and try again.')
      return
    }

    setSubmitting(true)

    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error('Your session has expired. Please sign in again.')
      }

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: phone.trim(),
          deliveryAddress: address.trim(),
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity
          })),
          idempotencyKey
        })
      })

      // Some error paths (e.g. proxy HTML) are not JSON — never crash on parse.
      let result = null
      try {
        result = await response.json()
      } catch {
        result = null
      }

      if (!response.ok) {
        if (result?.fieldErrors) setFieldErrors(result.fieldErrors)
        if (response.status === 409 && result?.error) {
          throw new Error(result.error)
        }
        throw new Error(
          result?.error || 'We could not place your order. Please try again.'
        )
      }

      clear()
      setIdempotencyKey(crypto.randomUUID())

      navigate(`/success/${result.order.order_number}`, {
        state: {
          orderNumber: result.order.order_number,
          total: result.order.total_amount,
          emailSent: result.emailSent === true
        }
      })
    } catch (err) {
      setError(
        err.message || 'We could not place your order. Please try again.'
      )
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
        <form className="checkout-form" onSubmit={handleSubmit}>
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
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Enter your full name"
              required
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.customerName)}
              aria-describedby={fieldErrors.customerName ? 'customer-name-error' : undefined}
            />
            {fieldErrors.customerName && (
              <p id="customer-name-error" role="alert" className="field-error">
                {fieldErrors.customerName}
              </p>
            )}

            <label htmlFor="customer-email">Email address</label>
            <input
              id="customer-email"
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              placeholder="you@example.com"
              required
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.customerEmail)}
              aria-describedby={fieldErrors.customerEmail ? 'customer-email-error' : undefined}
            />
            {fieldErrors.customerEmail && (
              <p id="customer-email-error" role="alert" className="field-error">
                {fieldErrors.customerEmail}
              </p>
            )}

            <label htmlFor="customer-phone">Phone number</label>
            <input
              id="customer-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter your phone number"
              required
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.customerPhone)}
              aria-describedby={fieldErrors.customerPhone ? 'customer-phone-error' : undefined}
            />
            {fieldErrors.customerPhone && (
              <p id="customer-phone-error" role="alert" className="field-error">
                {fieldErrors.customerPhone}
              </p>
            )}
          </div>

          <div className="checkout-section">
            <h2>Delivery address</h2>

            <label htmlFor="delivery-address">Address</label>
            <textarea
              id="delivery-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Enter your delivery address"
              rows="4"
              required
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

          <button
            type="submit"
            className="button-primary"
            disabled={submitting}
          >
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
        </form>

        <aside
          className="checkout-summary"
          aria-labelledby="order-summary-title"
        >
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
                  {item.quantity} x ₦{item.price.toLocaleString()}
                </p>
              </div>

              <strong>
                ₦{(item.price * item.quantity).toLocaleString()}
              </strong>
            </div>
          ))}

          <div className="checkout-total">
            <span>Subtotal</span>
            <strong>₦{subtotal.toLocaleString()}</strong>
          </div>

          <div className="checkout-total checkout-grand-total">
            <span>Total</span>
            <strong>₦{total.toLocaleString()}</strong>
          </div>
        </aside>
      </div>
    </section>
  )
}