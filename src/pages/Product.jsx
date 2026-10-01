import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Loading from '../components/Loading.jsx'
import { getProductById } from '../services/productService.js'
import { formatNaira, getAvailability } from '../utils/currency.js'

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x600?text=No+Image'

export default function Product() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getProductById(id)
      setProduct(data)
      setQuantity(1)
    } catch (err) {
      setError('We could not load this product. It may have been removed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  if (loading) return <Loading message="Loading product..." />
  if (error) return <ErrorMessage message={error} onRetry={load} />
  if (!product) return null

  const availability = getAvailability(product.stock)
  const outOfStock = product.stock <= 0
  const maxQty = Math.max(product.stock, 1)

  function handleQtyChange(e) {
    const next = Number(e.target.value)
    if (Number.isNaN(next)) return
    setQuantity(Math.min(Math.max(next, 1), maxQty))
  }

  function handleImgError(e) {
    e.currentTarget.src = PLACEHOLDER_IMAGE
  }

  function handleAdd() {
    setNotice('Added ' + quantity + ' x ' + product.name + ' to cart')
  }

  return (
    <section className="details" aria-label={product.name}>
      <img src={product.image_url || PLACEHOLDER_IMAGE} alt={product.name} onError={handleImgError} />
      <div>
        <h1>{product.name}</h1>
        <p className="price">{formatNaira(product.price)}</p>
        <p className={'availability availability-' + availability.tone}>{availability.label}</p>
        <p>{product.description}</p>

        {notice && (
          <p role="status" aria-live="polite" className="notice">
            {notice}
          </p>
        )}

        <div className="qty-row">
          <label htmlFor="qty">Quantity</label>
          <input id="qty" type="number" min="1" max={maxQty} value={quantity} disabled={outOfStock} onChange={handleQtyChange} />
          {product.stock > 0 && product.stock <= 5 && (
            <span className="hint">Only {product.stock} left.</span>
          )}
        </div>

        <div className="actions">
          <button type="button" className="button-primary" disabled={outOfStock} onClick={handleAdd}>
            {outOfStock ? 'Out of Stock' : 'Add to cart'}
          </button>
          <Link className="button-secondary" to="/">
            Continue shopping
          </Link>
        </div>
      </div>
    </section>
  )
}
