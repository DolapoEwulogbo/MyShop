import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { signInWithGoogle } from '../services/authService.js'

export default function Checkout() {
  const { user, loading } = useAuth()
  const { items, subtotal, total } = useCart()

  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

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

  function handleSubmit(event) {
    event.preventDefault()
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

            <label htmlFor="customer-name">Full name</label>
            <input
              id="customer-name"
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Enter your full name"
              required
            />

            <label htmlFor="customer-email">Email address</label>
            <input
              id="customer-email"
              type="email"
              value={user.email || ''}
              readOnly
            />

            <label htmlFor="customer-phone">Phone number</label>
            <input
              id="customer-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter your phone number"
              required
            />
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
            />
          </div>

          <button type="submit" className="button-primary">
            Place order
          </button>
        </form>

        <aside className="checkout-summary" aria-labelledby="order-summary-title">
          <h2 id="order-summary-title">Order summary</h2>

          {items.map((item) => (
            <div className="checkout-item" key={item.productId}>
              <div>
                <strong>{item.name}</strong>
                <p>
                  {item.quantity} × ₦{item.price.toLocaleString()}
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