import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'shop_cart'
const PLACEHOLDER_IMAGE = 'https://placehold.co/600x600?text=No+Image'

const CartContext = createContext(null)

function readStoredCart() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && typeof item.productId === 'string' && Number.isFinite(item.quantity))
      .map((item) => ({
        productId: item.productId,
        name: typeof item.name === 'string' ? item.name : 'Product',
        price: Number.isFinite(item.price) && item.price >= 0 ? Math.floor(item.price) : 0,
        imageUrl: typeof item.imageUrl === 'string' && item.imageUrl ? item.imageUrl : PLACEHOLDER_IMAGE,
        stock: Number.isFinite(item.stock) && item.stock >= 0 ? Math.floor(item.stock) : 99,
        quantity: Math.max(1, Math.floor(item.quantity))
      }))
      .map((item) => ({ ...item, quantity: Math.min(item.quantity, Math.max(item.stock, 1)) }))
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readStoredCart())
  const [notice, setNotice] = useState('')

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage full or unavailable — cart still works in memory.
    }
  }, [items])

  const flashNotice = useCallback((message) => {
    setNotice(message)
    if (flashNotice.timer) window.clearTimeout(flashNotice.timer)
    flashNotice.timer = window.setTimeout(() => setNotice(''), 3000)
  }, [])

  const add = useCallback(
    (product, qty = 1) => {
      if (!product || product.stock <= 0) {
        flashNotice('Sorry, this product is out of stock.')
        return { added: false, reason: 'out-of-stock' }
      }
      const wanted = Math.max(1, Math.floor(qty) || 1)
      let result = { added: true, capped: false }
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id)
        const currentQty = existing ? existing.quantity : 0
        const allowed = Math.min(currentQty + wanted, Math.max(product.stock, 1))
        result = { added: true, capped: currentQty + wanted > product.stock }
        const entry = {
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.image_url || PLACEHOLDER_IMAGE,
          stock: product.stock,
          quantity: allowed
        }
        if (existing) return prev.map((i) => (i.productId === product.id ? entry : i))
        return [...prev, entry]
      })
      return result
    },
    [flashNotice]
  )

  const updateQuantity = useCallback(
    (productId, qty) => {
      let capped = false
      setItems((prev) =>
        prev.map((item) => {
          if (item.productId !== productId) return item
          const next = Math.min(Math.max(Math.floor(qty) || 1, 1), Math.max(item.stock, 1))
          capped = next < qty
          return { ...item, quantity: next }
        })
      )
      return { capped }
    },
    []
  )

  const remove = useCallback(
    (productId) => {
      const found = items.find((i) => i.productId === productId)
      setItems((prev) => prev.filter((i) => i.productId !== productId))
      flashNotice(found ? 'Item removed from cart.' : 'Item removed.')
    },
    [flashNotice, items]
  )

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0)
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    return { items, count, subtotal, total: subtotal, notice, add, updateQuantity, remove, clear, flashNotice }
  }, [items, notice, add, updateQuantity, remove, clear, flashNotice])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
