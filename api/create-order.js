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
    customerPhone,
    deliveryAddress,
    items,
    idempotencyKey
  } = req.body || {}

  if (
    typeof customerName !== 'string' ||
    !customerName.trim() ||
    typeof customerPhone !== 'string' ||
    !customerPhone.trim() ||
    typeof deliveryAddress !== 'string' ||
    !deliveryAddress.trim()
  ) {
    return send(res, 400, {
      error: 'Name, phone number, and delivery address are required.'
    })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return send(res, 400, {
      error: 'Your cart is empty.'
    })
  }

  if (
    typeof idempotencyKey !== 'string' ||
    !idempotencyKey.trim()
  ) {
    return send(res, 400, {
      error: 'A valid order request key is required.'
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
      item.quantity < 1
  )

  if (invalidItem) {
    return send(res, 400, {
      error: 'One or more cart items are invalid.'
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
      p_customer_email: user.email || '',
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
        error: message.replace('INVALID_ITEMS:', '').trim()
      })
    }

    if (message.startsWith('PRODUCT_NOT_FOUND:')) {
      return send(res, 404, {
        error: 'One or more products are no longer available.'
      })
    }

    if (message.startsWith('INSUFFICIENT_STOCK:')) {
      return send(res, 409, {
        error: message.replace('INSUFFICIENT_STOCK:', '').trim()
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