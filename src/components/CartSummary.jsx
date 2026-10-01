import { Link } from 'react-router-dom'
import { formatNaira } from '../utils/currency.js'

export default function CartSummary({ subtotal, total }) {
  return (
    <section className="cart-summary" aria-label="Order summary">
      <h2>Summary</h2>
      <p className="summary-row">
        <span>Subtotal</span>
        <span>{formatNaira(subtotal)}</span>
      </p>
      <p className="summary-row summary-total">
        <span>Total</span>
        <span>{formatNaira(total)}</span>
      </p>
      <Link className="button-primary" to="/checkout">
        Go to checkout
      </Link>
    </section>
  )
}
