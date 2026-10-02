import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import { supabase } from '../lib/supabase.js'
import { formatNaira } from '../utils/currency.js'

// Phase 6 — order confirmation for /success/:orderId (AGENTS.md Sec 5).
//
// The :orderId route param is the order's UUID PRIMARY KEY (orders.id), which
// Checkout passes as `/success/${result.orderId}`. We load the order with the
// SIGNED-IN user's browser client (anon key) — NOT the admin client — so RLS
// policy "orders: read own" (001_schema.sql) guarantees a customer can only read
// their own order: a wrong or someone else's id simply returns no row.
//
// emailSent is the API's transient result and is NOT persisted in the database,
// so it comes from navigation state; it defaults to false (Phase 6 sends no mail).
export default function Success() {
  const { orderId } = useParams()
  const location = useLocation()
  const emailSent = location.state?.emailSent === true

  const [order, setOrder] = useState(null)
  const [loadState, setLoadState] = useState('loading') // 'loading' | 'ready' | 'notfound' | 'error'

  useEffect(() => {
    let active = true

    async function load() {
      // RLS-scoped read: the embedded order_items + products are also filtered by
      // policy, so this can never surface another user's data.
      const { data, error } = await supabase
        .from('orders')
        .select(
          'id, order_number, total_amount, status, created_at, ' +
            'order_items ( quantity, price, products ( name ) )'
        )
        .eq('id', orderId)
        .maybeSingle()

      if (!active) return
      if (error) {
        setLoadState('error')
        return
      }
      if (!data) {
        setLoadState('notfound')
        return
      }
      setOrder(data)
      setLoadState('ready')
    }

    load()
    return () => {
      active = false
    }
  }, [orderId])

  if (loadState === 'loading') {
    return (
      <section className="placeholder" aria-live="polite">
        <h1>Order Placed</h1>
        <Loading message="Loading your order..." />
      </section>
    )
  }

  if (loadState === 'error' || loadState === 'notfound') {
    return (
      <section className="auth-card" aria-label="Order confirmation">
        <h1>Order Placed</h1>
        <p role="alert" className="form-error">
          {loadState === 'error'
            ? 'We could not load this order. Please try again.'
            : 'We could not find that order on your account.'}
        </p>
        <div className="actions">
          <Link className="button-primary" to="/orders">
            View my orders
          </Link>
          <Link className="button-secondary" to="/">
            Continue shopping
          </Link>
        </div>
      </section>
    )
  }

  const items = order.order_items || []

  return (
    <section className="auth-card" aria-label="Order confirmation">
      <h1>Order Placed</h1>
      <p>
        Order number: <strong>{order.order_number}</strong>
      </p>
      <p>
        Total: <strong>{formatNaira(order.total_amount)}</strong>
      </p>
      <p>Status: {order.status} — no payment was collected.</p>

      {items.length > 0 && (
        <ul className="order-items">
          {items.map((item, index) => (
            <li key={index}>
              {item.products?.name || 'Item'} — {item.quantity} x {formatNaira(item.price)}
            </li>
          ))}
        </ul>
      )}

      {emailSent ? (
        <p>We&apos;ve sent a confirmation email for this order.</p>
      ) : (
        <p>
          Your order is placed. We couldn&apos;t send the confirmation email, but your order is
          saved under Orders.
        </p>
      )}

      <div className="actions">
        <Link className="button-primary" to="/">
          Continue shopping
        </Link>
        <Link className="button-secondary" to="/orders">
          View orders
        </Link>
      </div>
    </section>
  )
}