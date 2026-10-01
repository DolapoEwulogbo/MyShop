import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function send(res, status, body) {
  return res.status(status).json(body)
}

function getBearerToken(req) {
  const header = req.headers.authorization || ''

  if (!header.startsWith('Bearer ')) {
    return null
  }

  return header.slice(7)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return send(res, 405, {
      error: 'Method not allowed.'
    })
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return send(res, 500, {
      error: 'Server configuration is incomplete.'
    })
  }

  const token = getBearerToken(req)

  if (!token) {
    return send(res, 401, {
      error: 'Authentication required.'
    })
  }

  // Use the user's access token to verify the authenticated customer.
  const authClient = createClient(
    supabaseUrl,
    supabaseAnonKey
  )

  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser(token)

  if (userError || !user) {
    return send(res, 401, {
      error: 'Invalid or expired session.'
    })
  }

  const {
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    items,
    idempotencyKey
  } = req.body || {}

  const fieldErrors = {}

  if (typeof customerName !== 'string' || !customerName.trim()) {
    fieldErrors.customerName = 'Please enter your full name.'
  }

  if (
    typeof customerEmail !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())
  ) {
    fieldErrors.customerEmail = 'Please enter a valid email address.'
  }

  if (typeof customerPhone !== 'string' || !customerPhone.trim()) {
    fieldErrors.customerPhone = 'Please enter your phone number.'
  }

  if (typeof deliveryAddress !== 'string' || !deliveryAddress.trim()) {
    fieldErrors.deliveryAddress = 'Please enter your delivery address.'
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    fieldErrors.items = 'Your cart must contain between 1 and 50 items.'
  }

  if (
    typeof idempotencyKey !== 'string' ||
    !idempotencyKey.trim() ||
    idempotencyKey.trim().length > 64
  ) {
    fieldErrors.idempotencyKey =
      'A valid order request key is required (non-empty, max 64 characters).'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return send(res, 400, {
      error: 'Please fix the highlighted fields and try again.',
      fieldErrors
    })
  }

  const cleanItems = items.map((item) => ({
    productId: item?.productId,
    quantity: Number(item?.quantity)
  }))

  const invalidItem = cleanItems.find(
    (item) =>
      typeof item.productId !== 'string' ||
      !item.productId ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
  )

  if (invalidItem) {
    return send(res, 400, {
      error: 'One or more cart items are invalid. Quantity must be 1-99.',
      fieldErrors: { items: 'Each item needs a valid product and quantity 1-99.' }
    })
  }

  // Keep one line per product in the browser request.
  const uniqueProductIds = [
    ...new Set(cleanItems.map((item) => item.productId))
  ]

  if (uniqueProductIds.length !== cleanItems.length) {
    return send(res, 400, {
      error: 'Duplicate products are not allowed in the order.'
    })
  }

  // Service-role client is used only on the server.
  const supabase = createClient(
    supabaseUrl,
    supabaseServiceRoleKey
  )

  // Idempotency check prevents accidental duplicate orders.
  const {
    data: existingOrder,
    error: existingOrderError
  } = await supabase
    .from('orders')
    .select('id, order_number, total_amount, status')
    .eq('user_id', user.id)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  if (existingOrderError) {
    console.error(existingOrderError)

    return send(res, 500, {
      error: 'We could not check the order request.'
    })
  }

  if (existingOrder) {
    return send(res, 200, {
      success: true,
      duplicate: true,
      order: existingOrder
    })
  }

  // The database function is the final authority for:
  // - product existence
  // - current price
  // - stock
  // - stock decrement
  // - order total
  // - order item prices
  // - duplicate protection
  const { data: order, error: orderError } = await supabase.rpc(
    'create_order',
    {
      p_user_id: user.id,
      p_idempotency_key: idempotencyKey.trim(),
      p_customer_name: customerName.trim(),
      p_customer_email: customerEmail.trim(),
      p_customer_phone: customerPhone.trim(),
      p_delivery_address: deliveryAddress.trim(),
      p_items: cleanItems
    }
  )

  if (orderError) {
    console.error(orderError)

    const message = orderError.message || ''

    if (message.startsWith('INVALID_ITEMS:')) {
      return send(res, 400, {
        error: message.replace('INVALID_ITEMS:', '').trim(),
        code: 'INVALID_ITEMS'
      })
    }

    if (message.startsWith('PRODUCT_NOT_FOUND:')) {
      return send(res, 409, {
        error: 'One or more products are no longer available.',
        code: 'PRODUCT_NOT_FOUND'
      })
    }

    if (message.startsWith('INSUFFICIENT_STOCK:')) {
      return send(res, 409, {
        error: message.replace('INSUFFICIENT_STOCK:', '').trim(),
        code: 'INSUFFICIENT_STOCK'
      })
    }

    return send(res, 500, {
      error: 'We could not place your order. Please try again.'
    })
  }

  return send(res, 201, {
    success: true,
    duplicate: order?.created === false,
    order
  })
}