import { supabase } from '../lib/supabase.js'

// The phone talks to the SAME production endpoint as the web app
// (AGENTS.md Sec 9). The value comes from mobile/.env.
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || ''

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
// The app sends NO prices and NO totals — the server is the sole authority on
// pricing, stock and the final total.
//
// Returns { orderId, orderNumber, emailSent }.
export async function createOrder({ customer, items, idempotencyKey }) {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new OrderError('You are signed out. Please sign in again.', { status: 401 })
  }

  const response = await fetch(API_BASE + '/api/create-order', {
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

// RLS lets each customer SELECT their own orders only, so a plain query with
// the anon client is safe — no user filter needed here.
export async function listMyOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, total_amount, status, created_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error('We could not load your orders. Please try again.')
  return data ?? []
}
