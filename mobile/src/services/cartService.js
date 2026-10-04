import { supabase } from '../lib/supabase.js'

// Server-backed cart (Phase: live cart).
//
// The cart lives in public.cart_items (user_id, product_id, quantity) and is
// joined to public.products for the display fields. The browser uses its own
// anon client with RLS: a customer may only touch their own rows, so there is
// no way for one shopper to read or edit another's cart.
//
// This module is the ONLY place that queries cart_items. Components and pages
// never touch the table directly (AGENTS.md Sec 4 layering rule).
//
// Only product_id and quantity are stored server-side. Name, price, image and
// stock are ALWAYS re-read from products on load, so a cart can never show a
// stale price -- the same rule orders follow (price at purchase time).

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x600?text=No+Image'
const PRODUCT_COLUMNS = 'id, name, price, image_url, stock'

// Keep one item's quantity inside 1..stock. A product with 0 stock still shows
// as a row (flagged Out of Stock by the UI) and stays at quantity 1, which is
// what the old localStorage cart did.
function clampQuantity(quantity, stock) {
  const qty = Number.isFinite(quantity) ? Math.floor(quantity) : 1
  const max = Math.max(Number.isFinite(stock) ? Math.floor(stock) : 0, 1)
  return Math.min(Math.max(qty, 1), max)
}

function toCartItem(productId, quantity, product) {
  const stock = Number.isFinite(product?.stock) ? Math.max(0, Math.floor(product.stock)) : 0
  return {
    productId,
    name: typeof product?.name === 'string' ? product.name : 'Product',
    price: Number.isFinite(product?.price) ? Math.floor(product.price) : 0,
    imageUrl: typeof product?.image_url === 'string' && product.image_url ? product.image_url : PLACEHOLDER_IMAGE,
    stock,
    quantity: clampQuantity(quantity, stock)
  }
}

function cartError(action) {
  return new Error('We could not ' + action + ' your cart. Please try again.')
}

// The cart rows joined to products in one round trip. This needs a foreign key
// from cart_items.product_id to products.id for PostgREST to embed it; if that
// FK is ever absent the select errors and we fall back to two queries rather
// than returning an empty cart.
export async function listCartItems(userId) {
  if (!userId) return []

  const { data, error } = await supabase
    .from('cart_items')
    .select('product_id, quantity, products(' + PRODUCT_COLUMNS + ')')
    .eq('user_id', userId)

  if (!error && Array.isArray(data)) {
    return data.map((row) => toCartItem(row.product_id, row.quantity, row.products))
  }

  const { data: rows, error: rowsError } = await supabase
    .from('cart_items')
    .select('product_id, quantity')
    .eq('user_id', userId)
  if (rowsError) throw cartError('load')

  const ids = [...new Set(rows.map((row) => row.product_id))]
  if (ids.length === 0) return []

  const { data: products } = await supabase.from('products').select(PRODUCT_COLUMNS).in('id', ids)
  const byId = new Map((products ?? []).map((product) => [product.id, product]))
  return rows.map((row) => toCartItem(row.product_id, row.quantity, byId.get(row.product_id)))
}

// Insert or update a single line. The table's primary key is
// (user_id, product_id), so this is the merge the client wants.
export async function upsertCartItem(userId, productId, quantity) {
  if (!userId) return
  const { error } = await supabase
    .from('cart_items')
    .upsert(
      { user_id: userId, product_id: productId, quantity: clampQuantity(quantity, Number.MAX_SAFE_INTEGER) },
      { onConflict: 'user_id,product_id' }
    )
  if (error) throw cartError('update')
}

export async function deleteCartItem(userId, productId) {
  if (!userId) return
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
  if (error) throw cartError('update')
}

export async function clearCart(userId) {
  if (!userId) return
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId)
  if (error) throw cartError('update')
}

// First sign-in with a non-empty guest cart: fold those lines into the account
// cart by SUMMING quantities against what is already stored, then clamp to the
// product's CURRENT stock. Products that no longer exist are dropped.
export async function mergeGuestCart(userId, guestItems) {
  if (!userId || !Array.isArray(guestItems) || guestItems.length === 0) return

  const ids = [...new Set(guestItems.map((item) => item.productId).filter(Boolean))]
  if (ids.length === 0) return

  const [{ data: current }, { data: products }] = await Promise.all([
    supabase.from('cart_items').select('product_id, quantity').eq('user_id', userId),
    supabase.from('products').select('id, stock').in('id', ids)
  ])

  const storedQty = new Map((current ?? []).map((row) => [row.product_id, row.quantity]))
  const stockById = new Map((products ?? []).map((product) => [product.id, product.stock]))

  const rows = []
  for (const item of guestItems) {
    if (!item?.productId) continue
    const stock = stockById.get(item.productId)
    if (stock === undefined) continue
    const summed = (storedQty.get(item.productId) ?? 0) + item.quantity
    rows.push({ user_id: userId, product_id: item.productId, quantity: clampQuantity(summed, stock) })
  }

  if (rows.length === 0) return
  const { error } = await supabase
    .from('cart_items')
    .upsert(rows, { onConflict: 'user_id,product_id' })
  if (error) throw cartError('merge')
}