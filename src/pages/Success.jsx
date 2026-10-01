import { useParams } from 'react-router-dom'

// Phase 1 placeholder — success page arrives in Phase 6.
export default function Success() {
  const { orderId } = useParams()
  return (
    <section className="placeholder">
      <h1>Order Placed</h1>
      <p>Phase 1 placeholder: order {orderId} confirmation arrives in Phase 6.</p>
    </section>
  )
}
