// api/create-order.js — the ONLY public endpoint (AGENTS.md Sec 9).
// Uses the Web-standard handler signature idiomatic to Vercel Functions with a
// plain Node/ESM runtime. Node's default export gives us req/res like Express.
import { supabaseAdmin, isSupabaseAdminConfigured } from '../server/supabaseAdmin.js'
import { validateOrderBody } from '../server/validate.js'

// ---------------------------------------------------------------------------
// PHASE 7 HOOK — the confirmation email is NOT sent in Phase 6.
//
// Phase 7 will, only when the order was newly created (created === true):
//   1. import { sendOrderConfirmation } from '../server/email.js'
//   2. load the order, its items and product names with supabaseAdmin
//   3. call sendOrderConfirmation(...) inside its own try/catch, so a Mailgun
//      failure can never cancel a successful order.
// Until then emailSent is always false. See AGENTS.md Sec 9 step 6 / Sec 10.
// ---------------------------------------------------------------------------

function send(res, status, body) {
  return res.status(status).json(body)
}

// "Bearer <token>" -> "<token>", or null when absent/malformed.
function getBearerToken(req) {
  const header = req.headers?.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  return token || null
}

export default async function handler(req, res) {
  // 1. Only POST.
  if (req.method !== 'POST') {
    return send(res, 405, { message: 'Method not allowed.' })
  }

  // 2. Server must be configured. Generic message only — never reveal env state.
  if (!isSupabaseAdminConfigured) {
    console.error('create-order: Supabase admin env vars are missing.')
    return send(res, 500, { message: 'We could not place your order. Please try again.' })
  }

  // 3. The bearer token is the ONLY proof of identity.
  const token = getBearerToken(req)
  if (!token) {
    return send(res, 401, { message: 'Authentication required. Please sign in and try again.' })
  }

  const {
    data: { user },
    error: userError
  } = await supabaseAdmin.auth.getUser(token)

  if (userError || !user) {
    console.error('getUser failed:', userError?.message, userError?.status)
    return send(res, 401, { message: 'Your session has expired. Please sign in again.' })
  }
  // user.id (from the verified token) is the sole source of user_id.
  // It is deliberately never read from the request body.

  // 4. Validate the body — per-field messages on failure.
  const validation = validateOrderBody(req.body)
  if (!validation.valid) {
    return send(res, 400, {
      message: 'Please fix the highlighted fields and try again.',
      fieldErrors: validation.fieldErrors
    })
  }

  const { idempotencyKey, customer, items } = validation.value

  // 5. One transaction in the database: idempotency, stock check + decrement,
  //    order + item inserts, authoritative total. Parameter names must match
  //    supabase/migrations/002_create_order_function.sql exactly.
  const { data: order, error: rpcError } = await supabaseAdmin.rpc('create_order', {
    p_user_id: user.id,
    p_idempotency_key: idempotencyKey,
    p_customer_name: customer.fullName,
    p_customer_email: customer.email,
    p_customer_phone: customer.phone,
    p_delivery_address: customer.deliveryAddress,
    p_items: items
  })

  if (rpcError) {
    // Log server-side only. Never return stacks or internals to the client.
    console.error('create_order failed:', rpcError.message)
    const message = rpcError.message || ''

    if (message.startsWith('INSUFFICIENT_STOCK')) {
      return send(res, 409, {
        code: 'INSUFFICIENT_STOCK',
        message: message.replace('INSUFFICIENT_STOCK:', '').trim()
      })
    }

    if (message.startsWith('PRODUCT_NOT_FOUND')) {
      return send(res, 409, {
        code: 'PRODUCT_NOT_FOUND',
        message: 'One or more items in your cart are no longer available.'
      })
    }

    if (message.startsWith('INVALID_ITEMS')) {
      return send(res, 400, {
        code: 'INVALID_ITEMS',
        message: message.replace('INVALID_ITEMS:', '').trim() || 'Your cart is not valid.'
      })
    }

    return send(res, 500, { message: 'We could not place your order. Please try again.' })
  }

  // 6. Email — Phase 7 only. `created === false` means this idempotency key was
  //    already used, so a repeat never sends a second email.
  let emailSent = false
  if (order?.created === true) {
    // PHASE 7 HOOK: send the confirmation email here (see the header comment).
    emailSent = false
  }

  // 7. Success.
  return send(res, 200, {
    orderId: order?.order_id,
    orderNumber: order?.order_number,
    emailSent
  })
}