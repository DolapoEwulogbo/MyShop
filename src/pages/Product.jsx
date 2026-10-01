import { useParams } from 'react-router-dom'

// Phase 1 placeholder — details page arrives in Phase 2.
export default function Product() {
  const { id } = useParams()
  return (
    <section className="placeholder">
      <h1>Product {id}</h1>
      <p>Phase 1 placeholder: product details arrive in Phase 2.</p>
    </section>
  )
}
