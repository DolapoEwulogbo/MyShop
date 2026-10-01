import { Link } from 'react-router-dom'
import { formatNaira, getAvailability } from '../utils/currency.js'

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x600?text=No+Image'

export default function ProductCard({ product, onAdd }) {
  const availability = getAvailability(product.stock)
  const outOfStock = product.stock <= 0

  return (
    <article className="card">
      <Link to={`/products/${product.id}`} className="card-link" aria-label={`View ${product.name}`}>
        <img
          src={product.image_url || PLACEHOLDER_IMAGE}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER_IMAGE
          }}
        />
        <h3>{product.name}</h3>
      </Link>
      <p className="price">{formatNaira(product.price)}</p>
      <p className={`availability availability-${availability.tone}`}>
        <span aria-hidden="true">{availability.tone === 'in' ? '● ' : availability.tone === 'low' ? '▲ ' : '○ '}</span>
        {availability.label}
      </p>
      <button type="button" disabled={outOfStock} onClick={() => onAdd?.(product)} title={outOfStock ? 'Out of stock' : `Add ${product.name} to cart`}>
        {outOfStock ? 'Out of Stock' : 'Add to cart'}
      </button>
    </article>
  )
}
