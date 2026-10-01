import { Link, useLocation, useParams } from 'react-router-dom'
import { formatNaira } from '../utils/currency.js'

// Phase 6 — Success page per PRD: honest email status, no fake payment steps.
// Reads orderNumber/total passed via navigation state; falls back to the URL param.
export default function Success() {
  const { orderId } = useParams()
  const location = useLocation()
  const orderNumber = location.state?.orderNumber ?? orderId ?? '—'
  const total = location.state?.total
  const emailSent = location.state?.emailSent

  return (
    <section className="auth-card" aria-label="Order confirmation">
      <h1>Order Placed</h1>
      <p>
        Order number: <strong>{orderNumber}</strong>
      </p>
      {typeof total === 'number' && (
        <p>
          Total: <strong>{formatNaira(total)}</strong>
        </p>
      )}
      <p>Status: Pending — no payment was collected.</p>
      {emailSent === true && <p>We&apos;ve sent a confirmation email for this order.</p>}
      {emailSent === false && (
        <p>Your order is placed. We couldn&apos;t send the confirmation email, but you can see it under Orders.</p>
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

