import { supabase } from '../lib/supabase.js'

// Typed error so Checkout can act on status/code/fieldErrors without inspecting
// the raw Response. Extends Error so `err.message` still works everywhere.
export class OrderError extends Error {
  constructor(message, { status, code, fieldErrors } = {}) {
    super(message)
    this.name = 'OrderError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

// POSTs an order to /api/create-order using the caller's Supabase access token.
// The browser sends NO prices and NO totals — the server is the sole authority
// on pricing, stock and the final total (AGENTS.md Sec 9).
//
// Returns { orderId, orderNumber, emailSent }.
export async function createOrder({ customer, items, idempotencyKey }) {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new OrderError('Your session has expired. Please sign in again.', { status: 401 })
  }

  const response = await fetch('/api/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      idempotencyKey,
      customer: {
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        deliveryAddress: customer.deliveryAddress
      },
      // Strip anything else off the cart items (e.g. price/stock held locally).
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
    })
  })

  // Error paths (e.g. a proxy returning HTML) are not always JSON — never crash.
  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new OrderError(data?.message || 'We could not place your order. Please try again.', {
      status: response.status,
      code: data?.code,
      fieldErrors: data?.fieldErrors
    })
  }

  return {
    orderId: data?.orderId,
    orderNumber: data?.orderNumber,
    emailSent: data?.emailSent === true
  }
}