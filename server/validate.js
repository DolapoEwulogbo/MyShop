// server/validate.js
// Body validation for POST /api/create-order (AGENTS.md Sec 9, step 3).
// Pure functions only: no Supabase, no network, no secrets. Returns per-field
// messages so the browser can highlight exactly which inputs need fixing.
//
// Contract: validateOrderBody(body) -> { valid: true, value } | { valid: false, fieldErrors }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MAX_ITEMS = 50
const MIN_QUANTITY = 1
const MAX_QUANTITY = 99
const MAX_IDEMPOTENCY_LENGTH = 64

export function validateOrderBody(body) {
  const fieldErrors = {}
  const source = body && typeof body === 'object' ? body : {}
  const customer = source.customer && typeof source.customer === 'object' ? source.customer : {}

  // ---- customer fields (non-empty name/phone/address, valid email) ----
  const fullName = typeof customer.fullName === 'string' ? customer.fullName.trim() : ''
  const email = typeof customer.email === 'string' ? customer.email.trim() : ''
  const phone = typeof customer.phone === 'string' ? customer.phone.trim() : ''
  const deliveryAddress =
    typeof customer.deliveryAddress === 'string' ? customer.deliveryAddress.trim() : ''

  if (!fullName) fieldErrors.fullName = 'Please enter your full name.'
  if (!EMAIL_RE.test(email)) fieldErrors.email = 'Please enter a valid email address.'
  if (!phone) fieldErrors.phone = 'Please enter your phone number.'
  if (!deliveryAddress) fieldErrors.deliveryAddress = 'Please enter a delivery address.'

  // ---- idempotencyKey: non-empty string, max 64 chars ----
  const idempotencyKey =
    typeof source.idempotencyKey === 'string' ? source.idempotencyKey.trim() : ''
  if (!idempotencyKey || idempotencyKey.length > MAX_IDEMPOTENCY_LENGTH) {
    fieldErrors.idempotencyKey =
      'A valid order request key is required (non-empty, max 64 characters).'
  }

  // ---- items: 1-50 entries, each an integer quantity 1-99 ----
  const rawItems = source.items
  const items = []

  if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > MAX_ITEMS) {
    fieldErrors.items = `Your cart must contain between 1 and ${MAX_ITEMS} items.`
  } else {
    rawItems.forEach((item) => {
      const productId = item && typeof item.productId === 'string' ? item.productId.trim() : ''
      const quantity = Number(item?.quantity)

      if (!productId) {
        fieldErrors.items = 'Each item needs a valid product reference.'
      } else if (!Number.isInteger(quantity) || quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
        fieldErrors.items = `Each item quantity must be a whole number between ${MIN_QUANTITY} and ${MAX_QUANTITY}.`
      } else {
        // NOTE: only productId + quantity survive. Prices and totals are never
        // accepted from the browser — the database function sets the real ones.
        items.push({ productId, quantity })
      }
    })
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { valid: false, fieldErrors }
  }

  return {
    valid: true,
    value: {
      idempotencyKey,
      customer: { fullName, email, phone, deliveryAddress },
      items
    }
  }
}