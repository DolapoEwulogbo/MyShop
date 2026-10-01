import { Link } from 'react-router-dom'
import { formatNaira } from '../utils/currency.js'

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x600?text=No+Image'

function handleImgError(e) {
  e.currentTarget.src = PLACEHOLDER_IMAGE
}

export default function CartItem({ item, onIncrease, onDecrease, onRemove, limitMessage }) {
  const lineTotal = item.price * item.quantity
  const atMax = item.quantity >= Math.max(item.stock, 1)

  return (
    <li className="cart-line">
      <img src={item.imageUrl || PLACEHOLDER_IMAGE} alt={item.name} onError={handleImgError} />
      <div className="cart-line-info">
        <Link to={'/products/' + item.productId} className="cart-line-name">
          {item.name}
        </Link>
        <p className="cart-line-price">{formatNaira(item.price)} each</p>
        <div className="cart-qty" role="group" aria-label={'Quantity for ' + item.name}>
          <button type="button" aria-label={'Decrease quantity of ' + item.name} onClick={onDecrease} disabled={item.quantity <= 1}>
            −
          </button>
          <span aria-live="polite" aria-label={'Quantity: ' + item.quantity}>
            {item.quantity}
          </span>
          <button type="button" aria-label={'Increase quantity of ' + item.name} onClick={onIncrease} disabled={atMax}>
            +
          </button>
        </div>
        {limitMessage && (
          <p role="status" className="hint">
            {limitMessage}
          </p>
        )}
        <button type="button" className="link-button" onClick={onRemove} aria-label={'Remove ' + item.name + ' from cart'}>
          Remove
        </button>
      </div>
      <p className="cart-line-total">{formatNaira(lineTotal)}</p>
    </li>
  )
}
