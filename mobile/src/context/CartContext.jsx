import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from './AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { clearCart, deleteCartItem, listCartItems, mergeGuestCart, upsertCartItem } from '../services/cartService.js'

// This is the web app's CartContext with localStorage swapped for AsyncStorage.
// The cart rows live in the SAME public.cart_items table the web app uses, so
// the realtime channel below is what makes a web change appear on this phone
// instantly (and vice versa).
const STORAGE_KEY = 'shop_cart'
const PLACEHOLDER_IMAGE = 'https://placehold.co/600x600?text=No+Image'

const CartContext = createContext(null)

function parseGuestCart(raw) {
  try {
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
  const { user, loading } = useAuth()
  // null = still reading the saved guest cart from disk.
  const [items, setItems] = useState(null)
  const [notice, setNotice] = useState('')

  const userId = user?.id ?? null

  // Mirrors `items` so mutators can compute the next cart synchronously.
  const itemsRef = useRef(items)
  const userIdRef = useRef(null)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  const applyItems = useCallback((next) => {
    itemsRef.current = next
    setItems(next)
  }, [])

  const flashNotice = useCallback((message) => {
    setNotice(message)
    if (flashNotice.timer) clearTimeout(flashNotice.timer)
    flashNotice.timer = setTimeout(() => setNotice(''), 3000)
  }, [])

  // Signed out: the cart is the saved guest cart on this phone.
  useEffect(() => {
    if (userId) return
    if (items === null) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {
      // Storage full or unavailable — cart still works in memory.
    })
  }, [items, userId])

  // Signed in: fold any guest cart into the account cart on the way in, then
  // load the account cart from the server.
  useEffect(() => {
    if (loading) return
    let cancelled = false

    if (!userId) {
      AsyncStorage.getItem(STORAGE_KEY)
        .then((raw) => {
          if (!cancelled) applyItems(parseGuestCart(raw))
        })
        .catch(() => {
          if (!cancelled) applyItems([])
        })
      return
    }

    async function loadForUser() {
      // Read AND delete the guest cart in one step so a remount can never
      // merge the same lines twice and double the quantities.
      let guest = []
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        if (raw) await AsyncStorage.removeItem(STORAGE_KEY)
        guest = parseGuestCart(raw)
      } catch {
        guest = []
      }
      if (guest.length > 0) {
        try {
          await mergeGuestCart(userId, guest)
        } catch {
          // Carry on with the saved cart rather than blocking the app.
        }
      }
      try {
        const rows = await listCartItems(userId)
        if (!cancelled) applyItems(rows)
      } catch {
        if (!cancelled) applyItems([])
      }
    }

    loadForUser()
    return () => {
      cancelled = true
    }
  }, [userId, loading, applyItems])

  // Live sync — the heart of the assignment. ANY change to cart_items for this
  // user (from the web app or another phone) refetches the whole cart, so the
  // screen converges on the stored rows no matter which device changed them.
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('cart:' + userId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: 'user_id=eq.' + userId },
        () => {
          listCartItems(userId)
            .then((rows) => applyItems(rows))
            .catch(() => {
              // Keep the last good cart rather than blanking the screen.
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, applyItems])

  // Persist in the background; the realtime refetch confirms. On failure we
  // re-read from the server so the screen never drifts from the stored cart.
  const persist = useCallback(
    (write) => {
      const uid = userIdRef.current
      if (!uid) return
      write(uid).catch(() => {
        listCartItems(uid)
          .then((rows) => applyItems(rows))
          .catch(() => flashNotice('We could not save your cart. Please try again.'))
      })
    },
    [applyItems, flashNotice]
  )

  const add = useCallback(
    (product, qty = 1) => {
      if (!product || product.stock <= 0) {
        flashNotice('Sorry, this product is out of stock.')
        return { added: false, reason: 'out-of-stock' }
      }

      const wanted = Math.max(1, Math.floor(qty) || 1)
      const max = Math.max(product.stock, 1)
      const prev = itemsRef.current ?? []
      const existing = prev.find((i) => i.productId === product.id)
      const currentQty = existing ? existing.quantity : 0
      const allowed = Math.min(currentQty + wanted, max)

      const entry = {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.image_url || PLACEHOLDER_IMAGE,
        stock: product.stock,
        quantity: allowed
      }
      applyItems(existing ? prev.map((i) => (i.productId === product.id ? entry : i)) : [...prev, entry])
      persist((uid) => upsertCartItem(uid, product.id, allowed))

      return { added: true, capped: currentQty + wanted > product.stock }
    },
    [applyItems, flashNotice, persist]
  )

  const updateQuantity = useCallback(
    (productId, qty) => {
      const prev = itemsRef.current ?? []
      const item = prev.find((i) => i.productId === productId)
      if (!item) return { capped: false }

      const next = Math.min(Math.max(Math.floor(qty) || 1, 1), Math.max(item.stock, 1))
      applyItems(prev.map((i) => (i.productId === productId ? { ...i, quantity: next } : i)))
      persist((uid) => upsertCartItem(uid, productId, next))

      return { capped: next < qty }
    },
    [applyItems, persist]
  )

  const remove = useCallback(
    (productId) => {
      const prev = itemsRef.current ?? []
      const found = prev.find((i) => i.productId === productId)
      applyItems(prev.filter((i) => i.productId !== productId))
      persist((uid) => deleteCartItem(uid, productId))
      flashNotice(found ? 'Item removed from cart.' : 'Item removed.')
    },
    [applyItems, flashNotice, persist]
  )

  // Called after a successful order, so this clears the cart ROWS server-side,
  // not just the screen — the web app sees the emptied cart too.
  const clear = useCallback(() => {
    applyItems([])
    persist((uid) => clearCart(uid))
  }, [applyItems, persist])

  const value = useMemo(() => {
    const list = items ?? []
    const count = list.reduce((sum, i) => sum + i.quantity, 0)
    const subtotal = list.reduce((sum, i) => sum + i.price * i.quantity, 0)
    return {
      items: list,
      ready: items !== null,
      count,
      subtotal,
      total: subtotal,
      notice,
      add,
      updateQuantity,
      remove,
      clear,
      flashNotice
    }
  }, [items, notice, add, updateQuantity, remove, clear, flashNotice])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
