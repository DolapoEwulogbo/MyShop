const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mirrors server/validate.js so the customer gets instant per-field feedback.
// This is UX only — the server re-validates authoritatively (AGENTS.md Sec 9).
export function validateCheckoutFields({ fullName, email, phone, deliveryAddress, items }) {
  const errors = {}
  if (!fullName.trim()) errors.fullName = 'Please enter your full name.'
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address.'
  if (!phone.trim()) errors.phone = 'Please enter your phone number.'
  if (!deliveryAddress.trim()) errors.deliveryAddress = 'Please enter a delivery address.'
  if (items.length < 1 || items.length > 50) {
    errors.items = 'Your cart must contain between 1 and 50 items.'
  }
  return errors
}
