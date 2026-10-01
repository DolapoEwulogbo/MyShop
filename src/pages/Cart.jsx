import { useState } from 'react'
import { Link } from 'react-router-dom'
import CartItem from '../components/CartItem.jsx'
import CartSummary from '../components/CartSummary.jsx'
import { useCart } from '../context/CartContext.jsx'

export default function Cart() {
  const { items, subtotal, total, updateQuantity, remove, notice } = useCart()
  const [limits, setLimits] = useState({})

  function handleIncrease(item) {
    const result = updateQuantity(item.productId, item.quantity + 1)
    if (result.capped || item.quantity + 1 > item.stock) {
      setLimits((prev) => ({ ...prev, [item.productId]: 'Only ' + item.stock + ' available.' }))
    }
  }

  function handleDecrease(item) {
    setLimits((prev) => {
      const next = { ...prev }
      delete next[item.productId]
      return next
    })
    updateQuantity(item.productId, item.quantity - 1)
  }

  function handleRemove(item) {
    setLimits((prev) => {
      const next = { ...prev }
      delete next[item.productId]
      return next
    })
    remove(item.productId)
  }

  if (items.length === 0) {
    return (
      <section className="cart-empty" aria-label="Shopping cart">
        <h1>Your cart</h1>
        {notice && (
          <p role="status" aria-live="polite" className="notice">
            {notice}
          </p>
        )}
        <p>Your cart is empty.</p>
        <Link className="button-primary" to="/">
          Continue shopping
        </Link>
      </section>
    )
  }

  return (
    <section aria-label="Shopping cart">
      <h1>Your cart</h1>
      {notice && (
        <p role="status" aria-live="polite" className="notice">
          {notice}
        </p>
      )}
      <div className="cart-layout">
        <ul className="cart-list">
          {items.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              onIncrease={() => handleIncrease(item)}
              onDecrease={() => handleDecrease(item)}
              onRemove={() => handleRemove(item)}
              limitMessage={limits[item.productId]}
            />
          ))}
        </ul>
        <CartSummary subtotal={subtotal} total={total} />
      </div>
    </section>
  )
}
