// Phase 7 — Mailgun confirmation email helper (server only).
// Called ONLY from api/create-order.js. Never expose via api/ — anything in
// api/ is publicly callable and would let strangers send mail from this domain.
// Uses plain fetch with form-encoded body, no SDK (per AGENTS.md Sec 10).
// Returns true if Mailgun accepted the message, false otherwise.
// Email failure must NEVER cancel the order — caller catches and sets emailSent=false.

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatNaira(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(amount)
}

export async function sendOrderConfirmation({ to, customerName, orderNumber, items, total, status }) {
  const apiKey = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN
  const from = process.env.MAILGUN_FROM
  const baseUrl = process.env.MAILGUN_API_BASE_URL || 'https://api.mailgun.net'

  if (!apiKey || !domain || !from) {
    console.error('Mailgun is not configured (MAILGUN_API_KEY / MAILGUN_DOMAIN / MAILGUN_FROM).')
    return false
  }

  const safeName = escapeHtml(customerName)
  const safeOrder = escapeHtml(orderNumber)
  const safeStatus = escapeHtml(status || 'pending')
  const safeTotal = formatNaira(total)

  const lines = items.map((item) => {
    const name = escapeHtml(item.name)
    const lineTotal = formatNaira(item.price * item.quantity)
    return `- ${name} x ${item.quantity} @ ${formatNaira(item.price)} = ${lineTotal}`
  })

  const text =
    `Hi ${customerName},\n\n` +
    `Thanks for your order from My Shop.\n\n` +
    `Order number: ${orderNumber}\n` +
    `Status: ${status || 'pending'}\n\n` +
    `Items:\n${lines.join('\n')}\n\n` +
    `Total: ${safeTotal}\n\n` +
    `You can find this order under Orders in your account.`

  const rows = items
    .map((item) => {
      const name = escapeHtml(item.name)
      const lineTotal = formatNaira(item.price * item.quantity)
      return `<tr><td>${name}</td><td>${item.quantity}</td><td>${formatNaira(item.price)}</td><td>${lineTotal}</td></tr>`
    })
    .join('')

  const html =
    `<p>Hi ${safeName},</p>` +
    `<p>Thanks for your order from My Shop.</p>` +
    `<p>Order number: <strong>${safeOrder}</strong><br>Status: ${safeStatus}</p>` +
    `<table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Line total</th></tr></thead><tbody>${rows}</tbody></table>` +
    `<p>Total: <strong>${safeTotal}</strong></p>` +
    `<p>You can find this order under Orders in your account.</p>`

  const body = new URLSearchParams({
    from,
    to,
    subject: `My Shop order ${orderNumber} confirmed`,
    text,
    html
  })

  try {
    const credentials = Buffer.from(`api:${apiKey}`).toString('base64')
    const response = await fetch(`${baseUrl}/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error(`Mailgun rejected the message (${response.status}): ${detail.slice(0, 300)}`)
      return false
    }
    return true
  } catch (err) {
    console.error(`Mailgun send failed: ${err.message}`)
    return false
  }
}
