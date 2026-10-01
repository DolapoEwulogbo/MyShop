export function formatNaira(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(amount)
}

export function getAvailability(stock) {
  if (stock <= 0) return { label: 'Out of Stock', tone: 'out' }
  if (stock <= 5) return { label: `Low Stock — Only ${stock} left`, tone: 'low' }
  return { label: 'In Stock', tone: 'in' }
}
