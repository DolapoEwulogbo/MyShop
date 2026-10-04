// server/email.js
// Order confirmation emails via Resend's HTTP API — plain fetch, no SDK.
// Replaced Mailgun (now paid): same contract, different provider.
// Server-only: imported by api/create-order.js, never by anything under src/.

const STORE_NAME = 'My Shop'

// Resend's test sender: delivers only to the address on your Resend account
// until you verify a custom domain, then RESEND_FROM can use it.
const RESEND_API_URL = 'https://api.resend.com/emails'
const DEFAULT_FROM = `${STORE_NAME} <onboarding@resend.dev>`

const resendApiKey = process.env.RESEND_API_KEY
const resendFrom = process.env.RESEND_FROM || DEFAULT_FROM

// Like supabaseAdmin, exposes only a boolean so api/create-order.js can decide
// to skip email without leaking which env vars exist.
export const isEmailConfigured = Boolean(resendApiKey)

// Every piece of user-provided text that goes into the HTML body must be
// escaped — the customer's own name and product names come from outside.
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatNaira(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(amount)
}

// Builds the plain-text and HTML bodies for one order. `order` is the orders
// row (customer_name, customer_email, order_number, total_amount, status);
// `items` are order_items rows with their embedded `products` (name).
// Content per PRD Sec 7: name, order number, items, total, status, store name.
function buildContent(order, items) {
  const name = order.customer_name
  const orderNumber = order.order_number
  const lines = (items || []).map((item) => ({
    productName: item.products?.name || 'Item',
    quantity: item.quantity,
    price: item.price,
    lineTotal: item.price * item.quantity
  }))

  const text = [
    `Hi ${name},`,
    '',
    `Thanks for your order at ${STORE_NAME}!`,
    '',
    `Order number: ${orderNumber}`,
    '',
    ...lines.map(
      (line) =>
        `- ${line.productName} x ${line.quantity} — ${formatNaira(line.price)} each — ${formatNaira(line.lineTotal)}`
    ),
    '',
    `Total: ${formatNaira(order.total_amount)}`,
    `Status: ${order.status}`,
    '',
    "We'll be in touch about delivery.",
    '',
    `— ${STORE_NAME}`
  ].join('\n')

  const html = [
    `<p>Hi ${escapeHtml(name)},</p>`,
    `<p>Thanks for your order at <strong>${STORE_NAME}</strong>!</p>`,
    `<p>Order number: <strong>${escapeHtml(String(orderNumber))}</strong></p>`,
    '<table cellpadding="6" style="border-collapse:collapse">',
    '<thead><tr><th align="left">Item</th><th align="right">Qty</th><th align="right">Price</th><th align="right">Total</th></tr></thead>',
    '<tbody>',
    ...lines.map(
      (line) =>
        `<tr><td>${escapeHtml(line.productName)}</td><td align="right">${line.quantity}</td>` +
        `<td align="right">${escapeHtml(formatNaira(line.price))}</td>` +
        `<td align="right">${escapeHtml(formatNaira(line.lineTotal))}</td></tr>`
    ),
    '</tbody>',
    '</table>',
    `<p>Total: <strong>${escapeHtml(formatNaira(order.total_amount))}</strong></p>`,
    `<p>Status: ${escapeHtml(order.status)}</p>`,
    `<p>We'll be in touch about delivery.</p>`,
    `<p>— ${STORE_NAME}</p>`
  ].join('\n')

  return { text, html }
}

// Sends the confirmation. Resolves true when Resend accepted the message;
// throws on any failure so the caller can keep the order successful regardless
// (AGENTS.md Sec 9 step 6: email failure never cancels an order).
export async function sendOrderConfirmation(order, items) {
  if (!isEmailConfigured) {
    throw new Error('Email is not configured (missing RESEND_API_KEY).')
  }

  const { text, html } = buildContent(order, items)

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [order.customer_email],
      subject: `${STORE_NAME} — order ${order.order_number} confirmed`,
      text,
      html
    })
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Resend responded ${response.status}: ${detail.slice(0, 200)}`)
  }

  return true
}
